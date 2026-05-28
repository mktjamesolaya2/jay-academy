import "server-only";
import { kvDel, kvGet, kvKeys, kvSet } from "./storage";
import type { WpPageContent as BaseWpPageContent } from "./wp-fetch-page";
import type { WpDomain } from "./wp-api";

export type PlacementType = "website" | "lp" | "form";

export type WpPageContent = BaseWpPageContent & {
  placed?: PlacementType;
  placedAt?: string;
};

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
    }))
    .sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt));
}
