import "server-only";
import type { WpDomain } from "./wp-api";

export type WpPageContent = {
  id: number;
  slug: string;
  domain: WpDomain;
  title: string;
  content: string;
  fullHtml?: string;
  excerpt: string;
  link: string;
  modified: string;
  fetchedAt: string;
};

const BASE: Record<WpDomain, string> = {
  main: "https://jayacademy.com.br",
  lp: "https://lp.jayacademy.com.br",
};

type RawPage = {
  id: number;
  slug: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  excerpt?: { rendered?: string };
  link: string;
  modified: string;
};

export async function fetchPageContent(
  domain: WpDomain,
  id: number
): Promise<WpPageContent | null> {
  const url = `${BASE[domain]}/wp-json/wp/v2/pages/${id}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as RawPage;

    let fullHtml: string | undefined;
    try {
      const pageRes = await fetch(json.link, {
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0 jayacademy-portal/0.1" },
      });
      if (pageRes.ok) {
        fullHtml = await pageRes.text();
      }
    } catch {
      // ignore — content from REST API serves as fallback
    }

    return {
      id: json.id,
      slug: json.slug,
      domain,
      title: json.title?.rendered ?? "",
      content: json.content?.rendered ?? "",
      fullHtml,
      excerpt: json.excerpt?.rendered ?? "",
      link: json.link,
      modified: json.modified,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
