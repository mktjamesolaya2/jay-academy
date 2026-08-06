import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Páginas das formações presenciais do Jay Academy — uma por formação,
 * servidas de lp-html/formacoes/<slug>.html.
 *
 * Rota dinâmica (e não um route.ts por formação como as LPs de venda) porque
 * são muitas e todas iguais em estrutura: são 5 hoje e a apresentação lista
 * mais de dez. Cada uma continua sendo um HTML editável no repo — edito o
 * arquivo e dou push, igual às outras.
 *
 * ⚠️ Ficam em lp-html/formacoes/ (subpasta) de propósito: o teste
 * lib/page-catalog.test.ts exige que todo .html na RAIZ de lp-html/ esteja no
 * registro das LPs, e estas não são LPs de venda — são páginas-filhas de
 * /academy.
 */

export const dynamic = "force-static";

/** Só o que existe é servível — evita ler caminho arbitrário vindo da URL. */
const FORMACOES = new Set([
  "jay-vogue-brows",
  "jay-beauty",
  "jay-brows",
  "jay-pixel",
  "jay-nano",
]);

export async function generateStaticParams() {
  return [...FORMACOES].map((slug) => ({ slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!FORMACOES.has(slug)) {
    return new NextResponse("Formação não encontrada", { status: 404 });
  }

  const html = await readFile(
    path.join(process.cwd(), "lp-html", "formacoes", `${slug}.html`),
    "utf8",
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
