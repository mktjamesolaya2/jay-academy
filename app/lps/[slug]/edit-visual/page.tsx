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

  return (
    <EditorShell
      source={{ kind: "embed", slug: embedSlug }}
      title={lp.name}
      initialHtml={html}
    />
  );
}
