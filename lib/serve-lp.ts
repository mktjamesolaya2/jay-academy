import "server-only";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { withTracking, buildVisitBeacon } from "@/lib/meta-tracking";
import { delazyHtml, delazyBackgrounds } from "@/lib/wp-localize-core";
import { resolveEmbeddedHtml, resolveLpHtml } from "@/lib/embedded-html-store";
import { getLpFormConfig } from "@/lib/lp-form-config";
import { montarGuardaDeFormularios } from "@/lib/webhook-codigo";
import { comFormMobileCss } from "@/lib/form-mobile-css";

// Serving unificado das LPs custom (antes eram ~10 route handlers quase
// idênticos). Três variantes:
//   1. disco + delazy   → HTML do WP em lp-html/, "assa" lazy-images/backgrounds
//   2. disco sem delazy → LP recriada em lp-html/, servida como está
//   3. embedded (KV)    → HTML editável via /lps/[slug]/edit-visual
// Todas passam por withTracking() (GTM/GA4/Pixel/CAPI) e usam a MESMA política
// de cache — antes cada handler tinha um Cache-Control diferente (no-store,
// 15s, 3600s) sem racional.

// Política de cache coerente por origem do conteúdo (antes cada handler tinha
// um valor arbitrário: no-store, 15s, 3600s):
//  - disco (muda só em deploy) → revalida no CDN a cada 1h, stale por 1 dia.
//  - KV editável (muda pelo editor visual) → 60s, igual ao /p/[slug]; edições
//    aparecem em até 1min sem matar o cache de borda.
const DISK_CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";
const EMBEDDED_CACHE_CONTROL =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=86400";

// Cache em memória do HTML cru lido do disco — o arquivo só muda em deploy,
// então não faz sentido reler do disco a cada request (processo é reciclado
// no deploy). Chave = caminho do arquivo.
const diskCache = new Map<string, string>();

async function readLpFile(filename: string): Promise<string> {
  const cached = diskCache.get(filename);
  if (cached !== undefined) return cached;
  const raw = await readFile(
    path.join(process.cwd(), "lp-html", filename),
    "utf8"
  );
  diskCache.set(filename, raw);
  return raw;
}

/** Pipeline de-lazy + higiene aplicado só nas LPs migradas do WP (delazy=true). */
function delazyPipeline(raw: string): string {
  // "Assa" imagens (data-lazy-src → src) e fundos de seção do WP Rocket
  // (--wpr-bg → background-image) — sem isso a página depende do JS de
  // lazyload do WP Rocket, que atrasa/falha (hero e fundos sumindo no mobile).
  let cleaned = delazyBackgrounds(delazyHtml(raw));
  // Nunca usa <base href> do WP (faz links relativos resolverem pro WordPress).
  cleaned = cleaned.replace(/<base\b[^>]*>/gi, "");
  // Blindagem mobile: garante o <meta viewport>.
  if (!/<meta[^>]+name=["']viewport["']/i.test(cleaned)) {
    cleaned = cleaned.replace(
      /<head([^>]*)>/i,
      `<head$1>\n  <meta name="viewport" content="width=device-width, initial-scale=1" />`
    );
  }
  return cleaned;
}

type ServeLpOptions =
  | { file: string; delazy?: boolean }
  | { embedded: string };

/**
 * Serve uma LP custom com o stack de tracking canônico e cache coerente.
 * Reutilizado pelos route handlers dedicados (app/<slug>/route.ts).
 */
export async function serveLp(
  req: Request,
  opts: ServeLpOptions
): Promise<NextResponse> {
  let raw: string | null;
  let delazy = false;
  let cacheControl: string;
  let slug: string;

  if ("embedded" in opts) {
    raw = await resolveEmbeddedHtml(opts.embedded);
    cacheControl = EMBEDDED_CACHE_CONTROL;
    slug = opts.embedded;
  } else {
    slug = opts.file.replace(/\.html$/i, "");
    // Versão editada no painel passa na frente do arquivo do repositório —
    // é o que dá editor visual pras LPs de lp-html/. Sem override, lê o
    // arquivo do jeito de sempre.
    raw = await resolveLpHtml(slug, opts.file);
    delazy = opts.delazy ?? false;
    cacheControl = DISK_CACHE_CONTROL;
  }

  if (!raw) {
    return new NextResponse("Página não encontrada", { status: 404 });
  }

  // Conserto de layout dos formulários no celular (ver lib/form-mobile-css).
  const prepared = comFormMobileCss(delazy ? delazyPipeline(raw) : raw);
  let html = await withTracking(prepared, {
    // O slug decide quem leva Pixel/GTM (ver a política em lib/meta-tracking.ts).
    slug,
    isProductPage: true,
    eventSourceUrl: req.url,
    req,
  });
  // Beacon de visita interna (client-side) — faz a LP aparecer no analytics
  // do painel mesmo cacheada estática na borda. Append se não houver </body>
  // (ex: laser é um shell de SPA sem tag de fechamento).
  const beacon = buildVisitBeacon(slug);
  html = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${beacon}\n</body>`)
    : html + beacon;

  // ⚠️ A ponte vai SEMPRE, com ou sem webhook: sem ela, o formulário das LPs de
  // venda faz POST na própria URL e a página responde 405 — todo lead se
  // perdia. Ver montarGuardaDeFormularios.
  const ponte = `\n<!-- Envio dos formulários pelo portal -->\n${montarGuardaDeFormularios()}\n`;
  html = /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${ponte}</body>`)
    : html + ponte;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}
