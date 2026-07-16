import type { MetadataRoute } from "next";
import { listPublished } from "@/lib/wp-content-storage";

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
  "metodo-shadow-pro-2",
  "inmersion-pelo-a-pelo",
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_LPS.map((slug) => ({
    url: `${BASE}/${slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  try {
    const published = await listPublished();
    const staticSet = new Set(STATIC_LPS);
    for (const p of published) {
      const slug = p.publicSlug || p.slug;
      if (!slug || staticSet.has(slug)) continue;
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
