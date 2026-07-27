// Núcleo PURO do catálogo de páginas: tipos, merge com precedência e
// contagens. Sem "server-only" e sem imports de stores — assim a lógica de
// dedup/colisão (a parte mais frágil) é testável com node --test
// (ver lib/page-catalog.test.ts). A agregação com dados reais fica em
// lib/page-catalog.ts.

import type { LpStatus } from "./landing-pages";

/** Fonte de renderização — de onde vem o conteúdo servido ao público. */
export type PageSource =
  | "lp-html" // HTML em git (lp-html/*.html) servido por handler dedicado
  | "embedded-kv" // HTML base em git + edições persistidas no KV
  | "builder" // JSON do page builder (KV)
  | "wp-mirror" // espelho de página do WordPress (KV)
  | "web-mirror" // espelho de página copiada de qualquer site (KV)
  | "react" // rota React nativa do portal
  | "redirect"; // handler que só redireciona (308)

/** Categoria de negócio da página. */
export type PageCategory = "venda" | "website" | "form" | "institucional";

export type CatalogEntry = {
  slug: string;
  title: string;
  /** Caminho público, ex: "/basic-nanofios" */
  url: string;
  source: PageSource;
  category: PageCategory;
  status: LpStatus;
  /** Link do editor no painel (derivado da fonte; lp-html não tem editor) */
  editHref?: string;
  /** Link da tela de detalhe/gestão no painel */
  manageHref?: string;
  /** Só para source "redirect": destino */
  redirectTo?: string;
  lastModified?: string;
  /** true quando o mesmo caminho existe em mais de uma camada (sombreado) */
  collision?: boolean;
  origin?: { domain?: string; wpSlug?: string; formId?: string };
};

/**
 * Mescla camadas de entradas na ordem de precedência em que o Next resolve
 * as rotas (primeira camada vence): handler dedicado > LPs do painel >
 * forms > catch-all /[slug] (WP/builder). Quando o mesmo caminho aparece em
 * mais de uma camada, a entrada vencedora ganha `collision: true` — hoje
 * esse sombreamento é silencioso e invisível no painel.
 */
export function mergeCatalog(layers: CatalogEntry[][]): CatalogEntry[] {
  const byUrl = new Map<string, CatalogEntry>();
  for (const layer of layers) {
    for (const entry of layer) {
      const existing = byUrl.get(entry.url);
      if (existing) {
        // Camada anterior venceu; marca colisão (exceto redirect × destino,
        // que não compartilham URL, e entradas idênticas da mesma origem).
        if (existing.source !== entry.source || existing.slug !== entry.slug) {
          existing.collision = true;
        }
        continue;
      }
      byUrl.set(entry.url, { ...entry });
    }
  }
  return [...byUrl.values()];
}

export type CatalogCounts = {
  total: number;
  bySource: Partial<Record<PageSource, number>>;
  byCategory: Partial<Record<PageCategory, number>>;
  byStatus: Partial<Record<LpStatus, number>>;
  collisions: number;
};

export function catalogCounts(entries: CatalogEntry[]): CatalogCounts {
  const counts: CatalogCounts = {
    total: entries.length,
    bySource: {},
    byCategory: {},
    byStatus: {},
    collisions: 0,
  };
  for (const e of entries) {
    counts.bySource[e.source] = (counts.bySource[e.source] ?? 0) + 1;
    counts.byCategory[e.category] = (counts.byCategory[e.category] ?? 0) + 1;
    counts.byStatus[e.status] = (counts.byStatus[e.status] ?? 0) + 1;
    if (e.collision) counts.collisions++;
  }
  return counts;
}

export const sourceLabel: Record<PageSource, string> = {
  "lp-html": "HTML no repo",
  "embedded-kv": "HTML editável",
  builder: "Builder",
  "wp-mirror": "Página migrada",
  "web-mirror": "Copiada da web",
  react: "Página do portal",
  redirect: "Redirect",
};

/** Mesmo padrão visual de statusColors (lib/landing-pages.ts). */
export const sourceColors: Record<
  PageSource,
  { dot: string; bg: string; text: string }
> = {
  "lp-html": {
    dot: "bg-violet-400",
    bg: "bg-violet-500/10 ring-violet-500/25",
    text: "text-violet-300",
  },
  "embedded-kv": {
    dot: "bg-sky-400",
    bg: "bg-sky-500/10 ring-sky-500/25",
    text: "text-sky-300",
  },
  builder: {
    dot: "bg-fuchsia-400",
    bg: "bg-fuchsia-500/10 ring-fuchsia-500/25",
    text: "text-fuchsia-300",
  },
  "wp-mirror": {
    dot: "bg-teal-400",
    bg: "bg-teal-500/10 ring-teal-500/25",
    text: "text-teal-300",
  },
  "web-mirror": {
    dot: "bg-lime-400",
    bg: "bg-lime-500/10 ring-lime-500/25",
    text: "text-lime-300",
  },
  react: {
    dot: "bg-indigo-400",
    bg: "bg-indigo-500/10 ring-indigo-500/25",
    text: "text-indigo-300",
  },
  redirect: {
    dot: "bg-neutral-500",
    bg: "bg-neutral-500/10 ring-neutral-500/25",
    text: "text-neutral-400",
  },
};

export const categoryLabel: Record<PageCategory, string> = {
  venda: "LP de venda",
  website: "Website",
  form: "Formulário",
  institucional: "Institucional",
};

export const sourceOrder: PageSource[] = [
  "lp-html",
  "embedded-kv",
  "builder",
  "wp-mirror",
  "web-mirror",
  "react",
  "redirect",
];
