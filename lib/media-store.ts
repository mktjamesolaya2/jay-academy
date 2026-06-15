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
