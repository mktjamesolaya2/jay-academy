import "server-only";
import { kvGet, kvSet } from "./storage";
import type { MediaItem } from "./media-types";

export type { MediaItem, MediaType } from "./media-types";

const KEY = "media:items";

export async function listMedia(): Promise<MediaItem[]> {
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  return [...items].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function addMedia(item: MediaItem): Promise<void> {
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  items.push(item);
  await kvSet(KEY, items);
}

/**
 * Adiciona vários itens de uma vez (UMA leitura + UMA escrita), pulando ids que
 * já existem. Usado pela importação em massa do WP pra não fazer read-modify-write
 * concorrente do array inteiro por imagem (o que causava corrida e perda de itens).
 */
export async function addManyMedia(items: MediaItem[]): Promise<void> {
  if (items.length === 0) return;
  const existing = (await kvGet<MediaItem[]>(KEY)) ?? [];
  const byId = new Map(existing.map((i) => [i.id, i]));
  let changed = false;
  for (const it of items) {
    const prev = byId.get(it.id);
    if (!prev) {
      byId.set(it.id, it);
      changed = true;
    } else if (prev.url !== it.url) {
      // Upsert: mesma imagem (mesmo id), url mudou (ex: Blob → Supabase na migração).
      byId.set(it.id, { ...prev, url: it.url, size: it.size, contentType: it.contentType });
      changed = true;
    }
  }
  if (changed) await kvSet(KEY, [...byId.values()]);
}

/**
 * Aponta mídias existentes para outra URL (id → url nova), numa escrita só.
 *
 * Serve pro conserto das imagens importadas do WordPress: elas foram gravadas
 * apontando pro Blob/Supabase, e quando esse armazenamento morreu ficaram todas
 * quebradas na galeria. O espelho dos mesmos arquivos está commitado em
 * public/wpmirror/, então dá pra devolvê-las sem reimportar nada.
 */
export async function apontarMidiasPara(
  novaUrl: Record<string, string>
): Promise<number> {
  const ids = Object.keys(novaUrl);
  if (ids.length === 0) return 0;
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  let n = 0;
  const next = items.map((i) => {
    const url = novaUrl[i.id];
    if (!url || i.url === url) return i;
    n++;
    return { ...i, url };
  });
  if (n) await kvSet(KEY, next);
  return n;
}

/** Remove várias mídias de uma vez. Devolve quantas saíram. */
export async function removerMidias(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const fora = new Set(ids);
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  const ficam = items.filter((i) => !fora.has(i.id));
  const n = items.length - ficam.length;
  if (n) await kvSet(KEY, ficam);
  return n;
}

export async function deleteMedia(id: string): Promise<void> {
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    items.filter((i) => i.id !== id)
  );
}

/** Remove (numa escrita só) todas as mídias cuja url contém `sub`. Retorna quantas. */
export async function removeMediaByUrlSubstring(sub: string): Promise<number> {
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  const keep = items.filter((i) => !i.url.includes(sub));
  const removed = items.length - keep.length;
  if (removed > 0) await kvSet(KEY, keep);
  return removed;
}

export async function updateMedia(
  id: string,
  patch: Partial<MediaItem>
): Promise<void> {
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    items.map((i) => (i.id === id ? { ...i, ...patch } : i))
  );
}

/** Move um conjunto de mídias pra uma página (ou pra "sem página" se pageId null). */
export async function assignMediaToPage(
  ids: string[],
  pageId: string | null
): Promise<void> {
  if (ids.length === 0) return;
  const set = new Set(ids);
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  let changed = false;
  const next = items.map((i) => {
    if (!set.has(i.id)) return i;
    const target = pageId ?? undefined;
    if (i.pageId === target) return i;
    changed = true;
    return { ...i, pageId: target };
  });
  if (changed) await kvSet(KEY, next);
}

/** Atribui páginas a várias mídias de uma vez (id → pageId) numa única escrita.
 * Usado pela migração das imagens já importadas do WP. */
export async function assignMediaPagesBulk(
  map: Record<string, string>
): Promise<number> {
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  let n = 0;
  const next = items.map((i) => {
    const pid = map[i.id];
    if (pid && i.pageId !== pid) {
      n++;
      return { ...i, pageId: pid };
    }
    return i;
  });
  if (n) await kvSet(KEY, next);
  return n;
}

/** Remove o vínculo de página de todas as mídias de uma página (ao excluir a página). */
export async function clearPageFromMedia(pageId: string): Promise<void> {
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  let changed = false;
  const next = items.map((i) => {
    if (i.pageId !== pageId) return i;
    changed = true;
    const { pageId: _drop, ...rest } = i;
    void _drop;
    return rest;
  });
  if (changed) await kvSet(KEY, next);
}
