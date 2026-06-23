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
  const have = new Set(existing.map((i) => i.id));
  const fresh = items.filter((i) => !have.has(i.id));
  if (fresh.length === 0) return;
  await kvSet(KEY, [...existing, ...fresh]);
}

export async function deleteMedia(id: string): Promise<void> {
  const items = (await kvGet<MediaItem[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    items.filter((i) => i.id !== id)
  );
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
