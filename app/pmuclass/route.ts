import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { withTracking } from "@/lib/meta-tracking";

// PMU CLASS — skeleton estático (SPA), conteúdo editável (whatsappLink,
// hotmartUrl etc.) é puxado em runtime via /api/lp-content/pmuclass. Antes
// era servido via rewrite direto de public/pmuclass/index.html, sem
// nenhum tracking (nem GTM, nem GA4, nem Pixel). Agora passa por este route
// handler igual às demais LPs custom, ganhando GTM/GA4-legado/Pixel/CAPI via
// withTracking() — o listener de clique de WhatsApp/Hotmart é delegado no
// document (capture), então cobre os links que a SPA insere dinamicamente
// depois do load.

export const dynamic = "force-static";

export async function GET(req: Request) {
  const raw = await readFile(
    path.join(process.cwd(), "lp-html", "pmuclass.html"),
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
