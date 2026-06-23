import "server-only";
import { kvGet, kvSet } from "./storage";
import type { MediaPage } from "./media-types";

export type { MediaPage } from "./media-types";

const KEY = "media:pages";

export async function listPages(): Promise<MediaPage[]> {
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  // Manuais primeiro, depois as do WP; cada grupo por nome.
  return [...pages].sort((a, b) => {
    if (a.source !== b.source) return a.source === "manual" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getPage(id: string): Promise<MediaPage | null> {
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  return pages.find((p) => p.id === id) ?? null;
}

/** Cria uma página manual. Retorna a página criada. */
export async function createPage(
  name: string,
  newId: () => string
): Promise<MediaPage> {
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  const page: MediaPage = {
    id: `pg-${newId()}`,
    name: name.trim() || "Sem nome",
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  await kvSet(KEY, [...pages, page]);
  return page;
}

/**
 * Garante que existe a página da origem WP (id estável `wp:<domain>:<slug>`).
 * Atualiza o nome se mudou. Retorna o id da página.
 */
export async function ensureWpPage(
  domain: string,
  slug: string,
  name: string,
  at: string
): Promise<string> {
  const id = `wp:${domain}:${slug}`;
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  const cleanName = (name || slug).replace(/<[^>]*>/g, "").trim() || slug;
  const existing = pages.find((p) => p.id === id);
  if (existing) {
    if (existing.name !== cleanName) {
      await kvSet(
        KEY,
        pages.map((p) => (p.id === id ? { ...p, name: cleanName } : p))
      );
    }
    return id;
  }
  const page: MediaPage = {
    id,
    name: cleanName,
    source: "wp",
    createdAt: at,
  };
  await kvSet(KEY, [...pages, page]);
  return id;
}

export async function renamePage(id: string, name: string): Promise<void> {
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    pages.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p))
  );
}

export async function deletePage(id: string): Promise<void> {
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    pages.filter((p) => p.id !== id)
  );
}
