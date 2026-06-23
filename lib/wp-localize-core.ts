// Núcleo PURO do localizador de assets do WordPress — sem I/O, sem "server-only".
// Tudo aqui é testável com node:test (lib/wp-localize-core.test.ts).
//
// Objetivo: pegar o HTML copiado de uma página WP (que referencia imagens, CSS
// e JS hospedados no próprio WP) e prepará-lo pra ficar 100% independente:
//   1) "de-lazy": joga a imagem real (data-lazy-src) direto no src, matando o
//      placeholder SVG em branco que faz a página parecer incompleta.
//   2) reescreve toda URL de asset do WP pra URL local (mapa from→to).
//
// O download/armazenamento em si fica no orquestrador (lib/wp-localize.ts).

/** Extensões que tratamos como "asset" (e portanto vamos baixar/reescrever). */
const ASSET_EXT =
  "css|js|mjs|png|jpe?g|gif|webp|avif|svg|ico|bmp|woff2?|ttf|eot|otf|mp4|webm|mov|m4v|mp3|ogg|wav";

const ASSET_EXT_RE = new RegExp(`\\.(?:${ASSET_EXT})(?:[?#]|$)`, "i");

export type AssetKind = "css" | "js" | "image" | "font" | "media" | "other";

/** Hosts considerados "do WordPress" — qualquer subdomínio de jayacademy.com.br. */
export function isWpHost(host: string): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, "");
  return h === "jayacademy.com.br" || h.endsWith(".jayacademy.com.br");
}

/** Classifica o tipo do asset pela extensão da URL. */
export function classifyAsset(url: string): AssetKind {
  const u = url.toLowerCase();
  if (/\.(?:css)(?:[?#]|$)/.test(u)) return "css";
  if (/\.(?:js|mjs)(?:[?#]|$)/.test(u)) return "js";
  if (/\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp)(?:[?#]|$)/.test(u)) return "image";
  if (/\.(?:woff2?|ttf|eot|otf)(?:[?#]|$)/.test(u)) return "font";
  if (/\.(?:mp4|webm|mov|m4v|mp3|ogg|wav)(?:[?#]|$)/.test(u)) return "media";
  return "other";
}

/**
 * Resolve uma URL (possivelmente relativa ou protocol-relative) contra uma base.
 * Retorna null se não der pra resolver.
 */
export function resolveUrl(raw: string, base?: string): string | null {
  const v = raw.trim().replace(/^["']|["']$/g, "");
  if (!v || v.startsWith("data:") || v.startsWith("#")) return null;
  try {
    if (/^https?:\/\//i.test(v)) return v;
    if (v.startsWith("//")) return "https:" + v;
    if (base) return new URL(v, base).href;
    return null;
  } catch {
    return null;
  }
}

/** Verdadeiro se a URL absoluta aponta pra um asset hospedado no WP. */
export function isWpAssetUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return isWpHost(u.host) && ASSET_EXT_RE.test(u.pathname + u.search);
  } catch {
    return false;
  }
}

/**
 * Extrai todas as URLs de asset do WP referenciadas num HTML (ou CSS).
 * Cobre: src/href/data-src/data-lazy-src, srcset/data-lazy-srcset (todos os
 * tamanhos), style="...url()...", e url() em blocos <style>/CSS.
 * NÃO pega <a href> de páginas — só assets (filtra por extensão).
 *
 * @param baseUrl base pra resolver URLs relativas (a `link` da página, ou a
 *                URL do próprio CSS quando processando um arquivo .css).
 */
export function extractWpAssetUrls(html: string, baseUrl?: string): string[] {
  const found = new Set<string>();

  const add = (raw: string | undefined | null) => {
    if (!raw) return;
    const abs = resolveUrl(raw, baseUrl);
    if (abs && isWpAssetUrl(abs)) found.add(abs);
  };

  // src / href / data-src / data-lazy-src / poster
  const attrRe =
    /\b(?:src|href|poster|data-src|data-lazy-src|data-bg|data-background)\s*=\s*["']([^"']+)["']/gi;
  for (const m of html.matchAll(attrRe)) add(m[1]);

  // srcset / data-lazy-srcset / imagesrcset — múltiplas URLs com descritor "300w"/"2x"
  const srcsetRe = /\b(?:srcset|data-lazy-srcset|imagesrcset)\s*=\s*["']([^"']+)["']/gi;
  for (const m of html.matchAll(srcsetRe)) {
    for (const part of m[1].split(",")) {
      add(part.trim().split(/\s+/)[0]);
    }
  }

  // url(...) em style inline ou em CSS
  const urlRe = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  for (const m of html.matchAll(urlRe)) add(m[2]);

  // Catch-all: qualquer URL de asset do WP solta no texto — inclui as que ficam
  // dentro de JSON (ex: data-settings do Elementor com fundos de seção), onde as
  // barras vêm escapadas (`https:\/\/...`). Desescapamos numa cópia só pra achar.
  const flat = html.replace(/\\\//g, "/");
  const rawRe = new RegExp(
    `https?://[a-z0-9.-]*jayacademy\\.com\\.br/[^\\s"'()\\\\<>]+?\\.(?:${ASSET_EXT})(?:\\?[^\\s"'()\\\\<>]*)?`,
    "gi"
  );
  for (const m of flat.matchAll(rawRe)) add(m[0]);

  return [...found];
}

/**
 * "De-lazy": pra cada <img>/<source>, se houver data-lazy-src/data-src com a
 * imagem real, coloca esse valor direto no src (e idem srcset). Assim a imagem
 * aparece mesmo sem o JavaScript de lazy-load do WP rodar.
 *
 * Roda ANTES da reescrita de URLs — copia a URL (ainda do WP) pro src; a
 * reescrita depois troca WP→local em todas as ocorrências de uma vez.
 */
export function delazyHtml(html: string): string {
  return html.replace(/<(img|source)\b[^>]*>/gi, (tag) => {
    let out = tag;

    const realSrc =
      attr(out, "data-lazy-src") || attr(out, "data-src") || attr(out, "data-bg");
    if (realSrc && !realSrc.startsWith("data:")) {
      out = setAttr(out, "src", realSrc);
    }

    const realSrcset = attr(out, "data-lazy-srcset");
    if (realSrcset) {
      out = setAttr(out, "srcset", realSrcset);
    }
    return out;
  });
}

/**
 * Remove atributos responsivos (srcset/sizes/imagesrcset/data-lazy-srcset) das
 * imagens. Assim só o `src` (imagem cheia) é usado — não precisamos baixar as
 * variantes de tamanho do WP (economiza MUITO storage). Rode DEPOIS do de-lazy.
 */
export function stripResponsiveImg(html: string): string {
  return html.replace(
    /\s(?:srcset|data-lazy-srcset|imagesrcset|sizes)\s*=\s*("[^"]*"|'[^']*')/gi,
    ""
  );
}

/** Lê o valor de um atributo de uma tag. */
function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1] : null;
}

/** Seta (ou substitui) um atributo numa string de tag. */
function setAttr(tag: string, name: string, value: string): string {
  const re = new RegExp(`\\b${name}\\s*=\\s*["'][^"']*["']`, "i");
  if (re.test(tag)) {
    return tag.replace(re, `${name}="${value}"`);
  }
  // Insere antes do fechamento da tag (> ou />)
  return tag.replace(/\s*\/?>$/, (end) => ` ${name}="${value}"${end}`);
}

/**
 * Substitui todas as ocorrências das URLs do mapa (from→to) numa string.
 * Ordena por comprimento decrescente pra uma URL não "comer" o prefixo de outra.
 */
export function rewriteUrls(text: string, map: Record<string, string>): string {
  const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
  let out = text;
  for (const [from, to] of entries) {
    if (!from || !to || from === to) continue;
    out = out.split(from).join(to);
    // Também troca a forma com barras escapadas em JSON (`https:\/\/...`),
    // usada nas configs do Elementor (data-settings de fundos de seção).
    const escFrom = from.replace(/\//g, "\\/");
    if (escFrom !== from) out = out.split(escFrom).join(to.replace(/\//g, "\\/"));
  }
  return out;
}

/**
 * Localiza um HTML completo: de-lazy + reescrita de URLs.
 * `map` mapeia URL absoluta do WP → URL local (Blob/biblioteca).
 */
export function localizeHtml(html: string, map: Record<string, string>): string {
  return rewriteUrls(delazyHtml(html), map);
}

/**
 * Reescreve os `<a href>` que apontam pra PÁGINAS do WordPress (não assets):
 *   - link pra a PRÓPRIA página (mesmo slug) → vira âncora pura (`#valor`) pra
 *     rolar na página em vez de navegar pro WP. (resolve "ver mais"/"eu quero")
 *   - link pra OUTRA página já copiada → vira a rota do portal (`/slug-publico`).
 *   - link pra página WP desconhecida (não copiada) → deixa intacto.
 *   - link externo (WhatsApp, Hotmart, etc.) → deixa intacto.
 *
 * @param selfSlugs  slugs que representam ESTA página (slug interno + público)
 * @param slugToPublic  mapa slug-do-WP → slug-público-no-portal das páginas copiadas
 */
export function rewriteWpAnchors(
  html: string,
  selfSlugs: string[],
  slugToPublic: Record<string, string>
): string {
  const self = new Set(selfSlugs.filter(Boolean).map((s) => s.toLowerCase()));
  return html.replace(
    /<a\b[^>]*?\shref=(["'])([^"']*)\1[^>]*>/gi,
    (tag, quote: string, href: string) => {
      let u: URL;
      try {
        u = new URL(href);
      } catch {
        return tag; // relativo ou âncora já — não mexe
      }
      if (!isWpHost(u.host)) return tag; // externo (whatsapp/hotmart) intacto

      const slug = (u.pathname.split("/").filter(Boolean).pop() || "").toLowerCase();
      const pub = slugToPublic[slug];
      let replacement: string | null = null;

      if (self.has(slug) || (pub && self.has(pub.toLowerCase()))) {
        // mesma página → âncora pura (rola); sem hash, cai na raiz da própria página
        replacement = u.hash || `/${pub || slug}`;
      } else if (pub) {
        // outra página copiada → rota do portal
        replacement = `/${pub}${u.search}${u.hash}`;
      }

      if (replacement == null) return tag; // página WP não copiada: não arrisca
      return tag.replace(`href=${quote}${href}${quote}`, `href=${quote}${replacement}${quote}`);
    }
  );
}

/**
 * Reescreve url() dentro de um CSS. O mapa usa URLs ABSOLUTAS (resolvidas
 * contra a base do CSS), então primeiro resolvemos cada url() relativo e
 * trocamos pelo destino local correspondente.
 */
export function rewriteCssUrls(
  css: string,
  cssBaseUrl: string,
  map: Record<string, string>
): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (whole, q, raw) => {
    const abs = resolveUrl(raw, cssBaseUrl);
    if (abs && map[abs]) return `url(${q}${map[abs]}${q})`;
    return whole;
  });
}
