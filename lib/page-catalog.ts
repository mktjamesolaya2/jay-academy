// Catálogo unificado de páginas públicas — agregação PURA em memória das
// fontes que já existem (sem novo store KV, nada pra sincronizar):
//   1. Registro estático das LPs em git (lib/lp-html-registry.ts)
//   2. LPs do painel (lib/lp-store.ts — builder, HTML editável, rotas React)
//   3. Formulários públicos /f/[slug] (lib/forms-store.ts)
//   4. Cópias do WordPress (lib/wp-content-storage.ts)
// A precedência do merge espelha como o Next resolve as rotas: handler
// dedicado > catch-all /[slug]. Ver lib/page-catalog-core.ts pro merge puro.

import "server-only";
import {
  publicUrlFor,
  type LandingPage,
  type LpType,
} from "./landing-pages";
import { loadLps } from "./lp-store";
import { listSaved, type SavedSummary } from "./wp-content-storage";
import { listBuilderSlugs } from "./page-builder-store";
import { listForms, type FormConfig } from "./forms-store";
import {
  getLpHtmlEntry,
  lpHtmlPages,
  lpHtmlRedirects,
} from "./lp-html-registry";
import {
  mergeCatalog,
  sourceOrder,
  type CatalogEntry,
  type PageCategory,
  type PageSource,
} from "./page-catalog-core";

export * from "./page-catalog-core";

const typeToCategory: Record<LpType, PageCategory> = {
  website: "website",
  lp: "venda",
  form: "form",
};

/**
 * Fonte de renderização de uma LP do painel. Usa o campo `contentSource`
 * quando presente; senão cai na heurística (LPs antigas persistidas no KV
 * antes do campo existir — o merge seed×KV do lp-store não repõe campos
 * novos em registros já salvos).
 */
export function inferLpSource(
  lp: LandingPage,
  builderSlugs: string[]
): PageSource {
  if (lp.contentSource) return lp.contentSource;
  if (getLpHtmlEntry(lp.slug)) return "lp-html";
  if (builderSlugs.includes(lp.slug)) return "builder";
  // Heurística legada dos slugs hardcoded do painel
  if (lp.slug === "magic-shadow" || lp.slug === "laser") return "embedded-kv";
  if (lp.slug === "apresentacao-pmu") return "react";
  return "builder";
}

function editHrefFor(source: PageSource, slug: string): string | undefined {
  switch (source) {
    case "builder":
      return `/lps/${slug}/build`;
    case "embedded-kv":
      return `/lps/${slug}/edit-visual`;
    default:
      // lp-html é editada no repo (commit); react/wp-mirror têm fluxos próprios
      return undefined;
  }
}

function lpHtmlLayer(lps: LandingPage[]): CatalogEntry[] {
  return lpHtmlPages.map((p) => {
    // Se a LP também tem registro no painel (ex: pmuclass), aproveita o
    // detalhe /lps/[slug] como tela de gestão — não é colisão, é a mesma página.
    const twin = lps.find((lp) => lp.slug === p.slug && !lp.trashed);
    return {
      slug: p.slug,
      title: p.title,
      url: `/${p.slug}`,
      source: "lp-html" as const,
      category: p.category,
      status: "published" as const,
      manageHref: twin ? `/lps/${p.slug}` : undefined,
      lastModified: twin?.lastEditedAt,
    };
  });
}

function redirectLayer(): CatalogEntry[] {
  return lpHtmlRedirects.map((r) => ({
    slug: r.from,
    title: `/${r.from} → /${r.to}`,
    url: `/${r.from}`,
    source: "redirect" as const,
    category: getLpHtmlEntry(r.to)?.category ?? "venda",
    status: "published" as const,
    redirectTo: `/${r.to}`,
  }));
}

function lpLayer(lps: LandingPage[], builderSlugs: string[]): CatalogEntry[] {
  return lps
    .filter((lp) => !lp.trashed)
    // As que estão no registro lp-html já entraram pela camada 1
    .filter((lp) => !getLpHtmlEntry(lp.slug))
    .map((lp) => {
      const source = inferLpSource(lp, builderSlugs);
      return {
        slug: lp.slug,
        title: lp.name,
        url: publicUrlFor(lp) ?? `/${lp.slug}`,
        source,
        category: typeToCategory[lp.type],
        status: lp.status,
        editHref: editHrefFor(source, lp.slug),
        manageHref: `/lps/${lp.slug}`,
        lastModified: lp.lastEditedAt,
      };
    });
}

function formLayer(forms: FormConfig[]): CatalogEntry[] {
  return forms.map((f) => ({
    slug: f.slug,
    title: f.name,
    url: `/f/${f.slug}`,
    source: "react" as const,
    category: "form" as const,
    status: "published" as const,
    manageHref: "/forms",
    origin: { formId: f.id },
  }));
}

function wpLayer(saved: SavedSummary[]): CatalogEntry[] {
  return saved.map((wp) => {
    const publicSlug = wp.publicSlug ?? wp.slug;
    return {
      slug: publicSlug,
      title: wp.title,
      url: `/${publicSlug}`,
      source: "wp-mirror" as const,
      category: wp.placed ? typeToCategory[wp.placed] : "institucional",
      status: wp.published ? ("published" as const) : ("draft" as const),
      manageHref: `/wp-pages/${wp.domain}/${wp.slug}`,
      lastModified: wp.modified,
      origin: { domain: wp.domain, wpSlug: wp.slug },
    };
  });
}

/** Rotas React públicas do portal que não estão em nenhum store. */
const NATIVE_PAGES: CatalogEntry[] = [
  {
    slug: "cadastro",
    title: "Cadastro no portal",
    url: "/cadastro",
    source: "react",
    category: "institucional",
    status: "published",
  },
];

export type CatalogSources = {
  lps: LandingPage[];
  saved: SavedSummary[];
  builderSlugs: string[];
  forms: FormConfig[];
};

/** Busca as fontes no KV (uma vez) — reutilizável pelo dashboard. */
export async function loadCatalogSources(): Promise<CatalogSources> {
  const [lps, saved, builderSlugs, forms] = await Promise.all([
    loadLps(),
    listSaved(),
    listBuilderSlugs(),
    listForms(),
  ]);
  return { lps, saved, builderSlugs, forms };
}

/** Monta o catálogo a partir de fontes já carregadas (puro, sem I/O). */
export function assembleCatalog(sources: CatalogSources): CatalogEntry[] {
  const entries = mergeCatalog([
    // Ordem = precedência de rota no Next (primeira vence, resto marca colisão)
    lpHtmlLayer(sources.lps),
    redirectLayer(),
    lpLayer(sources.lps, sources.builderSlugs),
    formLayer(sources.forms),
    NATIVE_PAGES,
    wpLayer(sources.saved),
  ]);
  return entries.sort(
    (a, b) =>
      sourceOrder.indexOf(a.source) - sourceOrder.indexOf(b.source) ||
      a.title.localeCompare(b.title, "pt-BR")
  );
}

export async function buildPageCatalog(
  preloaded?: CatalogSources
): Promise<CatalogEntry[]> {
  const sources = preloaded ?? (await loadCatalogSources());
  return assembleCatalog(sources);
}
