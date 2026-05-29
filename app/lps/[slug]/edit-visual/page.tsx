import { notFound, redirect } from "next/navigation";
import { EditorShell } from "@/components/editor-shell";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { resolveEmbeddedHtml } from "@/lib/embedded-html-store";
import { getLpFromStore } from "@/lib/lp-store";

type Params = Promise<{ slug: string }>;

const SLUG_TO_EMBED: Record<string, string> = {
  "magic-shadow": "magicshadow",
  laser: "laser",
};

export default async function EditVisualPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const me = await getCurrentUser();
  if (!me) redirect(`/login?redirect=/lps/${slug}/edit-visual`);
  if (!canEdit(me)) redirect(`/lps/${slug}`);

  const embedSlug = SLUG_TO_EMBED[slug];
  if (!embedSlug) {
    // PMU CLASS, LPs sem editor visual, etc.
    redirect(`/lps/${slug}`);
  }

  const [lp, html] = await Promise.all([
    getLpFromStore(slug),
    resolveEmbeddedHtml(embedSlug),
  ]);

  if (!lp || !html) notFound();

  // Sanitiza pro editor: tira todos os <script> da página original.
  // Sem isso, apps React/TanStack rodam dentro do iframe do editor,
  // tomam conta da URL e mostram 404; teclas como Ctrl+Z viram conflito
  // com o roteador. Resultado: o editor passa a tratar a LP como HTML
  // estático puro e o conteúdo salvo já entra no KV sem scripts.
  const sanitized = stripScripts(html);

  return (
    <EditorShell
      source={{ kind: "embed", slug: embedSlug }}
      title={lp.name}
      initialHtml={sanitized}
    />
  );
}

function stripScripts(html: string): string {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}
