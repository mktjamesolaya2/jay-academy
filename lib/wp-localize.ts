import "server-only";
import { createHash } from "node:crypto";
import { kvGet, kvSet, blobUpload } from "./storage";
import {
  addManyMedia,
  assignMediaToPage,
  assignMediaPagesBulk,
  listMedia,
} from "./media-store";
import { ensureWpPage } from "./media-pages-store";
import { mediaTypeFromContentType, type MediaItem } from "./media-types";
import {
  loadContent,
  saveContent,
  listSaved,
  type WpPageContent,
} from "./wp-content-storage";
import type { WpDomain } from "./wp-api";
import {
  extractWpAssetUrls,
  classifyAsset,
  localizeHtml,
  rewriteCssUrls,
  rewriteWpAnchors,
  type AssetKind,
} from "./wp-localize-core";

// ─────────────────────────────────────────────────────────────────────────
// Localizador de assets do WordPress
//
// Baixa TODOS os assets que uma página copiada puxa do WP (imagens, CSS, JS,
// fontes) pra dentro do nosso storage (Blob) + biblioteca de mídia, e reescreve
// o HTML pra apontar pras cópias locais. Resultado: a página fica 100%
// independente do WP e sobrevive ao desligamento dele.
//
// Dedup GLOBAL via KV (`wpasset:<hash>`): um asset compartilhado entre as 95
// páginas (todo o CSS/JS do Elementor) é baixado UMA vez só. Idempotente:
// rodar de novo pula o que já foi baixado.
// ─────────────────────────────────────────────────────────────────────────

const UA = "Mozilla/5.0 (compatible; jayacademy-portal-mirror/1.0)";
const CONCURRENCY = 8;
const MAX_ASSET_BYTES = 25 * 1024 * 1024; // 25MB de teto por asset

export type LocalizeStats = {
  total: number;
  localized: number;
  failed: number;
  byKind: Partial<Record<AssetKind, number>>;
  failures: string[];
};

function assetKey(url: string): string {
  return "wpasset:" + createHash("sha1").update(url).digest("hex");
}

async function getMapping(url: string): Promise<string | null> {
  return await kvGet<string>(assetKey(url));
}

async function setMapping(url: string, localUrl: string): Promise<void> {
  await kvSet(assetKey(url), localUrl);
}

function basenameFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname;
    const last = p.split("/").filter(Boolean).pop() || "asset";
    return decodeURIComponent(last)
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);
  } catch {
    return "asset";
  }
}

function guessContentType(url: string, headerCt?: string | null): string {
  if (headerCt && headerCt !== "application/octet-stream") {
    return headerCt.split(";")[0].trim();
  }
  const kind = classifyAsset(url);
  const ext = (url.split("?")[0].split(".").pop() || "").toLowerCase();
  const map: Record<string, string> = {
    css: "text/css",
    js: "application/javascript",
    mjs: "application/javascript",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    otf: "font/otf",
    eot: "application/vnd.ms-fontobject",
    mp4: "video/mp4",
    webm: "video/webm",
  };
  return map[ext] || (kind === "image" ? "image/jpeg" : "application/octet-stream");
}

/**
 * Baixa um único asset, guarda no Blob (+ biblioteca se for imagem) e devolve a
 * URL local. CSS é processado recursivamente (as url() de dentro dele também são
 * localizadas). Usa cache em KV (dedup global) e cache da run (evita corrida).
 *
 * Retorna null se o download falhar — nesse caso a URL original do WP é mantida
 * (a página continua funcionando enquanto o WP estiver no ar).
 */
async function fetchAndStore(
  url: string,
  runCache: Map<string, Promise<string | null>>,
  mediaSink: Map<string, MediaItem>
): Promise<string | null> {
  const cached = runCache.get(url);
  if (cached) return cached;

  const promise = (async (): Promise<string | null> => {
    const existing = await getMapping(url);
    if (existing) return existing;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "*/*" },
        cache: "no-store",
      });
      if (!res.ok) return null;

      const ab = await res.arrayBuffer();
      if (ab.byteLength > MAX_ASSET_BYTES) return null;
      let buf = Buffer.from(ab);
      const kind = classifyAsset(url);
      const contentType = guessContentType(url, res.headers.get("content-type"));

      // CSS: localiza as url() de dentro (fontes, imagens de fundo) antes de salvar.
      if (kind === "css") {
        const cssText = buf.toString("utf8");
        const subUrls = extractWpAssetUrls(cssText, url);
        const subMap: Record<string, string> = {};
        for (const sub of subUrls) {
          const local = await fetchAndStore(sub, runCache, mediaSink);
          if (local) subMap[sub] = local;
        }
        buf = Buffer.from(rewriteCssUrls(cssText, url, subMap), "utf8");
      }

      const filename = `wpmirror/${createHash("sha1")
        .update(url)
        .digest("hex")
        .slice(0, 12)}-${basenameFromUrl(url)}`;
      const { url: localUrl } = await blobUpload(filename, buf, contentType);

      // Imagens entram também na biblioteca de mídia (categoria separada pra não
      // poluir as imagens curadas do James). Pulamos as variantes de tamanho do
      // WP (foo-300x300.jpg, foo-768x768.jpg…) pra não floodar a biblioteca com
      // 4 cópias da mesma imagem — elas continuam no Blob (pro srcset), só não na
      // biblioteca. A gravação é em lote no fim (mediaSink), não 1x por imagem.
      const name = basenameFromUrl(url);
      if (kind === "image" && !/-\d+x\d+\.\w+$/.test(name)) {
        const id = createHash("sha1").update(url).digest("hex").slice(0, 16);
        mediaSink.set(id, {
          id,
          name,
          url: localUrl,
          category: "Importadas do WP",
          type: mediaTypeFromContentType(contentType),
          contentType,
          size: buf.byteLength,
          uploadedAt: new Date().toISOString(),
        });
      }

      await setMapping(url, localUrl);
      return localUrl;
    } catch {
      return null;
    }
  })();

  runCache.set(url, promise);
  return promise;
}

/** Roda `worker` sobre `items` com no máximo `limit` em paralelo. */
async function pool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;
  async function run(): Promise<void> {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

/** Ids (na biblioteca) de TODAS as imagens de uma página, pela URL. Inclui as
 * variantes de tamanho do WP (pra nada ficar órfão em "Sem página"). Ids de
 * imagens que não estão na biblioteca simplesmente não casam (no-op). */
function imageIdsForUrls(urls: string[]): string[] {
  return urls
    .filter((u) => classifyAsset(u) === "image")
    .map((u) => createHash("sha1").update(u).digest("hex").slice(0, 16));
}

/** Mapa slug-do-WP → slug-público-no-portal de todas as páginas copiadas. */
export async function buildSlugToPublic(): Promise<Record<string, string>> {
  const saved = await listSaved();
  const map: Record<string, string> = {};
  for (const s of saved) {
    if (s.publicSlug) map[s.slug.toLowerCase()] = s.publicSlug;
  }
  return map;
}

/**
 * Localiza UMA página: baixa todos os assets do WP que ela referencia, reescreve
 * o HTML (fullHtml + content) pras cópias locais E reescreve os `<a href>` de
 * páginas do WP (próprias âncoras + links pra outras páginas copiadas). Idempotente.
 *
 * @param slugToPublic  opcional — passe o mapa pré-montado no backfill pra não
 *                      reconstruí-lo a cada página.
 */
export async function localizePage(
  domain: WpDomain,
  slug: string,
  slugToPublic?: Record<string, string>
): Promise<LocalizeStats> {
  const content = await loadContent(domain, slug);
  const empty: LocalizeStats = {
    total: 0,
    localized: 0,
    failed: 0,
    byKind: {},
    failures: [],
  };
  if (!content) return empty;

  const linkMap = slugToPublic ?? (await buildSlugToPublic());
  const selfSlugs = [content.slug, content.publicSlug].filter(
    (s): s is string => !!s
  );

  const source = `${content.fullHtml || ""}\n${content.content || ""}`;
  const urls = extractWpAssetUrls(source, content.link);

  const map: Record<string, string> = {};
  const stats: LocalizeStats = {
    total: urls.length,
    localized: 0,
    failed: 0,
    byKind: {},
    failures: [],
  };

  if (urls.length > 0) {
    const runCache = new Map<string, Promise<string | null>>();
    const mediaSink = new Map<string, MediaItem>();
    const localUrls = await pool(urls, CONCURRENCY, (u) =>
      fetchAndStore(u, runCache, mediaSink)
    );
    urls.forEach((u, idx) => {
      const local = localUrls[idx];
      if (local) {
        map[u] = local;
        stats.localized++;
        const k = classifyAsset(u);
        stats.byKind[k] = (stats.byKind[k] || 0) + 1;
      } else {
        stats.failed++;
        stats.failures.push(u);
      }
    });
    // Grava as imagens novas na biblioteca de uma vez (1 leitura + 1 escrita).
    await addManyMedia([...mediaSink.values()]);

    // Agrupa as imagens dessa página numa "página de mídia" da origem (auto).
    // Cobre tanto as recém-baixadas quanto as que já estavam na biblioteca.
    const imageIds = imageIdsForUrls(urls);
    if (imageIds.length > 0) {
      const pageId = await ensureWpPage(
        content.domain,
        content.slug,
        content.title,
        content.fetchedAt
      );
      await assignMediaToPage(imageIds, pageId);
    }
  }

  // Sempre aplica: de-lazy + reescrita de assets + reescrita de links de página.
  // Roda mesmo sem assets baixados (os links de página independem disso).
  const apply = (h: string) =>
    rewriteWpAnchors(localizeHtml(h, map), selfSlugs, linkMap);
  if (content.fullHtml) content.fullHtml = apply(content.fullHtml);
  if (content.content) content.content = apply(content.content);

  const at = new Date().toISOString();
  // Marca como localizada se não havia assets a baixar OU se baixou algo. Se havia
  // assets mas NADA baixou (Blob off / falha), NÃO marca — backfill reprocessa e o
  // <base> do WP continua (não "desconecta" às cegas com imagem quebrada).
  if (urls.length === 0 || stats.localized > 0) content.localizedAt = at;
  content.localizeStats = {
    total: stats.total,
    localized: stats.localized,
    failed: stats.failed,
    at,
  };
  await saveContent(content);

  return stats;
}

/** True se a página já foi localizada (não tem mais nada pra baixar). */
export function isLocalized(c: Pick<WpPageContent, "localizedAt">): boolean {
  return !!c.localizedAt;
}

/**
 * Migração one-shot: organiza as imagens JÁ importadas do WP em páginas de mídia
 * pela origem. Não baixa nada — só lê o HTML guardado de cada página, garante a
 * página de mídia e atribui o pageId às imagens correspondentes (1 escrita final).
 */
export async function organizeImportedMediaByPage(): Promise<{
  pages: number;
  assigned: number;
}> {
  const saved = await listSaved();
  const media = await listMedia();
  // A mídia já localizada tem url do Blob; o HTML da página (também reescrito)
  // contém essas mesmas urls do Blob. Então casamos a mídia pela URL presente no
  // HTML da página — não pela url do WP (que já não existe mais no HTML).
  const urlToId = new Map<string, string>();
  for (const m of media) urlToId.set(m.url, m.id);

  const urlRe = /https?:\/\/[^\s"'()<>\\]+/gi;
  const idToPage: Record<string, string> = {};
  let pages = 0;
  for (const s of saved) {
    const content = await loadContent(s.domain, s.slug);
    if (!content) continue;
    const html = `${content.fullHtml || ""}\n${content.content || ""}`;
    const found = html.match(urlRe);
    if (!found) continue;
    const matchedIds: string[] = [];
    for (const u of found) {
      const id = urlToId.get(u);
      if (id) matchedIds.push(id);
    }
    if (matchedIds.length === 0) continue;
    const pageId = await ensureWpPage(
      content.domain,
      content.slug,
      content.title,
      content.fetchedAt
    );
    pages++;
    for (const id of matchedIds) idToPage[id] = pageId;
  }
  const assigned = await assignMediaPagesBulk(idToPage);
  return { pages, assigned };
}
