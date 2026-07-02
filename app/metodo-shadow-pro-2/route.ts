import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Página Método Shadow PRO recriada como LP custom (a original do WordPress foi
// excluída e não pôde ser copiada). Servida a partir de um arquivo HTML no repo
// (lp-html/metodo-shadow-pro-2.html). Rota estática tem prioridade sobre o [slug]
// dinâmico. Edito o arquivo aqui no código e dou push → vai pro ar.

export const dynamic = "force-static";

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "lp-html", "metodo-shadow-pro-2.html"),
    "utf8"
  );
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
