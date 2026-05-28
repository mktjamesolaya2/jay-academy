import "server-only";
import { kvDel, kvGet, kvKeys, kvSet } from "./storage";
import type { WpPageContent as BaseWpPageContent } from "./wp-fetch-page";
import type { WpDomain } from "./wp-api";
export type { WpDomain };

export type PlacementType = "website" | "lp" | "form";

export type WpPageContent = BaseWpPageContent & {
  placed?: PlacementType;
  placedAt?: string;
  published?: boolean;
  publishedAt?: string;
  publicSlug?: string;
};

// Index: slug público → { domain, originalSlug }
// Permite buscar página WP pela URL pública /p/[slug]
type PublishedIndex = { domain: WpDomain; slug: string };

export async function getPublishedBySlug(
  publicSlug: string
): Promise<{ domain: WpDomain; slug: string } | null> {
  return await kvGet<PublishedIndex>(`published-index:${publicSlug}`);
}

export async function setPublished(
  content: WpPageContent,
  publicSlug: string
): Promise<void> {
  // Verifica conflito de slug
  const existing = await getPublishedBySlug(publicSlug);
  if (
    existing &&
    !(existing.domain === content.domain && existing.slug === content.slug)
  ) {
    throw new Error(
      `Já existe outra página publicada com slug "${publicSlug}"`
    );
  }

  // Se a página tinha slug diferente antes, limpa o antigo
  if (content.publicSlug && content.publicSlug !== publicSlug) {
    await kvDel(`published-index:${content.publicSlug}`);
  }

  content.published = true;
  content.publishedAt = new Date().toISOString();
  content.publicSlug = publicSlug;
  await saveContent(content);

  await kvSet<PublishedIndex>(`published-index:${publicSlug}`, {
    domain: content.domain,
    slug: content.slug,
  });
}

export async function unsetPublished(content: WpPageContent): Promise<void> {
  if (content.publicSlug) {
    await kvDel(`published-index:${content.publicSlug}`);
  }
  content.published = false;
  delete content.publishedAt;
  delete content.publicSlug;
  await saveContent(content);
}

export async function listPublished(): Promise<WpPageContent[]> {
  const keys = await kvKeys("wp:content:*");
  const contents = await Promise.all(keys.map((k) => kvGet<WpPageContent>(k)));
  return contents.filter((c): c is WpPageContent => c !== null && !!c.published);
}

function keyFor(domain: WpDomain, slug: string): string {
  return `wp:content:${domain}:${slug}`;
}

export async function saveContent(c: WpPageContent): Promise<void> {
  await kvSet(keyFor(c.domain, c.slug), c);
}

export async function loadContent(
  domain: WpDomain,
  slug: string
): Promise<WpPageContent | null> {
  return await kvGet<WpPageContent>(keyFor(domain, slug));
}

export async function deleteContent(
  domain: WpDomain,
  slug: string
): Promise<void> {
  await kvDel(keyFor(domain, slug));
}

export async function deleteAllContent(): Promise<void> {
  const keys = await kvKeys("wp:content:*");
  await Promise.all(keys.map((k) => kvDel(k)));
}

export async function markPlaced(
  domain: WpDomain,
  slug: string,
  type: PlacementType | null
): Promise<void> {
  const content = await loadContent(domain, slug);
  if (!content) return;
  if (type === null) {
    delete content.placed;
    delete content.placedAt;
  } else {
    content.placed = type;
    content.placedAt = new Date().toISOString();
  }
  await saveContent(content);
}

export type SavedSummary = {
  domain: WpDomain;
  slug: string;
  title: string;
  modified: string;
  fetchedAt: string;
  placed?: PlacementType;
  published?: boolean;
  publicSlug?: string;
};

export async function listSaved(): Promise<SavedSummary[]> {
  const keys = await kvKeys("wp:content:*");
  const contents = await Promise.all(
    keys.map((k) => kvGet<WpPageContent>(k))
  );
  const valid = contents.filter((c): c is WpPageContent => c !== null);
  return valid
    .map((c) => ({
      domain: c.domain,
      slug: c.slug,
      title: c.title,
      modified: c.modified,
      fetchedAt: c.fetchedAt,
      placed: c.placed,
      published: c.published,
      publicSlug: c.publicSlug,
    }))
    .sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt));
}
