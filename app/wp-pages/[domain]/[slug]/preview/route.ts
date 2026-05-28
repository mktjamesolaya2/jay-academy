import { NextResponse } from "next/server";
import { loadContent } from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";

type Params = Promise<{ domain: string; slug: string }>;

export async function GET(
  _req: Request,
  { params }: { params: Params }
) {
  const { domain, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const content = await loadContent(domain as WpDomain, decodedSlug);
  if (!content) {
    return new NextResponse("Página não encontrada", { status: 404 });
  }

  const safeTitle = content.title.replace(/<[^>]*>/g, "");

  let html: string;
  if (content.fullHtml) {
    // HTML público completo já tem head/CSS/scripts. Só inserir <base> se faltar.
    if (/<base\s/i.test(content.fullHtml)) {
      html = content.fullHtml;
    } else {
      html = content.fullHtml.replace(
        /<head([^>]*)>/i,
        `<head$1>\n  <base href="${content.link}" />`
      );
    }
  } else {
    // fallback — só o conteúdo do editor, sem estilos do tema
    html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} — preview</title>
  <base href="${content.link}" />
</head>
<body>
${content.content}
</body>
</html>`;
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
