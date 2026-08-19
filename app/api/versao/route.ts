import { NextResponse } from "next/server";

/**
 * Qual versão está no ar.
 *
 * ⚠️ Existe porque "já subiu?" custou horas nesta semana: a gente empurrava um
 * conserto, o James abria a URL em 30 segundos, via a versão antiga e concluía
 * que não tinha funcionado. Sem um jeito de perguntar, o único teste era
 * adivinhar pelo comportamento — e adivinhar errado manda procurar defeito onde
 * não tem.
 *
 * ⚠️ Público de propósito: quem precisa saber se o deploy entrou nem sempre
 * está logado, e o número do commit não abre porta nenhuma. Só o commit e a
 * primeira linha da mensagem — nada de branch, repositório ou variável de
 * ambiente.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7);
  return NextResponse.json(
    {
      commit: sha || "local",
      // A mensagem responde "qual conserto está no ar?" sem precisar abrir o
      // GitHub pra traduzir o número do commit.
      mensagem: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
