import { NextResponse } from "next/server";
import { canEdit, getCurrentUser } from "@/lib/auth";
import {
  MODEL_CHAIN,
  MODEL_CHAIN_VISAO,
  MODEL_CHAIN_AUDIO,
} from "@/lib/chat-models";
import {
  montarConteudo,
  anexoValido,
  tipoDeConversa,
  type Anexo,
} from "@/lib/suporte-anexo";
import { rateLimit, tooManyRequests, payloadTooLarge } from "@/lib/rate-limit";
import {
  getConhecimento,
  getConversa,
  salvarConversa,
  anotarLacuna,
  type Conversa,
} from "@/lib/suporte-store";
import {
  montarPrompt,
  lerResposta,
  pediuHumano,
  resumoPraAtendente,
  pareceRaciocinio,
} from "@/lib/suporte-prompt";
import { logAnonymousActivity } from "@/lib/activity-log";
import {
  acharEmail,
  ehProblemaDeAcesso,
  avaliarAcesso,
  fatosDoAcesso,
  saudacao,
} from "@/lib/suporte-acesso";
import { todasAsCompras } from "@/lib/hotmart-store";
import { pedirReenvio } from "@/lib/reenvio-store";
import { escolherProvedor, recadoDeLimite } from "@/lib/ia-provedor";
import {
  paraGeminiNativo,
  urlNativa,
  lerRespostaNativa,
  erroNativo,
} from "@/lib/gemini-nativo";

/**
 * O cérebro do suporte.
 *
 * ⚠️ Fase 1: roda só dentro do painel, com login. **Não está ligado a nenhum
 * WhatsApp** — isso é decisão de depois, e o James já sabe que conectar com
 * biblioteca não oficial arrisca banir o número dele.
 *
 * Quem responde é escolhido em `lib/ia-provedor.ts`: **Gemini se houver
 * `GEMINI_API_KEY`**, senão a mesma cadeia gratuita da OpenRouter usada pelo
 * chat do PMU CLASS. A troca é por variável de ambiente porque a cota grátis da
 * OpenRouter (~50 mensagens/dia) acabou no primeiro dia de teste.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!canEdit(me)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  if (payloadTooLarge(req, 14 * 1024 * 1024)) {
    return NextResponse.json({ error: "Mensagem muito grande" }, { status: 413 });
  }
  if (!(await rateLimit("suporte", req, 30, 60)).ok) {
    return tooManyRequests() as NextResponse;
  }

  const body = (await req.json().catch(() => null)) as {
    conversaId?: string;
    texto?: string;
    anexos?: Anexo[];
  } | null;
  const texto = (body?.texto ?? "").trim();
  const anexos = (body?.anexos ?? []).slice(0, 3);
  // Print sem legenda é comum: manda a imagem e pronto. Só barra se não veio
  // nada mesmo.
  if (!texto && !anexos.length) {
    return NextResponse.json({ error: "Sem mensagem" }, { status: 400 });
  }
  for (const a of anexos) {
    const v = anexoValido(a);
    if (!v.ok) return NextResponse.json({ error: v.erro }, { status: 400 });
  }

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
  conversa.mensagens.push({
    de: "aluno",
    texto: texto || (tipoDeConversa(anexos) === "audio" ? "(áudio)" : "(imagem)"),
    em: agora,
  });

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
    await logAnonymousActivity(
      "suporte.humano",
      conversa.quem,
      id,
      resumoPraAtendente(conversa.mensagens)
    ).catch(() => {});
    return NextResponse.json({
      reply: "Claro, já estou chamando alguém do time pra falar com você.",
      precisaHumano: true,
      conversaId: id,
    });
  }

  const provedor = escolherProvedor(process.env, {
    texto: MODEL_CHAIN,
    imagem: MODEL_CHAIN_VISAO,
    audio: MODEL_CHAIN_AUDIO,
  });
  if (!provedor) {
    return NextResponse.json(
      {
        error:
          "Nenhuma chave de IA configurada. Coloque GEMINI_API_KEY (recomendado) ou OPENROUTER_API_KEY.",
      },
      { status: 503 }
    );
  }

  // ── O caso mais comum: "não consigo acessar" ────────────────────────────
  //
  // ⚠️ A decisão é tomada AQUI, em código, e não pelo modelo. Ele recebe a
  // conclusão pronta e só escreve a frase. Data de compra e prazo de 12 meses
  // são conta — se um modelo gratuito errasse essa conta, diria "seu acesso
  // está ativo" pra quem não tem, e a aluna ficaria tentando entrar.
  const emailNaMensagem = acharEmail(texto);
  if (emailNaMensagem) conversa.emailAluna = emailNaMensagem;
  if (ehProblemaDeAcesso(texto)) conversa.assuntoAcesso = true;

  let fatos = "";
  let humanoPorRegra = false;
  if (conversa.assuntoAcesso) {
    const compras = conversa.emailAluna
      ? await todasAsCompras(conversa.emailAluna).catch(() => [])
      : [];
    const situacao = avaliarAcesso(
      conversa.emailAluna ?? null,
      compras.map((c) => ({
        produto: c.produto,
        compradaEm: c.compradaEm,
        situacao: c.situacao,
        nome: c.nome,
      }))
    );
    fatos = fatosDoAcesso(situacao);

    // Acesso válido = só falta reenviar o e-mail, e isso é clique humano na
    // Hotmart (não tem API). Entra na fila pra não se perder na conversa.
    if (situacao.tipo === "no-prazo") {
      await pedirReenvio({
        email: situacao.email,
        nome: compras.find((c) => c.nome)?.nome,
        produtos: [...new Set(situacao.compras.map((c) => c.produto))],
        venceEm: situacao.venceEm,
        pedidoEm: new Date().toISOString(),
      }).catch(() => {});
    }
    // Quem decide chamar uma pessoa aqui é a regra, não o modelo.
    humanoPorRegra =
      situacao.tipo === "no-prazo" ||
      situacao.tipo === "vencido" ||
      situacao.tipo === "cancelado";
  }

  const conhecimento = await getConhecimento();
  const anteriores = conversa.mensagens.slice(-16, -1).map((m) => ({
    role: m.de === "aluno" ? "user" : "assistant",
    content: m.texto as string | Array<Record<string, unknown>>,
  }));
  const abertura =
    conversa.mensagens.filter((m) => m.de === "aluno").length === 1
      ? `

É o primeiro contato desta conversa. Agora é "${saudacao()}" em Brasília — abra com isso.`
      : "";
  const messages = [
    {
      role: "system",
      content:
        montarPrompt(conhecimento) +
        abertura +
        (fatos ? `

O QUE JÁ SABEMOS DESTA ALUNA (use, não invente)
${fatos}` : ""),
    },
    ...anteriores,
    // A última mensagem é a que carrega o print ou o áudio.
    { role: "user", content: montarConteudo(texto, anexos) },
  ];

  // ⚠️ Fila por tipo: na OpenRouter só alguns modelos enxergam imagem e só UM
  // ouve áudio, então mandar print pro modelo de texto faz ele responder no
  // escuro. No Gemini as três filas são o mesmo modelo — mas quem decide isso é
  // o provedor, não esta linha.
  const tipo = tipoDeConversa(anexos);
  const fila =
    tipo === "audio"
      ? provedor.filas.audio
      : tipo === "imagem"
        ? provedor.filas.imagem
        : provedor.filas.texto;

  // ⚠️ **Áudio no Gemini fala o formato NATIVO dele**, não o compatível.
  // Áudio de WhatsApp é `.ogg`, e a camada de compatibilidade recusa ogg com
  // 400 "Invalid audio format" — o nativo aceita (medido nos dois). Sem este
  // desvio, toda mensagem de voz de aluna cairia pra atendente.
  //
  // Só áudio: texto e print seguem no compatível, que funciona e é o mesmo
  // código da OpenRouter.
  const nativo = provedor.nome === "gemini" && tipo === "audio";

  // ⚠️ Folga de propósito nos 900: o raciocínio interno do modelo consome deste
  // mesmo teto, mesmo sendo descartado — com 400 a resposta visível cortava no
  // meio ("Vou pedir ao").
  const TEMPERATURA = 0.4;
  const TETO = 900;

  let limiteDiario = false;
  for (const model of fila) {
    try {
      const r = await fetch(
        nativo ? urlNativa(model) : provedor.endpoint,
        {
        method: "POST",
        headers: nativo
          ? {
              "Content-Type": "application/json",
              // O nativo não usa Bearer — quer a chave neste cabeçalho.
              // Mandar Bearer aqui dá 401 falando de OAuth, que manda procurar
              // problema de permissão onde é só o cabeçalho errado.
              "x-goog-api-key": provedor.chave,
            }
          : {
              "Content-Type": "application/json",
              Authorization: `Bearer ${provedor.chave}`,
              ...provedor.cabecalhos,
            },
        body: JSON.stringify(
          nativo
            ? paraGeminiNativo(messages, {
                temperature: TEMPERATURA,
                maxOutputTokens: TETO,
              })
            : {
                model,
                messages,
                temperature: TEMPERATURA,
                max_tokens: TETO,
                // Campos que só um dos fornecedores entende (ex.: `reasoning`,
                // da OpenRouter). Mandar pro outro derruba o pedido inteiro.
                ...provedor.extras,
              }
        ),
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) {
        const corpoErro = await r.text().catch(() => "");
        if (r.status === 400 || r.status === 404) {
          console.error(
            `[suporte] modelo "${model}" recusado por ${provedor.nome}${nativo ? " (nativo)" : ""} (${r.status}): ${erroNativo(corpoErro)}`
          );
        } else if (r.status === 429) {
          // ⚠️ Cota diária estourada. Sem esta distinção o erro sai como
          // "modelos indisponíveis", que manda procurar problema onde não tem —
          // foi o que aconteceu quando a conta grátis da OpenRouter (~50/dia)
          // acabou no primeiro dia de teste.
          console.error(
            `[suporte] limite diário de ${provedor.nome} atingido: ${corpoErro.slice(0, 200)}`
          );
          limiteDiario = true;
        } else {
          console.warn(`[suporte] ${model} falhou: ${r.status} ${corpoErro.slice(0, 120)}`);
        }
        continue;
      }
      const data = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      // Os dois formatos guardam a resposta em lugares diferentes.
      const bruta = nativo
        ? lerRespostaNativa(data)
        : data?.choices?.[0]?.message?.content;
      if (!bruta) continue;

      // ⚠️ Rascunho do modelo NUNCA chega na aluna. Aconteceu uma vez: veio
      // "We need to follow instructions. The user gave email..." em inglês, com
      // o nome dos nossos blocos internos no meio. Quando isso acontece o
      // prompt já foi ignorado, então não adianta pedir de novo — troca de
      // modelo.
      if (pareceRaciocinio(bruta)) {
        console.warn(`[suporte] ${model} devolveu raciocínio em vez de resposta — trocando de modelo.`);
        continue;
      }

      const { texto: resposta, precisaHumano } = lerResposta(bruta);
      conversa.mensagens.push({
        de: "ia",
        texto: resposta,
        em: new Date().toISOString(),
      });
      if (precisaHumano || humanoPorRegra) {
        conversa.aguardandoPessoa = true;
        // A pergunta vai pra fila de lacunas — é o que ela ainda não sabe.
        await anotarLacuna(texto).catch(() => {});
        // ⚠️ Notificação no sino do portal. Tem gente parada esperando resposta
        // do outro lado — se ficasse só marcado na tela, ninguém veria.
        // O resumo é pra pessoa chegar na conversa já sabendo o que houve, em
        // vez de ler tudo do começo.
        await logAnonymousActivity(
          "suporte.humano",
          conversa.quem,
          id,
          resumoPraAtendente(conversa.mensagens)
        ).catch(() => {});
      }
      await salvarConversa(conversa);

      return NextResponse.json({
        reply: resposta,
        precisaHumano: precisaHumano || humanoPorRegra,
        conversaId: id,
        model,
        provedor: provedor.nome,
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
    {
      error: limiteDiario
        ? recadoDeLimite(provedor.nome)
        : tipo === "audio"
          ? "Não consegui ouvir esse áudio agora. Vou passar pra uma pessoa."
          : "Todos os modelos gratuitos estão indisponíveis agora.",
    },
    { status: 503 }
  );
}
