"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  resetEmbeddedHtml,
  saveEmbeddedHtml,
} from "@/lib/embedded-html-store";

const ALLOWED_SLUGS = new Set(["magicshadow", "laser"]);

function cleanEditorArtifacts(html: string): string {
  return html
    .replace(/<script\s+data-editor-script="1">[\s\S]*?<\/script>/g, "")
    .replace(/<div\s+id="__editor_overlay__"[^>]*>[\s\S]*?<\/div>/g, "")
    .replace(/\sdata-editor-id="[^"]*"/g, "")
    .replace(/\scontenteditable="(?:true|false)"/g, "");
}

export async function saveEmbeddedHtmlAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const slug = formData.get("slug")?.toString() ?? "";
    const html = formData.get("html")?.toString() ?? "";
    if (!slug || !ALLOWED_SLUGS.has(slug)) {
      return { ok: false, error: "Slug inválido" };
    }
    if (!html) return { ok: false, error: "HTML vazio" };

    await saveEmbeddedHtml(slug, cleanEditorArtifacts(html));
    await logActivity("lp.update", slug, "edição visual");

    revalidatePath(`/${slug}`);
    revalidatePath(`/lps/${slug}`);
    revalidatePath(`/lps/${slug}/edit-visual`);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function resetEmbeddedHtmlAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug || !ALLOWED_SLUGS.has(slug)) return;
  await resetEmbeddedHtml(slug);
  await logActivity("lp.update", slug, "restauração do default");
  revalidatePath(`/${slug}`);
  revalidatePath(`/lps/${slug}/edit-visual`);
}
