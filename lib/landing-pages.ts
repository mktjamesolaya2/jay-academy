export type LpStatus =
  | "draft"
  | "published"
  | "archived"
  | "deploying"
  | "error";
export type LpType = "website" | "lp" | "form";

export type LandingPage = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  stack: string;
  status: LpStatus;
  type: LpType;
  localPath: string;
  devUrl?: string;
  devPort?: number;
  productionUrl?: string;
  domain?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  visits?: number;
  leads?: number;
  conversion?: number;
  trashed?: boolean;
  trashedAt?: string;
  accent:
    | "pink-orange"
    | "purple-fuchsia"
    | "amber-orange"
    | "gold-black"
    | "rose";
  createdAt: string;
  cover?: string;
  /**
   * Fonte de renderização do conteúdo — determina qual editor o painel
   * oferece. LPs antigas salvas no KV podem não ter o campo; nesses casos
   * inferLpSource (lib/page-catalog.ts) cai numa heurística de fallback.
   */
  contentSource?: "lp-html" | "embedded-kv" | "builder" | "react";
};

export const landingPages: LandingPage[] = [
  {
    slug: "pmuclass",
    name: "PMU CLASS",
    tagline: "Netflix da micropigmentação",
    description:
      "Portal com 4 LPs de cursos (Basic Nano, Magic Shadow, Fio a Fio, Lips Sense) + AI chat + carrossel hero.",
    stack: "Vite + React 19 + Express + OpenRouter",
    status: "published",
    type: "website",
    localPath: "PMUCLASS/PMU-CLASS",
    devPort: 3001,
    devUrl: "http://localhost:3001",
    productionUrl: "/pmuclass",
    domain: "jayacademy.com.br",
    accent: "pink-orange",
    createdAt: "2026-05-27",
    contentSource: "lp-html",
  },
  {
    slug: "magic-shadow",
    name: "Magic Shadow 3",
    tagline: "Formação avançada em micropigmentação",
    description:
      "LP cinematográfica do curso Magic Shadow. HTML/CSS puro, hero com vídeo + James + mapas Europa/Rússia.",
    stack: "HTML + CSS + JS estático",
    status: "published",
    type: "lp",
    localPath: "Magic Shadow 3",
    devUrl: "http://localhost:5500",
    productionUrl: "/magicshadow",
    accent: "gold-black",
    createdAt: "2026-05-27",
    contentSource: "embedded-kv",
  },
  {
    slug: "laser",
    name: "Jayo Laser",
    tagline: "Vertical de laser/depilação",
    description:
      "LP scaffolded via lovable.dev. TanStack Start com Radix UI completo.",
    stack: "TanStack Start + React 19 + Radix UI",
    status: "published",
    type: "lp",
    localPath: "jayo.laser",
    devPort: 8080,
    devUrl: "http://localhost:8080",
    productionUrl: "/laser",
    accent: "rose",
    createdAt: "2026-05-27",
    contentSource: "embedded-kv",
  },
  {
    slug: "apresentacao-pmu",
    name: "Apresentação PMU CLASS",
    tagline: "Microsite-keynote pra apresentar o projeto",
    description:
      "Apresentação interativa estilo Netflix com cenas, vinheta e sugestões do ChatGPT pra debate ao vivo com o time.",
    stack: "Next.js (rota interna do portal)",
    status: "published",
    type: "lp",
    localPath: "portal/app/apresentacao-pmu",
    productionUrl: "/apresentacao-pmu",
    accent: "pink-orange",
    createdAt: "2026-06-02",
    contentSource: "react",
  },
  {
    slug: "jamesolaya",
    name: "James Olaya — Site institucional",
    tagline: "Recriação do jamesolaya.com.br",
    description:
      "Cópia do site Wix recriada em HTML limpo, no sistema visual dark cinematográfico (Bebas + ouro). Hero, bio com painel diagonal, banner JAY.O, vídeo institucional, os 4 pilares em faixas diagonais e mapa dark interativo.",
    stack: "HTML + CSS + JS (rota interna do portal)",
    status: "published",
    type: "website",
    localPath: "portal/lp-html/jamesolaya.html",
    productionUrl: "/jamesolaya",
    accent: "gold-black",
    createdAt: "2026-07-21",
    contentSource: "lp-html",
  },
  {
    slug: "academy",
    name: "Jay Academy — Formações presenciais",
    tagline: "A escola presencial de James Olaya",
    description:
      "LP de apresentação da Jay Academy: a escola, a experiência, o método em 5 etapas, as 5 formações com as capas oficiais do Canva, o kit JAY.O em três painéis, o professor, a casa em fotos reais, prova social com depoimentos de alunas e fechamento em convite.",
    stack: "HTML + CSS + JS (rota interna do portal)",
    status: "published",
    type: "website",
    localPath: "portal/lp-html/academy.html",
    productionUrl: "/academy",
    accent: "gold-black",
    createdAt: "2026-08-04",
    contentSource: "lp-html",
  },
  // __INSERT_LP_HERE__
];

export function getLp(slug: string): LandingPage | undefined {
  return landingPages.find((lp) => lp.slug === slug);
}

export const statusLabel: Record<LpStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
  deploying: "Build",
  error: "Falhou",
};

export const statusColors: Record<
  LpStatus,
  { dot: string; bg: string; text: string }
> = {
  draft: {
    dot: "bg-amber-400",
    bg: "bg-amber-500/10 ring-amber-500/25",
    text: "text-amber-300",
  },
  published: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-500/10 ring-emerald-500/25",
    text: "text-emerald-300",
  },
  archived: {
    dot: "bg-neutral-500",
    bg: "bg-neutral-500/10 ring-neutral-500/25",
    text: "text-neutral-400",
  },
  deploying: {
    dot: "bg-sky-400",
    bg: "bg-sky-500/10 ring-sky-500/25",
    text: "text-sky-300",
  },
  error: {
    dot: "bg-rose-400",
    bg: "bg-rose-500/10 ring-rose-500/25",
    text: "text-rose-300",
  },
};

export const typeLabel: Record<LpType, string> = {
  website: "Website",
  lp: "LP",
  form: "Form",
};

export const typeOrder: LpType[] = ["website", "lp", "form"];

export const accentClasses: Record<LandingPage["accent"], string> = {
  "pink-orange": "from-pink-500 to-orange-500",
  "purple-fuchsia": "from-purple-500 to-fuchsia-500",
  "amber-orange": "from-amber-500 to-orange-500",
  "gold-black": "from-amber-400 to-yellow-600",
  rose: "from-pink-400 to-rose-400",
};

/**
 * URL pública da LP. Prioridade:
 * 1. productionUrl explícita (LPs hardcoded como pmuclass/laser/magicshadow)
 * 2. /p/[slug] se publicada (LPs criadas via builder)
 * 3. null se ainda não tem URL pública
 */
export function publicUrlFor(lp: LandingPage): string | null {
  if (lp.productionUrl) return lp.productionUrl;
  if (lp.status === "published") return `/${lp.slug}`;
  return null;
}

export function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `Há ${min}min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Há ${days}d`;
}
