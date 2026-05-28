import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import type { WpPageContent as BaseWpPageContent } from "./wp-fetch-page";
import type { WpDomain } from "./wp-api";

export type PlacementType = "website" | "lp" | "form";

export type WpPageContent = BaseWpPageContent & {
  placed?: PlacementType;
  placedAt?: string;
};

const DIR = path.resolve(process.cwd(), "data/wp-content");

function fileFor(domain: WpDomain, slug: string): string {
  return path.join(DIR, `${domain}_${slug}.json`);
}

export async function saveContent(c: WpPageContent): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(fileFor(c.domain, c.slug), JSON.stringify(c, null, 2), "utf-8");
}

export async function loadContent(
  domain: WpDomain,
  slug: string
): Promise<WpPageContent | null> {
  try {
    const raw = await fs.readFile(fileFor(domain, slug), "utf-8");
    return JSON.parse(raw) as WpPageContent;
  } catch {
    return null;
  }
}

export async function deleteContent(
  domain: WpDomain,
  slug: string
): Promise<void> {
  try {
    await fs.unlink(fileFor(domain, slug));
  } catch {
    // arquivo não existe, ok
  }
}

export async function deleteAllContent(): Promise<void> {
  try {
    const files = await fs.readdir(DIR);
    await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map((f) => fs.unlink(path.join(DIR, f)).catch(() => {}))
    );
  } catch {
    // pasta não existe, ok
  }
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
  try {
    const files = await fs.readdir(DIR);
    const summaries = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const raw = await fs.readFile(path.join(DIR, f), "utf-8");
          const c = JSON.parse(raw) as WpPageContent;
          return {
            domain: c.domain,
            slug: c.slug,
            title: c.title,
            modified: c.modified,
            fetchedAt: c.fetchedAt,
            placed: c.placed,
          } satisfies SavedSummary;
        })
    );
    return summaries.sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt));
  } catch {
    return [];
  }
}
