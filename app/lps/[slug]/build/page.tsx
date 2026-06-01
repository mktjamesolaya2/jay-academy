import { notFound, redirect } from "next/navigation";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { getLpFromStore } from "@/lib/lp-store";
import {
  emptyPage,
  loadBuilderPage,
  saveBuilderPage,
} from "@/lib/page-builder-store";
import {
  loadEditedEmbeddedHtml,
  saveEmbeddedHtml,
} from "@/lib/embedded-html-store";
import { renderBuilderPageHtml } from "@/lib/builder-html-render";
import { EditorShell } from "@/components/editor-shell";

type Params = Promise<{ slug: string }>;

export const dynamic = "force-dynamic";

function buildInitialHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title.replace(/[<>&]/g, "")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    details > summary::-webkit-details-marker { display: none; }
  </style>
</head>
<body>
${body}
<script async src="https://cdn.tailwindcss.com"></script>
</body>
</html>`;
}

/**
 * Preserva o Tailwind CDN (precisa estilizar dentro do iframe) e remove
 * qualquer outro script. Builder pages não têm scripts além do CDN.
 */
function stripScriptsExceptTailwind(html: string): string {
  return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs) => {
    if (/cdn\.tailwindcss\.com/.test(attrs)) return match;
    return "";
  });
}

/**
 * Move o Tailwind CDN pra fim do body com async. Necessário porque
 * quando ele tá síncrono no <head>, o parser bloqueia a execução do script
 * do editor (que fica no fim do body), e o postMessage `editor:ready` nunca
 * dispara em tempo razoável.
 */
function normalizeTailwindPosition(html: string): string {
  let out = html;
  // Remove qualquer ocorrência do Tailwind CDN
  out = out.replace(
    /<script\b[^>]*cdn\.tailwindcss\.com[^>]*>[\s\S]*?<\/script>/gi,
    ""
  );
  // Reinsere antes de </body> com async
  const tag = `<script async src="https://cdn.tailwindcss.com"></script>`;
  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${tag}\n</body>`);
  } else {
    out = out + tag;
  }
  return out;
}

export default async function BuildPage({ params }: { params: Params }) {
  const { slug } = await params;
  const me = await getCurrentUser();
  if (!me) redirect(`/login?redirect=/lps/${slug}/build`);
  if (!canEdit(me)) redirect(`/lps/${slug}`);

  const lp = await getLpFromStore(slug);
  if (!lp) notFound();

  // Estado em ordem de prioridade:
  // 1. HTML embedded já salvo (edição em andamento ou prévia) → continua dali
  // 2. Builder page com blocos → renderiza HTML inicial dos blocos e salva embedded
  // 3. Nada → cria builder page vazia + HTML vazio
  let html = await loadEditedEmbeddedHtml(slug);

  if (!html) {
    let page = await loadBuilderPage(slug);
    if (!page) {
      page = emptyPage(slug);
      await saveBuilderPage(page);
    }
    const body = renderBuilderPageHtml(page);
    html = buildInitialHtml(body, lp.name);
    await saveEmbeddedHtml(slug, html);
  }

  // Garante que o Tailwind CDN está como async no fim do body. Remove
  // outros scripts.
  const sanitized = normalizeTailwindPosition(stripScriptsExceptTailwind(html));

  return (
    <EditorShell
      source={{ kind: "builder", slug }}
      title={lp.name}
      initialHtml={sanitized}
    />
  );
}
