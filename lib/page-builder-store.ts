import "server-only";
import { kvDel, kvGet, kvKeys, kvSet } from "./storage";
import { emptyPage, type BuilderPage } from "./page-builder-types";

// Re-export tipos pra manter compatibilidade com imports existentes do server.
// Client Components devem importar direto de "./page-builder-types".
export * from "./page-builder-types";

const KEY_PREFIX = "builder-page:";

function builderKey(slug: string): string {
  return `${KEY_PREFIX}${slug}`;
}

export async function loadBuilderPage(
  slug: string
): Promise<BuilderPage | null> {
  return await kvGet<BuilderPage>(builderKey(slug));
}

export async function saveBuilderPage(page: BuilderPage): Promise<void> {
  await kvSet(builderKey(page.slug), {
    ...page,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBuilderPage(slug: string): Promise<void> {
  await kvDel(builderKey(slug));
}

export async function listBuilderSlugs(): Promise<string[]> {
  const keys = await kvKeys(`${KEY_PREFIX}*`);
  return keys.map((k) => k.replace(KEY_PREFIX, ""));
}

export async function isBuilderPage(slug: string): Promise<boolean> {
  const page = await loadBuilderPage(slug);
  return !!page;
}

export async function ensureBuilderPage(slug: string): Promise<BuilderPage> {
  const existing = await loadBuilderPage(slug);
  if (existing) return existing;
  const fresh = emptyPage(slug);
  await saveBuilderPage(fresh);
  return fresh;
}
