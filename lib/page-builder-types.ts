/**
 * Tipos + constantes puros do page builder.
 *
 * Separado de `page-builder-store.ts` pq esse aqui é importado por
 * Client Components (editor) e Server Components. O store é apenas
 * server (server-only KV).
 */

export type BlockType =
  | "hero"
  | "testimonials"
  | "faq"
  | "cta"
  | "pricing"
  | "text"
  | "image";

export type HeroData = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundImage?: string;
  align: "left" | "center";
};

export type TestimonialsData = {
  eyebrow?: string;
  title?: string;
  items: Array<{
    name: string;
    role?: string;
    avatar?: string;
    text: string;
  }>;
};

export type FAQData = {
  eyebrow?: string;
  title?: string;
  items: Array<{ question: string; answer: string }>;
};

export type CTAData = {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaUrl: string;
};

export type PricingData = {
  eyebrow?: string;
  title?: string;
  plans: Array<{
    name: string;
    price: string;
    period?: string;
    features: string[];
    ctaLabel: string;
    ctaUrl: string;
    highlight?: boolean;
  }>;
};

export type TextData = {
  content: string;
  align: "left" | "center";
};

export type ImageData = {
  src: string;
  alt?: string;
  caption?: string;
};

export type Block =
  | { id: string; type: "hero"; data: HeroData }
  | { id: string; type: "testimonials"; data: TestimonialsData }
  | { id: string; type: "faq"; data: FAQData }
  | { id: string; type: "cta"; data: CTAData }
  | { id: string; type: "pricing"; data: PricingData }
  | { id: string; type: "text"; data: TextData }
  | { id: string; type: "image"; data: ImageData };

export type BuilderTheme = {
  accent:
    | "pink-orange"
    | "purple-fuchsia"
    | "amber-orange"
    | "gold-black"
    | "rose"
    | "blue-indigo"
    | "emerald";
  darkMode: boolean;
};

export type BuilderPage = {
  slug: string;
  blocks: Block[];
  theme: BuilderTheme;
  updatedAt: string;
};

export const DEFAULT_THEME: BuilderTheme = {
  accent: "pink-orange",
  darkMode: true,
};

export function emptyPage(slug: string): BuilderPage {
  return {
    slug,
    blocks: [],
    theme: DEFAULT_THEME,
    updatedAt: new Date().toISOString(),
  };
}

export function newBlockId(): string {
  return "blk-" + Math.random().toString(36).slice(2, 10);
}

export function defaultBlockData(type: BlockType): Block["data"] {
  switch (type) {
    case "hero":
      return {
        eyebrow: "",
        title: "Título principal da página",
        subtitle: "Subtítulo curto explicando a proposta.",
        ctaLabel: "Quero começar",
        ctaUrl: "#",
        backgroundImage: "",
        align: "center",
      } satisfies HeroData;
    case "testimonials":
      return {
        eyebrow: "Depoimentos",
        title: "O que dizem sobre nós",
        items: [
          { name: "Cliente 1", role: "Profissional", text: "Texto do depoimento aqui." },
          { name: "Cliente 2", role: "Profissional", text: "Outro depoimento autêntico." },
        ],
      } satisfies TestimonialsData;
    case "faq":
      return {
        eyebrow: "Dúvidas",
        title: "Perguntas frequentes",
        items: [
          { question: "Como funciona?", answer: "Resposta explicando o funcionamento." },
          { question: "Quanto custa?", answer: "Resposta sobre preço." },
        ],
      } satisfies FAQData;
    case "cta":
      return {
        title: "Pronto pra começar?",
        subtitle: "Garante seu acesso agora.",
        ctaLabel: "Quero entrar",
        ctaUrl: "#",
      } satisfies CTAData;
    case "pricing":
      return {
        eyebrow: "Investimento",
        title: "Escolha seu plano",
        plans: [
          {
            name: "Básico",
            price: "R$ 297",
            period: "à vista",
            features: ["Acesso ao curso", "Material em PDF", "Suporte por email"],
            ctaLabel: "Quero esse",
            ctaUrl: "#",
          },
          {
            name: "Premium",
            price: "R$ 497",
            period: "à vista",
            features: ["Tudo do básico", "Mentoria em grupo", "Certificado", "Comunidade exclusiva"],
            ctaLabel: "Quero esse",
            ctaUrl: "#",
            highlight: true,
          },
        ],
      } satisfies PricingData;
    case "text":
      return {
        content: "Escreva o texto aqui. Use ##, ###, **, _, [link](url) pra formatação.",
        align: "left",
      } satisfies TextData;
    case "image":
      return {
        src: "",
        alt: "",
        caption: "",
      } satisfies ImageData;
  }
}

export const BLOCK_LABELS: Record<BlockType, { label: string; emoji: string; description: string }> = {
  hero: { label: "Hero", emoji: "🎯", description: "Cabeçalho de destaque com título grande, fundo e CTA" },
  testimonials: { label: "Depoimentos", emoji: "💬", description: "Cards com fotos, nomes e citações de clientes" },
  faq: { label: "FAQ", emoji: "❓", description: "Perguntas e respostas em accordion" },
  cta: { label: "Chamada (CTA)", emoji: "🎯", description: "Bloco de conversão final com botão" },
  pricing: { label: "Preços", emoji: "💰", description: "Tabela de planos lado a lado" },
  text: { label: "Texto", emoji: "📝", description: "Parágrafo livre (suporta Markdown básico)" },
  image: { label: "Imagem", emoji: "🖼️", description: "Imagem solo com legenda opcional" },
};

export const ACCENT_GRADIENTS: Record<BuilderTheme["accent"], string> = {
  "pink-orange": "from-pink-500 to-orange-500",
  "purple-fuchsia": "from-purple-500 to-fuchsia-500",
  "amber-orange": "from-amber-500 to-orange-500",
  "gold-black": "from-amber-400 to-yellow-600",
  rose: "from-pink-400 to-rose-400",
  "blue-indigo": "from-blue-500 to-indigo-500",
  emerald: "from-emerald-500 to-teal-500",
};

export const ACCENT_LABELS: Record<BuilderTheme["accent"], string> = {
  "pink-orange": "Pink → Orange",
  "purple-fuchsia": "Purple → Fuchsia",
  "amber-orange": "Amber → Orange",
  "gold-black": "Gold → Yellow",
  rose: "Rose",
  "blue-indigo": "Blue → Indigo",
  emerald: "Emerald → Teal",
};
