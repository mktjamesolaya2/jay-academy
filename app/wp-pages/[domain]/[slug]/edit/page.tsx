import { notFound } from "next/navigation";
import { loadContent } from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";
import { EditorShell } from "@/components/editor-shell";

type Params = Promise<{ domain: string; slug: string }>;

export default async function EditPage({ params }: { params: Params }) {
  const { domain, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const content = await loadContent(domain as WpDomain, decodedSlug);
  if (!content) notFound();

  const html =
    content.fullHtml ||
    `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <base href="${content.link}" />
  <title>${content.title}</title>
</head>
<body>
${content.content}
</body>
</html>`;

  return (
    <EditorShell
      domain={domain}
      slug={decodedSlug}
      title={content.title}
      initialHtml={html}
    />
  );
}
