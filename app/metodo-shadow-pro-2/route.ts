import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { withTracking } from "@/lib/meta-tracking";

// Página Método Shadow PRO recriada como LP custom (a original do WordPress foi
// excluída e não pôde ser copiada). Servida a partir de um arquivo HTML no repo
// (lp-html/metodo-shadow-pro-2.html). Rota estática tem prioridade sobre o [slug]
// dinâmico. Edito o arquivo aqui no código e dou push → vai pro ar.

export const dynamic = "force-static";

export async function GET(req: Request) {
  const raw = await readFile(
    path.join(process.cwd(), "lp-html", "metodo-shadow-pro-2.html"),
    "utf8"
  );
  const html = await withTracking(raw, {
    isProductPage: true,
    eventSourceUrl: req.url,
    req,
  });
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
