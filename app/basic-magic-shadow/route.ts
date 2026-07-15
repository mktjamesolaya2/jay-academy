import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { withTracking } from "@/lib/meta-tracking";
import { delazyHtml, delazyBackgrounds } from "@/lib/wp-localize-core";

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

  // De-lazy no serve (mesmo padrão do app/p/[slug]/route.ts): "assa" as imagens
  // (data-lazy-src → src) e os fundos de seção do WP Rocket (--wpr-bg →
  // background-image aplicado). Sem isso a página depende do JS de lazyload do WP
  // Rocket, que atrasa/falha (hero e fundos sumindo, sobretudo no mobile).
  let cleaned = delazyBackgrounds(delazyHtml(raw));
  // Nunca usa <base href> do WP (faz âncoras/links relativos resolverem pro WordPress).
  cleaned = cleaned.replace(/<base\b[^>]*>/gi, "");
  // Blindagem mobile: garante o <meta viewport>.
  if (!/<meta[^>]+name=["']viewport["']/i.test(cleaned)) {
    cleaned = cleaned.replace(
      /<head([^>]*)>/i,
      `<head$1>\n  <meta name="viewport" content="width=device-width, initial-scale=1" />`
    );
  }

  const html = await withTracking(cleaned, {
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
