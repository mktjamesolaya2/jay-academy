// Completa https:// quando o usuário cola um domínio nu (sem esquema),
// pra `new URL()` não estourar em "qualquersite.com/pagina".
export function ensureScheme(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Hash curto e determinístico (djb2) — sem depender de crypto, pra manter puro. */
function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(0, 8);
}

/** Slugifica um texto (tira acentos, minúsculo, só a-z0-9 e hífen). */
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // combining diacritical marks (acentos)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Deriva um slug estável do caminho INTEIRO da URL (não só o último pedaço), pra
// site.com/a/oferta e site.com/b/oferta não colidirem. HOMEPAGE → usa o HOST
// (ex: "vercel-com"), senão a home de todo site vira "home" e colide na publicação.
export function deriveWebSlug(rawUrl: string): string {
  let path = "";
  let host = "";
  try {
    const u = new URL(rawUrl);
    path = u.pathname;
    host = u.hostname.replace(/^www\./, "");
  } catch {
    path = rawUrl;
  }
  // Decodifica a URL, mas se o % estiver malformado, usa o path bruto
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    // % solto ou mal-formado: segue com o caminho original
  }
  const slug = slugify(decoded.replace(/\.[a-z0-9]+$/i, "")); // tira extensão tipo .html
  if (slug) return slug;
  // Caminho NÃO vazio mas sem nada latino (russo/japonês/árabe) → hash do path.
  const trimmed = decoded.replace(/^\/+|\/+$/g, "");
  if (trimmed) return "p-" + shortHash(trimmed);
  // Homepage: usa o host (único por site) — evita "home" colidindo entre sites.
  return slugify(host) || "home";
}
