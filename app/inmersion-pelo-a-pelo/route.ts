import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { withTracking } from "@/lib/meta-tracking";

// LP reconstruída, servida de arquivo estático commitado. Antes era servida
// via rewrite direto de public/recriadas/inmersion-pelo-a-pelo/index.html
// (sem tracking algum); agora passa por este route handler igual às demais
// LPs custom, pra ganhar GTM/GA4-legado/Pixel/CAPI automaticamente via
// withTracking(). Rota estática tem prioridade sobre o [slug] dinâmico.

export const dynamic = "force-static";

export async function GET(req: Request) {
  const raw = await readFile(
    path.join(process.cwd(), "lp-html", "inmersion-pelo-a-pelo.html"),
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
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
