import { NextResponse } from "next/server";
import { anexoValido, type Anexo } from "@/lib/suporte-anexo";
import {
  rateLimit,
  tooManyRequests,
  payloadTooLarge,
  isSameOrigin,
} from "@/lib/rate-limit";
import { responder } from "@/lib/suporte-cerebro";
import { lerVisitante, conversaPraAluna } from "@/lib/ajuda-visitante";
import { getConversa } from "@/lib/suporte-store";

/**
 * O atendimento da aluna — **rota aberta, sem login**.
 *
 * ⚠️ Esta é a única porta do suporte que a internet inteira alcança, então ela
 * é a que precisa de cuidado. Quatro camadas, e cada uma existe por um motivo
 * diferente:
 *
 * 1. **Mesma origem** — só o nosso próprio site chama. Sem isso, qualquer
 *    página do mundo poderia usar a nossa IA de graça, na nossa cota.
 * 2. **Limite por IP** — evita que uma pessoa só queime a cota do dia e deixe
 *    as alunas de verdade sem atendimento.
 * 3. **Teto de tamanho** — print e áudio são aceitos, mas não arquivo gigante.
 * 4. **O id da conversa é imprevisível** (`randomUUID`, ver `suporte-cerebro`).
 *    É ele que faz as vezes de senha: quem tem o link lê a conversa. Por isso
 *    ele nunca aparece em lugar nenhum além do navegador da própria aluna.
 *
 * O atendimento em si mora em `lib/suporte-cerebro.ts`, o mesmo que o chat de
 * teste do painel usa. Uma cópia separada aqui significaria corrigir uma regra
 * num lado e deixar errada justamente a que fala com aluna.
 */

export const dynamic = "force-dynamic";

/** Manda mensagem. Na primeira, vem também quem é. */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  }
  if (payloadTooLarge(req, 14 * 1024 * 1024)) {
    return NextResponse.json(
      { error: "Esse arquivo é grande demais. Manda um menor?" },
      { status: 413 }
    );
  }
  // ⚠️ Mais apertado que o do painel: aqui cada mensagem custa cota de IA, e
  // quem está do outro lado não fez login.
  if (!(await rateLimit("ajuda", req, 20, 120)).ok) {
    return tooManyRequests() as NextResponse;
  }

  const body = (await req.json().catch(() => null)) as {
    conversaId?: string;
    nome?: string;
    email?: string;
    texto?: string;
    anexos?: Anexo[];
  } | null;

  const anexos = (body?.anexos ?? []).slice(0, 3);
  for (const a of anexos) {
    const v = anexoValido(a);
    if (!v.ok) return NextResponse.json({ error: v.erro }, { status: 400 });
  }

  // Conversa nova exige identificação; conversa em andamento não pede de novo.
  let quem: string | undefined;
  let email: string | undefined;
  if (!body?.conversaId) {
    const v = lerVisitante(body);
    if (!v.ok) return NextResponse.json({ error: v.erro }, { status: 400 });
    quem = v.visitante.nome;
    email = v.visitante.email;
  }

  const r = await responder({
    conversaId: body?.conversaId,
    texto: body?.texto ?? "",
    anexos,
    quem,
    email,
  });

  if (r.tipo === "erro") {
    // ⚠️ Mesmo quando a IA falha, a aluna sai com um id de conversa. Sem ele a
    // conversa ficaria órfã: ela escreveu, ninguém respondeu, e não há por onde
    // continuar nem o time achar. O cérebro já marcou pra uma pessoa assumir.
    return NextResponse.json(
      { error: r.erro, conversaId: r.conversaId, comPessoa: true },
      { status: r.status }
    );
  }
  if (r.tipo === "calada") {
    // A conversa já está com uma pessoa: a mensagem foi guardada, e a resposta
    // chega pelo GET abaixo quando o time responder.
    return NextResponse.json({ conversaId: r.conversaId, comPessoa: true });
  }
  return NextResponse.json({
    conversaId: r.conversaId,
    reply: r.reply,
    comPessoa: r.precisaHumano,
  });
}

/**
 * A aluna buscando a conversa — é assim que a resposta de uma pessoa do time
 * chega até ela.
 *
 * ⚠️ Limite bem mais folgado que o do POST: aqui não gasta IA, só lê. Apertar
 * demais faria a resposta do time demorar a aparecer na tela dela.
 */
export async function GET(req: Request) {
  if (!isSameOrigin(req, true)) {
    return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  }
  if (!(await rateLimit("ajuda-ler", req, 240, 60)).ok) {
    return tooManyRequests() as NextResponse;
  }

  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Sem conversa" }, { status: 400 });

  const conversa = await getConversa(id);
  // ⚠️ Mesma resposta pra "não existe" e pra "não é sua": dizer "existe, mas
  // não é sua" já contaria que aquele id é de alguém.
  if (!conversa) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  return NextResponse.json(conversaPraAluna(conversa));
}
