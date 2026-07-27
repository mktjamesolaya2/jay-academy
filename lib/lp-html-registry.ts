// Registro das LPs servidas de lp-html/*.html por route handlers dedicados
// (app/<slug>/route.ts). Essas páginas são editadas por commit no repo — não
// têm CRUD no painel — então este arquivo versionado é a fonte de verdade
// pra elas aparecerem no catálogo (/paginas) e no dashboard.
//
// IMPORTANTE: ao criar/remover um app/<slug>/route.ts que lê lp-html/,
// atualize este registro. O teste lib/page-catalog.test.ts confere a
// sincronização registro × arquivos reais e falha se divergir.

import type { LandingPage } from "./landing-pages";
import type { PageCategory } from "./page-catalog-core";

export type LpHtmlEntry = {
  slug: string;
  title: string;
  /** Arquivo HTML no repo, relativo à raiz (ex: "lp-html/basic-nanofios.html") */
  htmlFile: string;
  /** Diretório de assets em public/ (nomes nem sempre batem 1:1 com o slug) */
  assetsDir?: string;
  category: PageCategory;
  accent?: LandingPage["accent"];
};

export const lpHtmlPages: LpHtmlEntry[] = [
  {
    slug: "basic-magic-shadow",
    title: "Basic Magic Shadow",
    htmlFile: "lp-html/basic-magic-shadow.html",
    assetsDir: "public/lp/basic-magic-shadow",
    category: "venda",
    accent: "gold-black",
  },
  {
    // Cópia fiel da v1 reconstruída em vanilla; roda em paralelo até virar a oficial.
    slug: "basic-magic-shadow-v2",
    title: "Basic Magic Shadow (v2)",
    htmlFile: "lp-html/basic-magic-shadow-v2.html",
    assetsDir: "public/lp/basic-magic-shadow-v2",
    category: "venda",
    accent: "gold-black",
  },
  {
    slug: "basic-nanofios",
    title: "Basic Nano Fios",
    htmlFile: "lp-html/basic-nanofios.html",
    assetsDir: "public/lp/basic-nanofios",
    category: "venda",
    accent: "purple-fuchsia",
  },
  {
    slug: "curso-online-profissao-remove",
    title: "Curso Online Profissão Remove",
    htmlFile: "lp-html/curso-online-profissao-remove.html",
    assetsDir: "public/lp/profissao-remove",
    category: "venda",
    accent: "amber-orange",
  },
  {
    slug: "fio-a-fio-realista-by-james-olaya",
    title: "Fio a Fio Realista by James Olaya",
    htmlFile: "lp-html/fio-a-fio-realista-by-james-olaya.html",
    assetsDir: "public/lp/fio-a-fio-realista",
    category: "venda",
    accent: "purple-fuchsia",
  },
  {
    // Site institucional recriado no sistema dark cinematográfico (21/07).
    slug: "jamesolaya",
    title: "James Olaya (institucional)",
    htmlFile: "lp-html/jamesolaya.html",
    assetsDir: "public/lp/jamesolaya",
    category: "website",
    accent: "gold-black",
  },
  {
    slug: "inmersion-pelo-a-pelo",
    title: "Inmersión Pelo a Pelo",
    htmlFile: "lp-html/inmersion-pelo-a-pelo.html",
    // Padrão antigo de LP recriada; o HTML referencia assets deste diretório,
    // então ele NÃO é legado morto — não remover.
    assetsDir: "public/recriadas/inmersion-pelo-a-pelo",
    category: "venda",
    accent: "pink-orange",
  },
  {
    slug: "metodo-shadow-pro-2",
    title: "Método Shadow PRO",
    htmlFile: "lp-html/metodo-shadow-pro-2.html",
    assetsDir: "public/lp/shadow-pro",
    category: "venda",
    accent: "gold-black",
  },
  {
    slug: "pdv-lips-sense-technique",
    title: "Lips Sense Technique",
    htmlFile: "lp-html/pdv-lips-sense-technique.html",
    assetsDir: "public/lp/lips-sense",
    category: "venda",
    accent: "rose",
  },
  {
    slug: "pmuclass",
    title: "PMU CLASS",
    htmlFile: "lp-html/pmuclass.html",
    assetsDir: "public/pmuclass",
    category: "website",
    accent: "pink-orange",
  },
];

/** Redirects 308 servidos por route handlers dedicados (slugs antigos). */
export const lpHtmlRedirects: { from: string; to: string }[] = [
  { from: "fio-a-fio-realista", to: "fio-a-fio-realista-by-james-olaya" },
  {
    from: "metodo-fio-a-fio-by-james-olaya",
    to: "fio-a-fio-realista-by-james-olaya",
  },
];

export function getLpHtmlEntry(slug: string): LpHtmlEntry | undefined {
  return lpHtmlPages.find((p) => p.slug === slug);
}
