import "server-only";
import { kvGet, kvSet, kvKeys } from "./storage";

export type PageStats = {
  slug: string;
  visits: number;
  sources: Record<string, number>;
  lastVisit?: string;
};

const PREFIX = "analytics:page:";

export async function recordVisit(
  slug: string,
  source: string,
  at: string
): Promise<void> {
  const key = PREFIX + slug;
  const cur =
    (await kvGet<PageStats>(key)) ?? { slug, visits: 0, sources: {} };
  cur.visits += 1;
  cur.sources[source] = (cur.sources[source] ?? 0) + 1;
  cur.lastVisit = at;
  await kvSet(key, cur);
}

export async function getPageStats(slug: string): Promise<PageStats | null> {
  return await kvGet<PageStats>(PREFIX + slug);
}

export async function getAllPageStats(): Promise<PageStats[]> {
  const keys = await kvKeys(PREFIX + "*");
  const all = await Promise.all(keys.map((k) => kvGet<PageStats>(k)));
  return all.filter((s): s is PageStats => !!s);
}
