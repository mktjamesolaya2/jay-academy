import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { withTracking } from "@/lib/meta-tracking";

// Página Basic Magic Shadow migrada do WordPress (jayacademy.com.br/basic-magic-shadow)
// pra LP estática servida daqui. Assets já localizados no Supabase (wpmirror); o HTML
// vem sem rastreamento próprio — o withTracking() injeta o stack canônico (Pixel único
// + CAPI, GTM, GA4, verificação de domínio, listeners WhatsApp/Hotmart) em runtime.
// Rota estática tem prioridade sobre o [slug] dinâmico. Edito o arquivo e dou push → vai pro ar.

export const dynamic = "force-static";

export async function GET(req: Request) {
  const raw = await readFile(
    path.join(process.cwd(), "lp-html", "basic-magic-shadow.html"),
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
