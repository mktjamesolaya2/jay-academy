import "server-only";
import { kvDel, kvGet, kvKeys, kvMget, kvSet } from "./storage";
import { isReservedSlug } from "./reserved-slugs";
import type { WpPageContent as BaseWpPageContent } from "./wp-fetch-page";
import type { WpDomain } from "./wp-api";
export type { WpDomain };

export type PlacementType = "website" | "lp" | "form";

export type WpPageContent = Omit<BaseWpPageContent, "domain"> & {
  /** Host de origem — "main"/"lp" (WP legado) ou qualquer host de site copiado. */
  domain: string;
  /** Origem do conteúdo: "wp" (WordPress legado) ou "web" (qualquer URL copiada). */
  sourceKind?: "wp" | "web";
  /** URL original de onde a página foi copiada (quando sourceKind === "web"). */
  sourceUrl?: string;
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
type PublishedIndex = { domain: string; slug: string };

export async function getPublishedBySlug(
  publicSlug: string
): Promise<{ domain: string; slug: string } | null> {
  return await kvGet<PublishedIndex>(`published-index:${publicSlug}`);
}

export async function setPublished(
  content: WpPageContent,
  publicSlug: string
): Promise<void> {
  // Slug reservado (rota do sistema / LP estática): publicar ali cria uma página
  // INVISÍVEL (o Next resolve a rota real primeiro). Barra em TODOS os fluxos de
  // publicação (botão, bulk, autoPublish), não só no import — foi o buraco do "Apple 404".
  if (isReservedSlug(publicSlug)) {
    throw new Error(
      `O slug "${publicSlug}" é reservado (rota do sistema) — escolha outro slug público`
    );
  }

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

function keyFor(domain: string, slug: string): string {
  return `wp:content:${domain}:${slug}`;
}

// ── Índice leve de resumos ──────────────────────────────────────────────────
// As listagens do painel (listSaved/listPublished/listTrashed) só precisam de
// título/status/slug/datas — NÃO do fullHtml (~250KB/página). Carregar o
// conteúdo completo de ~96 páginas só pra listar dava ~24MB por render e
// estourava o limite do KV. Mantemos um resumo minúsculo por página numa chave
// própria `wp:summary:<domain>:<slug>` (valores pequenos, leitura barata e sem
// corrida em ações em lote). `saveContent` grava o resumo; `deleteContent`
// remove. Enquanto o índice não existir (1ª vez após deploy), cai no fallback
// correto (leitura em lotes do conteúdo). Rebuild explícito via rebuildSummaryIndex.
function summaryKey(domain: string, slug: string): string {
  return `wp:summary:${domain}:${slug}`;
}

async function loadSummaries(): Promise<SavedSummary[]> {
  const keys = await kvKeys("wp:summary:*");
  if (keys.length > 0) {
    const vals = await kvMget<SavedSummary>(keys);
    return vals.filter((s): s is SavedSummary => s !== null);
  }
  // Índice ainda não construído → fallback correto (não escreve durante render).
  return (await loadAllContents()).map(summarize);
}

/** Reconstrói o índice de resumos a partir do conteúdo completo (em lotes). */
export async function rebuildSummaryIndex(): Promise<number> {
  const contents = await loadAllContents();
  for (const c of contents) {
    await kvSet(summaryKey(c.domain, c.slug), summarize(c));
  }
  return contents.length;
}

export async function listPublished(): Promise<SavedSummary[]> {
  return (await loadSummaries()).filter((s) => !!s.published);
}

export async function saveContent(c: WpPageContent): Promise<void> {
  await kvSet(keyFor(c.domain, c.slug), c);
  // Mantém o índice leve em dia (choke point de escrita de toda mutação).
  await kvSet(summaryKey(c.domain, c.slug), summarize(c));
}

export async function loadContent(
  domain: string,
  slug: string
): Promise<WpPageContent | null> {
  return await kvGet<WpPageContent>(keyFor(domain, slug));
}

export async function deleteContent(
  domain: WpDomain,
  slug: string
): Promise<void> {
  await kvDel(keyFor(domain, slug));
  await kvDel(summaryKey(domain, slug));
}

export async function deleteAllContent(): Promise<void> {
  const keys = await kvKeys("wp:content:*");
  const summaryKeys = await kvKeys("wp:summary:*");
  await Promise.all([...keys, ...summaryKeys].map((k) => kvDel(k)));
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
  domain: string;
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
  sourceKind?: "wp" | "web";
  sourceUrl?: string;
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
    sourceKind: c.sourceKind ?? "wp",
    sourceUrl: c.sourceUrl,
  };
}

export async function listSaved(): Promise<SavedSummary[]> {
  return (await loadSummaries())
    .filter((s) => !s.trashed)
    .sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt));
}

export async function listTrashed(): Promise<SavedSummary[]> {
  return (await loadSummaries())
    .filter((s) => s.trashed)
    .sort((a, b) => (b.trashedAt ?? "").localeCompare(a.trashedAt ?? ""));
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
