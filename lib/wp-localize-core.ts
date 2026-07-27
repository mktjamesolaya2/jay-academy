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

/** Decodifica as entidades HTML mais comuns que aparecem dentro de URLs
 * (`&amp;` → `&`). Sem isso, `load.php?a=1&amp;only=styles` é buscado com o
 * parâmetro errado (`amp;only`) e o servidor devolve outra coisa/404. */
export function decodeUrlEntities(s: string): string {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&#0*38;/g, "&")
    .replace(/&#x0*26;/gi, "&");
}

/**
 * Reescreve TODAS as URLs relativas/root-relativas do HTML pra ABSOLUTAS contra
 * `baseUrl` (a URL de origem da página). Assim a cópia carrega os assets do site
 * original na hora — sem depender de `<base>` (que a gente remove) — e o
 * localizador depois casa essas URLs absolutas com o mapa de download. Também
 * conserta os `<a href>` internos (senão apontariam pro nosso próprio domínio).
 *
 * Cobre: src/href/poster/data-src/data-lazy-src/data-bg, srcset (multi),
 * e url() em style/CSS. Pula `data:`/`#`/`mailto:`/`tel:`/`javascript:` e o que
 * já é absoluto. É pra usar em páginas copiadas da WEB (não WP).
 */
export function absolutizeUrls(html: string, baseUrl: string): string {
  const abs = (raw: string): string | null => {
    const v = decodeUrlEntities(raw.trim());
    if (!v || /^(data:|#|mailto:|tel:|javascript:|blob:)/i.test(v)) return null;
    if (/^https?:\/\//i.test(v)) return null; // já absoluto
    if (v.startsWith("//")) return "https:" + v; // protocol-relative
    try {
      return new URL(v, baseUrl).href;
    } catch {
      return null;
    }
  };

  const single =
    /(\b(?:src|href|poster|action|formaction|data-src|data-lazy-src|data-bg|data-background)\s*=\s*)("[^"]*"|'[^']*')/gi;
  let out = html.replace(single, (m, pre: string, quoted: string) => {
    const q = quoted[0];
    const a = abs(quoted.slice(1, -1));
    return a ? `${pre}${q}${a}${q}` : m;
  });

  const fixSrcset = (val: string) => {
    // NÃO mexer em srcset que contém data: URI (placeholder de lazy-load): o data
    // URI tem vírgula por dentro (`data:image/gif;base64,…`), então dividir por
    // vírgula quebraria/corromperia o valor. Deixa como está.
    if (/data:/i.test(val)) return val;
    return val
      .split(",")
      .map((part) => {
        const seg = part.trim().split(/\s+/);
        const a = abs(seg[0] || "");
        if (a) seg[0] = a;
        return seg.join(" ");
      })
      .join(", ");
  };
  const srcset =
    /(\b(?:srcset|data-lazy-srcset|imagesrcset)\s*=\s*)("[^"]*"|'[^']*')/gi;
  out = out.replace(srcset, (m, pre: string, quoted: string) => {
    const q = quoted[0];
    return `${pre}${q}${fixSrcset(quoted.slice(1, -1))}${q}`;
  });

  out = out.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (m, q: string, val: string) => {
    const a = abs(val);
    return a ? `url(${q}${a}${q})` : m;
  });

  return out;
}

/**
 * Como extractAssetUrls, mas TAMBÉM captura assets por TAG mesmo SEM extensão:
 * `<link rel="stylesheet|preload|modulepreload|icon|apple-touch-icon|mask-icon|
 * manifest" href="…">`. É o que pega o CSS "disfarçado" (Google Fonts, load.php
 * da Wikipedia) que não termina em `.css`. Scripts já saíram na sanitização, então
 * não precisamos deles. Pra cópias da WEB.
 */
export function extractWebAssetUrls(html: string, baseUrl?: string): string[] {
  const set = new Set<string>(extractAssetUrls(html, baseUrl));
  const add = (raw: string | undefined) => {
    if (!raw) return;
    const abs = resolveUrl(decodeUrlEntities(raw), baseUrl);
    if (abs) set.add(abs);
  };
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (
      !/\brel\s*=\s*["']?[^"'>]*(?:stylesheet|preload|modulepreload|icon|manifest)/i.test(
        tag
      )
    )
      continue;
    const href = tag.match(/\bhref\s*=\s*("[^"]*"|'[^']*')/i);
    if (href) add(href[1].slice(1, -1));
  }
  return [...set];
}

/**
 * Extrai as URLs referenciadas DENTRO de um CSS: `url(...)` (fontes, imagens de
 * fundo) e `@import` (partials). De QUALQUER host — usado pra localizar o CSS de
 * sites externos (o extractWpAssetUrls só pega host do WP). Resolve contra a base
 * do próprio CSS.
 */
export function extractCssAssets(cssText: string, baseUrl?: string): string[] {
  const set = new Set<string>();
  const add = (raw: string | undefined) => {
    if (!raw) return;
    const abs = resolveUrl(decodeUrlEntities(raw), baseUrl);
    if (abs) set.add(abs);
  };
  for (const m of cssText.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) add(m[2]);
  // @import "x"  |  @import url("x")  |  @import url(x)
  for (const m of cssText.matchAll(/@import\s+(?:url\(\s*)?(['"])([^'"]+)\1/gi))
    add(m[2]);
  for (const m of cssText.matchAll(/@import\s+url\(\s*([^'")]+)\s*\)/gi)) add(m[1]);
  return [...set];
}

/**
 * Remove `<source>` placeholder de `<picture>` (lazy-load): tags com `data-empty`
 * ou com `srcset="data:…"`. Muitos sites (Apple etc.) põem um `<source>` com um
 * GIF transparente cobrindo TODAS as larguras (`media="(min-width:0px)"`) e trocam
 * pela imagem real via JS. Sem esse JS (ou quando ele não roda), o navegador usa o
 * placeholder e a imagem some. Removendo o placeholder, o navegador cai na `<img
 * src>` de verdade (que costuma ter a imagem real). Pra cópias da WEB.
 */
export function stripPlaceholderSources(html: string): string {
  return html.replace(/<source\b[^>]*>/gi, (tag) =>
    /\bdata-empty\b/i.test(tag) || /\bsrcset\s*=\s*["']?\s*data:/i.test(tag)
      ? ""
      : tag
  );
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

/** Verdadeiro se a URL absoluta aponta pra um asset (por extensão), de qualquer host. */
export function isAssetUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ASSET_EXT_RE.test(u.pathname + u.search);
  } catch {
    return false;
  }
}

/**
 * Extrai URLs de asset (src/href/srcset/url(), + catch-all de URLs escapadas
 * em JSON) de um HTML ou CSS — de qualquer host por padrão. O filtro de
 * aceitação é injetável via `accept` (default = qualquer asset por extensão).
 */
export function extractAssetUrls(
  html: string,
  baseUrl?: string,
  accept: (u: string) => boolean = isAssetUrl
): string[] {
  const found = new Set<string>();
  const add = (raw: string | undefined | null) => {
    if (!raw) return;
    const abs = resolveUrl(raw, baseUrl);
    if (abs && accept(abs)) found.add(abs);
  };

  const attrR = /\b(?:src|href|poster|data-src|data-lazy-src|data-bg|data-background)\s*=\s*["']([^"']+)["']/gi;
  for (const m of html.matchAll(attrR)) add(m[1]);

  const srcsetR = /\b(?:srcset|data-lazy-srcset|imagesrcset)\s*=\s*["']([^"']+)["']/gi;
  for (const m of html.matchAll(srcsetR)) for (const part of m[1].split(",")) add(part.trim().split(/\s+/)[0]);

  const urlR = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  for (const m of html.matchAll(urlR)) add(m[2]);

  // catch-all de URLs soltas (inclui JSON com barras escapadas `https:\/\/`)
  const flat = html.replace(/\\\//g, "/");
  const rawR = new RegExp(`https?://[^\\s"'()\\\\<>]+?\\.(?:${ASSET_EXT})(?:\\?[^\\s"'()\\\\<>]*)?`, "gi");
  for (const m of flat.matchAll(rawR)) add(m[0]);

  return [...found];
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
  return extractAssetUrls(html, baseUrl, isWpAssetUrl);
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

/**
 * "De-lazy" dos FUNDOS de seção do WP Rocket (o equivalente do delazyHtml, mas
 * pra background-image em vez de <img>).
 *
 * O WP Rocket tira o `background-image` real do elemento e guarda a URL numa CSS
 * var `--wpr-bg-<id>: url(...)`, aplicando de volta SÓ via JavaScript no runtime
 * (`el.style.backgroundImage = 'var(--wpr-bg-<id>)'`). Confirmado nas páginas
 * copiadas: a var é DEFINIDA mas NUNCA aplicada no CSS (0 `background-image:var`).
 * Resultado: sem esse JS — ou quando ele falha/atrasa (comum no mobile) — o fundo
 * da seção (tipicamente a HERO) fica em branco.
 *
 * Esta função aplica o fundo direto: pra cada `--wpr-bg-<id>: url(X)`, injeta um
 * `background-image: url(X)` na MESMA regra/declaração. Como o seletor é o mesmo,
 * o fundo passa a aparecer sem depender de JS. Funciona tanto em blocos <style>
 * quanto em `style="..."` inline. Idempotente na prática (rode 1x ao servir).
 */
export function delazyBackgrounds(html: string): string {
  return html.replace(
    /--wpr-bg-[\w-]+\s*:\s*url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi,
    (whole, q: string, url: string) =>
      `${whole};background-image:url(${q}${url}${q})`
  );
}

/**
 * Regex de um atributo HTML, ciente das aspas. O valor é capturado INTEIRO
 * respeitando a aspa de abertura (`"[^"]*"` OU `'[^']*'`) — então um valor
 * entre aspas duplas pode conter aspas simples por dentro (e vice-versa). Isso
 * é essencial pro `src` do placeholder lazy, que é um data:image/svg contendo
 * `xmlns='...'`: o regex ingênuo `["'][^"']*["']` parava na aspa interna e
 * corrompia a tag. O lookbehind `(?<![-\w])` evita que `src` case com o final
 * de `data-lazy-src` (que termina em "src").
 */
function attrRe(name: string): RegExp {
  return new RegExp(`(?<![-\\w])${name}\\s*=\\s*("[^"]*"|'[^']*')`, "i");
}

/** Lê o valor de um atributo de uma tag (sem as aspas). */
function attr(tag: string, name: string): string | null {
  const m = tag.match(attrRe(name));
  return m ? m[1].slice(1, -1) : null;
}

/** Seta (ou substitui) um atributo numa string de tag. */
function setAttr(tag: string, name: string, value: string): string {
  const re = attrRe(name);
  if (re.test(tag)) {
    return tag.replace(re, `${name}="${value}"`);
  }
  // Insere antes do fechamento da tag (> ou />)
  return tag.replace(/\s*\/?>$/, (end) => ` ${name}="${value}"${end}`);
}

/**
 * WP Rocket guarda CSS/JS minificados em `/wp-content/cache/min/N/<original>`.
 * Esse cache é VOLÁTIL: quando o WP Rocket regenera, as URLs antigas passam a
 * dar 404 mesmo com o WordPress no ar — e a página copiada nasce sem estilo. O
 * arquivo ORIGINAL (sem o prefixo de cache) continua existindo. Esta função
 * reconstrói a URL original; devolve null se a URL não for do cache do WP Rocket.
 */
export function deRocketUrl(url: string): string | null {
  const m = url.match(
    /^(https?:\/\/[^/]+)\/wp-content\/cache\/min\/\d+\/(.+)$/i
  );
  if (!m) return null;
  return `${m[1]}/${m[2]}`;
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
