import { notFound, redirect } from "next/navigation";
import { EditorShell } from "@/components/editor-shell";
import { DesktopOnlyEditor } from "@/components/desktop-only-editor";
import { canEdit, getCurrentUser } from "@/lib/auth";
import {
  resolveEmbeddedHtml,
  resolveLpHtml,
  ehExportElementor,
} from "@/lib/embedded-html-store";
import { getLpHtmlEntry } from "@/lib/lp-html-registry";
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
  const entrada = getLpHtmlEntry(slug);

  // Três origens possíveis, um editor só:
  //   embed  → public/<pasta>/index.html (LPs SPA)
  //   lp-html→ arquivo do repositório, com override no KV
  // Sem nenhuma das duas, não há o que editar.
  if (!embedSlug && !entrada) redirect(`/lps/${slug}`);

  const [lp, html] = await Promise.all([
    getLpFromStore(slug),
    embedSlug
      ? resolveEmbeddedHtml(embedSlug)
      : resolveLpHtml(slug, entrada!.htmlFile.split("/").pop()!),
  ]);

  if (!html) notFound();

  // ⚠️ Export do Elementor não entra no editor visual: 60-80 scripts montam
  // carrossel, popup e o próprio formulário DEPOIS do carregamento, e o editor
  // salvaria o estado já mexido pelo JS. Recarregar isso duplica elemento e
  // mata o formulário — numa página de venda, é perder lead.
  if (ehExportElementor(html)) redirect(`/lps/${slug}?editor=elementor`);

  // Sanitiza pro editor: tira todos os <script> da página original.
  // Sem isso, apps React/TanStack rodam dentro do iframe do editor,
  // tomam conta da URL e mostram 404; teclas como Ctrl+Z viram conflito
  // com o roteador. Resultado: o editor passa a tratar a LP como HTML
  // estático puro e o conteúdo salvo já entra no KV sem scripts.
  const sanitized = stripScripts(html);

  return (
    <DesktopOnlyEditor backHref={`/lps/${slug}`}>
      <EditorShell
        // O slug do KV é o da PÁGINA quando ela vem de lp-html/ — é ele que o
        // serve-lp procura como override. Pras SPA embutidas segue a pasta.
        source={{ kind: "embed", slug: embedSlug ?? slug }}
        title={lp?.name ?? entrada?.title ?? slug}
        initialHtml={sanitized}
      />
    </DesktopOnlyEditor>
  );
}

function stripScripts(html: string): string {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}
