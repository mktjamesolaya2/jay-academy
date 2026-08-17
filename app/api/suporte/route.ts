import { NextResponse } from "next/server";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { MODEL_CHAIN } from "@/lib/chat-models";
import { rateLimit, tooManyRequests, payloadTooLarge } from "@/lib/rate-limit";
import {
  getConhecimento,
  getConversa,
  salvarConversa,
  anotarLacuna,
  type Conversa,
} from "@/lib/suporte-store";
import { montarPrompt, lerResposta, pediuHumano } from "@/lib/suporte-prompt";

/**
 * O cérebro do suporte.
 *
 * ⚠️ Fase 1: roda só dentro do painel, com login. **Não está ligado a nenhum
 * WhatsApp** — isso é decisão de depois, e o James já sabe que conectar com
 * biblioteca não oficial arrisca banir o número dele.
 *
 * Usa a mesma cadeia de modelos gratuitos do chat do PMU CLASS
 * (`lib/chat-models.ts`), então custa zero enquanto ele treina. Trocar pra
 * OpenAI depois é mudar o endpoint e a chave — o resto continua igual.
 */

export const dynamic = "force-dynamic";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!canEdit(me)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  if (payloadTooLarge(req, 32 * 1024)) {
    return NextResponse.json({ error: "Mensagem muito grande" }, { status: 413 });
  }
  if (!(await rateLimit("suporte", req, 30, 60)).ok) {
    return tooManyRequests() as NextResponse;
  }

  const body = (await req.json().catch(() => null)) as {
    conversaId?: string;
    texto?: string;
  } | null;
  const texto = (body?.texto ?? "").trim();
  if (!texto) return NextResponse.json({ error: "Sem mensagem" }, { status: 400 });

  const id = body?.conversaId || `c-${Date.now()}`;
  const agora = new Date().toISOString();
  const conversa: Conversa = (await getConversa(id)) ?? {
    id,
    quem: "Teste",
    mensagens: [],
    aguardandoPessoa: false,
    criadaEm: agora,
    atualizadaEm: agora,
  };
  conversa.mensagens.push({ de: "aluno", texto, em: agora });

  // ⚠️ A IA fica CALADA depois que a conversa foi passada pra uma pessoa.
  // Quem reativa é o James, na tela. Se ela voltasse a responder sozinha,
  // atropelaria o atendimento humano no meio.
  if (conversa.aguardandoPessoa) {
    await salvarConversa(conversa);
    return NextResponse.json({ calada: true, conversaId: id });
  }

  // Pedido explícito de pessoa nem chega no modelo.
  if (pediuHumano(texto)) {
    conversa.aguardandoPessoa = true;
    conversa.mensagens.push({
      de: "ia",
      texto: "Claro, já estou chamando alguém do time pra falar com você.",
      em: new Date().toISOString(),
    });
    await salvarConversa(conversa);
    return NextResponse.json({
      reply: "Claro, já estou chamando alguém do time pra falar com você.",
      precisaHumano: true,
      conversaId: id,
    });
  }

  const chave = process.env.OPENROUTER_API_KEY;
  if (!chave) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY não configurada — funciona em produção." },
      { status: 503 }
    );
  }

  const conhecimento = await getConhecimento();
  const messages = [
    { role: "system", content: montarPrompt(conhecimento) },
    ...conversa.mensagens.slice(-16).map((m) => ({
      role: m.de === "aluno" ? "user" : "assistant",
      content: m.texto,
    })),
  ];

  for (const model of MODEL_CHAIN) {
    try {
      const r = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chave}`,
          // ⚠️ Só ASCII aqui. Cabeçalho HTTP não aceita acento nem traço longo:
          // com "Jay Academy — Suporte" o fetch estourava ANTES de sair da
          // máquina, nos 4 modelos, e o erro chegava como "todos os modelos
          // indisponíveis" — que manda procurar no lugar errado.
          "X-Title": "Jay Academy Suporte",
        },
        body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 400 }),
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) {
        if (r.status === 400 || r.status === 404) {
          console.error(
            `[suporte] modelo "${model}" recusado (${r.status}) — rodar "npm run checar-modelos".`
          );
        }
        continue;
      }
      const data = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const bruta = data?.choices?.[0]?.message?.content;
      if (!bruta) continue;

      const { texto: resposta, precisaHumano } = lerResposta(bruta);
      conversa.mensagens.push({
        de: "ia",
        texto: resposta,
        em: new Date().toISOString(),
      });
      if (precisaHumano) {
        conversa.aguardandoPessoa = true;
        // A pergunta vai pra fila de lacunas — é o que ela ainda não sabe.
        await anotarLacuna(texto).catch(() => {});
      }
      await salvarConversa(conversa);

      return NextResponse.json({
        reply: resposta,
        precisaHumano,
        conversaId: id,
        model,
      });
    } catch (e) {
      // ⚠️ NÃO engolir em silêncio. Um `catch {}` vazio aqui escondeu por meia
      // hora um erro banal (traço longo no cabeçalho): os 4 modelos falhavam
      // em milissegundos e a mensagem dizia "modelos indisponíveis", mandando
      // procurar na OpenRouter em vez de no nosso código.
      console.error(
        `[suporte] ${model} falhou:`,
        e instanceof Error ? e.message : e
      );
      continue;
    }
  }

  await salvarConversa(conversa);
  return NextResponse.json(
    { error: "Todos os modelos gratuitos estão indisponíveis agora." },
    { status: 503 }
  );
}
