import "server-only";
import { createHash } from "node:crypto";
import { kvGet, kvSet, blobUpload } from "./storage";
import { addManyMedia } from "./media-store";
import { mediaTypeFromContentType, type MediaItem } from "./media-types";
import {
  loadContent,
  saveContent,
  type WpPageContent,
} from "./wp-content-storage";
import type { WpDomain } from "./wp-api";
import {
  extractWpAssetUrls,
  classifyAsset,
  localizeHtml,
  rewriteCssUrls,
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

/**
 * Localiza UMA página: baixa todos os assets do WP que ela referencia e
 * reescreve o HTML guardado (fullHtml + content) pra apontar pras cópias locais.
 * Marca `localizedAt`. Idempotente.
 */
export async function localizePage(
  domain: WpDomain,
  slug: string
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

  const source = `${content.fullHtml || ""}\n${content.content || ""}`;
  const urls = extractWpAssetUrls(source, content.link);
  if (urls.length === 0) {
    content.localizedAt = new Date().toISOString();
    await saveContent(content);
    return empty;
  }

  const runCache = new Map<string, Promise<string | null>>();
  const mediaSink = new Map<string, MediaItem>();
  const localUrls = await pool(urls, CONCURRENCY, (u) =>
    fetchAndStore(u, runCache, mediaSink)
  );

  const map: Record<string, string> = {};
  const stats: LocalizeStats = {
    total: urls.length,
    localized: 0,
    failed: 0,
    byKind: {},
    failures: [],
  };
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

  // Grava as imagens novas na biblioteca de uma vez só (1 leitura + 1 escrita).
  await addManyMedia([...mediaSink.values()]);

  // O de-lazy + reescrita roda sempre (ajuda mesmo em localização parcial).
  if (content.fullHtml) content.fullHtml = localizeHtml(content.fullHtml, map);
  if (content.content) content.content = localizeHtml(content.content, map);

  const at = new Date().toISOString();
  // Só marca como localizada se DE FATO baixou algo. Se nada baixou (Blob não
  // configurado / falha transitória), NÃO marca — assim o backfill reprocessa e
  // o <base> do WP continua (a página não "desconecta" às cegas com imagem quebrada).
  if (stats.localized > 0) content.localizedAt = at;
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
