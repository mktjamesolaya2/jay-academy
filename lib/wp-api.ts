import "server-only";

export type WpDomain = "main" | "lp";

export type WpPage = {
  id: number;
  slug: string;
  title: string;
  status: string;
  link: string;
  modified: string;
  domain: WpDomain;
};

const SOURCES: { domain: WpDomain; base: string }[] = [
  { domain: "main", base: "https://jayacademy.com.br" },
  { domain: "lp", base: "https://lp.jayacademy.com.br" },
];

type RawWpPage = {
  id: number;
  slug: string;
  title?: { rendered?: string } | string;
  status: string;
  link: string;
  modified: string;
};

function decodeTitle(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "rendered" in value) {
    const rendered = (value as { rendered?: string }).rendered ?? "";
    return rendered
      .replace(/&#8211;/g, "–")
      .replace(/&#8217;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/<[^>]*>/g, "")
      .trim();
  }
  return "";
}

export function pageKey(page: WpPage): string {
  return `${page.domain}:${page.id}`;
}

export async function fetchAllWpPages(): Promise<WpPage[]> {
  const results = await Promise.all(
    SOURCES.map(async (src) => {
      const url = `${src.base}/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,title,status,link,modified`;
      try {
        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) return [];
        const json = (await res.json()) as RawWpPage[];
        return json.map(
          (p): WpPage => ({
            id: p.id,
            slug: p.slug,
            title: decodeTitle(p.title) || p.slug,
            status: p.status,
            link: p.link,
            modified: p.modified,
            domain: src.domain,
          })
        );
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}
