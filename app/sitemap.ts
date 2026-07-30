import type { MetadataRoute } from "next";
import { listPublished } from "@/lib/wp-content-storage";
import { lpHtmlRedirects } from "@/lib/lp-html-registry";

// Sitemap dinâmico: LPs estáticas (rotas dedicadas) + páginas WP publicadas no KV.
// Substitui o page-sitemap.xml do Yoast quando o domínio apontar pra cá.
const BASE = "https://jayacademy.com.br";

const STATIC_LPS = [
  "basic-magic-shadow",
  "basic-nanofios",
  "fio-a-fio-realista-by-james-olaya",
  "pdv-lips-sense-technique",
  "curso-online-profissao-remove",
  "pmuclass",
  "metodo-shadow-pro",
  "inmersion-pelo-a-pelo",
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_LPS.map((slug) => ({
    url: `${BASE}/${slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  // Slugs antigos que hoje só respondem 308: continuam no KV como página
  // publicada, mas anunciá-los no sitemap manda o Google rastrear uma URL que
  // redireciona. A rota estática do redirect tem prioridade, então essa página
  // do KV nem chega a ser servida.
  const redirectSet = new Set(lpHtmlRedirects.map((r) => r.from));

  try {
    const published = await listPublished();
    const staticSet = new Set(STATIC_LPS);
    for (const p of published) {
      const slug = p.publicSlug || p.slug;
      if (!slug || staticSet.has(slug) || redirectSet.has(slug)) continue;
      entries.push({
        url: `${BASE}/${slug}`,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch {
    // KV indisponível: serve só as estáticas
  }
  return entries;
}
