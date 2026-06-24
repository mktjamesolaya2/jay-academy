import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Página redesenhada da Fio a Fio Realista, servida a partir de um arquivo HTML
// no repositório (lp-html/fio-a-fio-realista.html). Rota estática "fio-a-fio-realista"
// tem prioridade sobre o dinâmico [slug], então isto substitui a versão do KV.
// Edito o arquivo aqui no código e dou push → vai pro ar.

export const dynamic = "force-static";

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "lp-html", "fio-a-fio-realista.html"),
    "utf8"
  );
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
