import { notFound } from "next/navigation";
import { loadContent } from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";
import { EditorShell } from "@/components/editor-shell";
import { DesktopOnlyEditor } from "@/components/desktop-only-editor";

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
    <DesktopOnlyEditor backHref={`/wp-pages/${domain}/${encodeURIComponent(decodedSlug)}`}>
      <EditorShell
        source={{ kind: "wp", domain, slug: decodedSlug }}
        title={content.title}
        initialHtml={html}
      />
    </DesktopOnlyEditor>
  );
}
