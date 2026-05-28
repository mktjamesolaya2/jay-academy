import { NextResponse } from "next/server";
import { getPublishedBySlug, loadContent } from "@/lib/wp-content-storage";

type Params = Promise<{ slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const index = await getPublishedBySlug(decoded);
  if (!index) {
    return new NextResponse("Página não encontrada", { status: 404 });
  }

  const content = await loadContent(index.domain, index.slug);
  if (!content || !content.published) {
    return new NextResponse("Página não publicada", { status: 404 });
  }

  // Limpa qualquer artefato do editor antes de servir publicamente
  const cleaned = (content.fullHtml || content.content || "")
    .replace(/<script\s+data-editor-script="1">[\s\S]*?<\/script>/g, "")
    .replace(/<div\s+id="__editor_overlay__"[^>]*>[\s\S]*?<\/div>/g, "")
    .replace(/\sdata-editor-id="[^"]*"/g, "")
    .replace(/\scontenteditable="(?:true|false)"/g, "");

  const safeTitle = (content.title || "Página").replace(/<[^>]*>/g, "");

  let html: string;
  if (content.fullHtml) {
    html = /<base\s/i.test(cleaned)
      ? cleaned
      : cleaned.replace(
          /<head([^>]*)>/i,
          `<head$1>\n  <base href="${content.link}" />`
        );
  } else {
    html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <base href="${content.link}" />
</head>
<body>
${cleaned}
</body>
</html>`;
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
