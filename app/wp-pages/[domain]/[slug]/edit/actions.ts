"use server";

import { revalidatePath } from "next/cache";
import { loadContent, saveContent } from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";

function cleanEditorArtifacts(html: string): string {
  return html
    .replace(/<script\s+data-editor-script="1">[\s\S]*?<\/script>/g, "")
    .replace(/<div\s+id="__editor_overlay__"[^>]*>[\s\S]*?<\/div>/g, "")
    .replace(/\sdata-editor-id="[^"]*"/g, "")
    .replace(/\scontenteditable="(?:true|false)"/g, "");
}

export async function saveEditedContentAction(formData: FormData) {
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  const html = formData.get("html")?.toString() ?? "";
  if (!domain || !slug) {
    return { ok: false as const, error: "domain/slug ausentes" };
  }

  const content = await loadContent(domain, slug);
  if (!content) {
    return { ok: false as const, error: "Página não encontrada" };
  }

  content.fullHtml = cleanEditorArtifacts(html);
  content.fetchedAt = new Date().toISOString();
  await saveContent(content);

  // NÃO revalida a rota /edit — isso causa re-render do iframe e perde estado
  revalidatePath(`/wp-pages/${domain}/${slug}`);
  revalidatePath(`/wp-pages/${domain}/${slug}/preview`);
  revalidatePath("/dashboard");

  return { ok: true as const };
}
