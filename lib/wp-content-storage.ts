import "server-only";
import { kvDel, kvGet, kvKeys, kvMget, kvSet } from "./storage";
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
  /** Webhook URL pra onde mandar leads quando o form da página é enviado. */
  formWebhookUrl?: string;
  /** Pra onde redirecionar o usuário depois do submit. */
  formRedirectUrl?: string;
  /** Soft delete — fica na lixeira. */
  trashed?: boolean;
  trashedAt?: string;
  /** Resumo inteligente (IA) do conteúdo da página. */
  summary?: string;
  summaryAt?: string;
  /** SEO por página. */
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  seoCanonical?: string;
  seoNoIndex?: boolean;
  /** Agendamento (ISO). O cron publica/despublica quando a hora chega. */
  scheduledPublishAt?: string;
  scheduledUnpublishAt?: string;
  /** Quando os assets do WP foram baixados pro storage local (independência do WP). */
  localizedAt?: string;
  localizeStats?: {
    total: number;
    localized: number;
    failed: number;
    at: string;
  };
  /** Quando a página foi re-localizada pro storage novo (migração Blob→Supabase). */
  relocatedAt?: string;
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

/**
 * Carrega TODOS os conteúdos wp:content de uma vez: 1 kvKeys + 1 kvMget (batch)
 * em vez do antigo 1 + N kvGet. Corta ~70 comandos de KV por render das telas
 * do painel (listSaved/listPublished/listTrashed filtram desta mesma lista).
 */
async function loadAllContents(): Promise<WpPageContent[]> {
  const keys = await kvKeys("wp:content:*");
  const contents = await kvMget<WpPageContent>(keys);
  return contents.filter((c): c is WpPageContent => c !== null);
}

export async function listPublished(): Promise<WpPageContent[]> {
  return (await loadAllContents()).filter((c) => !!c.published);
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
  publishedAt?: string;
  publicSlug?: string;
  trashed?: boolean;
  trashedAt?: string;
  localizedAt?: string;
  localizeStats?: WpPageContent["localizeStats"];
  relocatedAt?: string;
};

function summarize(c: WpPageContent): SavedSummary {
  return {
    domain: c.domain,
    slug: c.slug,
    title: c.title,
    modified: c.modified,
    fetchedAt: c.fetchedAt,
    placed: c.placed,
    published: c.published,
    publishedAt: c.publishedAt,
    publicSlug: c.publicSlug,
    trashed: c.trashed,
    trashedAt: c.trashedAt,
    localizedAt: c.localizedAt,
    localizeStats: c.localizeStats,
    relocatedAt: c.relocatedAt,
  };
}

export async function listSaved(): Promise<SavedSummary[]> {
  const valid = await loadAllContents();
  return valid
    .filter((c) => !c.trashed)
    .map(summarize)
    .sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt));
}

export async function listTrashed(): Promise<SavedSummary[]> {
  const valid = await loadAllContents();
  return valid
    .filter((c) => c.trashed)
    .map(summarize)
    .sort((a, b) =>
      (b.trashedAt ?? "").localeCompare(a.trashedAt ?? "")
    );
}

/** Soft delete — marca como trashed em vez de remover. */
export async function trashContent(
  domain: WpDomain,
  slug: string
): Promise<void> {
  const content = await loadContent(domain, slug);
  if (!content) return;
  // Despublica se estava no ar
  if (content.published && content.publicSlug) {
    await kvDel(`published-index:${content.publicSlug}`);
  }
  content.trashed = true;
  content.trashedAt = new Date().toISOString();
  content.published = false;
  delete content.publishedAt;
  delete content.publicSlug;
  await saveContent(content);
}

export async function restoreContent(
  domain: WpDomain,
  slug: string
): Promise<void> {
  const content = await loadContent(domain, slug);
  if (!content) return;
  content.trashed = false;
  delete content.trashedAt;
  await saveContent(content);
}
