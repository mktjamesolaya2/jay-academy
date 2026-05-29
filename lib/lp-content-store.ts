import "server-only";
import { kvGet, kvSet } from "./storage";

/**
 * Conteúdo editável de cada LP nativa.
 * Cada LP tem seu próprio schema. Armazenamos como JSON livre no KV e a
 * tipagem fica no consumer (no React app da LP).
 */

export type PmuClassContent = {
  whatsappLink: string;
  heroSlides: PmuHeroSlide[];
};

export type PmuHeroSlide = {
  badge: string;
  title: string;
  description: string;
  metaLeft: string;
  metaRight: string;
  slug: string;
  hotmartUrl: string;
};

export const PMU_CLASS_DEFAULT: PmuClassContent = {
  whatsappLink: "https://wa.me/5519998930861",
  heroSlides: [
    {
      badge: "CURSO EM DESTAQUE",
      title: "Fio a Fio Realista",
      description:
        "Construa fios que parecem sempre ter estado lá. Ciência, tecnologia e arte aplicadas ao realismo do dermógrafo.",
      metaLeft: "13 módulos",
      metaRight: "Prática em modelo",
      slug: "fio-a-fio-realista",
      hotmartUrl:
        "https://pay.hotmart.com/T98532267X?off=tlrmqecy&checkoutMode=10",
    },
    {
      badge: "LANÇAMENTO",
      title: "Basic Magic Shadow",
      description:
        "Efeito sombreado natural e duradouro. As 6 etapas + 5 passos do método autoral de James Olaya pra sobrancelhas com aparência de maquiagem fixa.",
      metaLeft: "13 módulos",
      metaRight: "Prática em modelo",
      slug: "basic-magic-shadow",
      hotmartUrl:
        "https://pay.hotmart.com/E98531587I?off=k2warcrt&checkoutMode=10",
    },
    {
      badge: "EM ALTA",
      title: "Lips Sense Technique",
      description:
        "Lábios bem definidos e simétricos. Da escolha da cor à cicatrização — o passo a passo completo da técnica labial autoral.",
      metaLeft: "13 módulos",
      metaRight: "Prática em modelo",
      slug: "lips-sense",
      hotmartUrl: "https://pay.hotmart.com/Y98532335W",
    },
  ],
};

function lpKey(slug: string): string {
  return `lp-content:${slug}`;
}

export async function loadLpContent<T>(
  slug: string,
  fallback: T
): Promise<T> {
  const stored = await kvGet<T>(lpKey(slug));
  return stored ?? fallback;
}

export async function saveLpContent<T>(slug: string, content: T): Promise<void> {
  await kvSet(lpKey(slug), content);
}

export async function loadPmuClassContent(): Promise<PmuClassContent> {
  return await loadLpContent<PmuClassContent>("pmuclass", PMU_CLASS_DEFAULT);
}
