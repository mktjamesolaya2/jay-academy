import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { withTracking } from "@/lib/meta-tracking";

// Página redesenhada da Lips Sense Technique, servida a partir de um arquivo HTML
// no repositório (lp-html/pdv-lips-sense-technique.html). Rota estática
// "pdv-lips-sense-technique" tem prioridade sobre o dinâmico [slug], então isto
// substitui a versão do KV. Edito o arquivo aqui no código e dou push → vai pro ar.

export const dynamic = "force-static";

export async function GET(req: Request) {
  const raw = await readFile(
    path.join(process.cwd(), "lp-html", "pdv-lips-sense-technique.html"),
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
