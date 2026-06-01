"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  emptyPage,
  loadBuilderPage,
  saveBuilderPage,
  type BuilderPage,
} from "@/lib/page-builder-store";
import { getLpFromStore, updateLp } from "@/lib/lp-store";
import { saveEmbeddedHtml } from "@/lib/embedded-html-store";

function cleanEditorArtifacts(html: string): string {
  return html
    .replace(/<script\s+data-editor-script="1">[\s\S]*?<\/script>/g, "")
    .replace(/<div\s+id="__editor_overlay__"[^>]*>[\s\S]*?<\/div>/g, "")
    .replace(/\sdata-editor-id="[^"]*"/g, "")
    .replace(/\scontenteditable="(?:true|false)"/g, "");
}

export async function saveBuilderHtmlAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const slug = formData.get("slug")?.toString() ?? "";
    const html = formData.get("html")?.toString() ?? "";
    if (!slug) return { ok: false, error: "Slug obrigatório" };
    if (!html) return { ok: false, error: "HTML vazio" };

    const lp = await getLpFromStore(slug);
    if (!lp) return { ok: false, error: "LP não encontrada" };

    await saveEmbeddedHtml(slug, cleanEditorArtifacts(html));
    await updateLp(slug, { lastEditedAt: new Date().toISOString() });
    await logActivity("lp.update", lp.name, "edição visual");

    revalidatePath("/dashboard");
    revalidatePath(`/lps/${slug}`);
    revalidatePath(`/lps/${slug}/build`);
    revalidatePath(`/p/${slug}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao salvar",
    };
  }
}

export async function saveBuilderAction(
  slug: string,
  serialized: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const parsed = JSON.parse(serialized) as BuilderPage;
    if (parsed.slug !== slug) {
      return { ok: false, error: "Slug não confere" };
    }
    await saveBuilderPage(parsed);
    const lp = await getLpFromStore(slug);
    if (lp) {
      await updateLp(slug, { lastEditedAt: new Date().toISOString() });
    }
    await logActivity("lp.update", lp?.name || slug, "blocos atualizados");
    revalidatePath("/dashboard");
    revalidatePath(`/lps/${slug}`);
    revalidatePath(`/lps/${slug}/build`);
    revalidatePath(`/p/${slug}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro desconhecido",
    };
  }
}

export async function initBuilderAction(
  slug: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const existing = await loadBuilderPage(slug);
    if (existing) return { ok: true };
    await saveBuilderPage(emptyPage(slug));
    revalidatePath(`/lps/${slug}`);
    revalidatePath(`/lps/${slug}/build`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro desconhecido",
    };
  }
}
