import { canEdit, getCurrentUser } from "@/lib/auth";
import { listarConversas } from "@/lib/suporte-store";
import { protocoloDe } from "@/lib/protocolo";

/**
 * A conversa inteira em texto puro, achada pelo protocolo.
 *
 * ⚠️ Existe pra depurar o atendimento. Quando o James diz "essa conversa saiu
 * errada", o caminho até aqui era ele tirar print de tela por tela de um chat
 * comprido — e o que eu preciso ler é a conversa toda, incluindo o que ficou
 * fora do print.
 *
 * ⚠️ Texto puro, e não JSON, de propósito: abre legível no navegador e ele
 * copia inteiro num Ctrl+A.
 *
 * ⚠️ Login de quem edita. Aqui sai e-mail de aluna e o que ela contou do
 * problema dela — é o conteúdo mais sensível que o suporte guarda.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!canEdit(me)) return new Response("Sem permissão", { status: 403 });

  const pedido = (new URL(req.url).searchParams.get("protocolo") ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  if (!pedido) {
    return new Response("Use ?protocolo=ABC123", { status: 400 });
  }

  const conversas = await listarConversas().catch(() => []);
  const c = conversas.find((x) => protocoloDe(x.id).startsWith(pedido));
  if (!c) return new Response(`Nada com o protocolo ${pedido}.`, { status: 404 });

  const linhas = [
    `PROTOCOLO ${protocoloDe(c.id)}`,
    `quem      ${c.quem}`,
    `e-mail    ${c.emailAluna ?? "—"}`,
    `situação  ${c.aguardandoPessoa ? "encaminhada pra uma pessoa" : "com a I.A."}`,
    `criada em ${c.criadaEm}`,
    "",
    "".padEnd(60, "─"),
    "",
  ];
  for (const m of c.mensagens) {
    const quem = m.de === "aluno" ? c.quem : m.de === "ia" ? "I.A." : "ATENDENTE";
    linhas.push(`[${m.em}] ${quem}:`);
    linhas.push(m.texto || "(sem texto)");
    linhas.push("");
  }

  return new Response(linhas.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
