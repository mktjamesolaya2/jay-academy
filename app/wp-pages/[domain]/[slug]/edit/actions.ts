"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
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
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  const html = formData.get("html")?.toString() ?? "";
  if (!domain || !slug) {
    return { ok: false as const, error: "domain/slug ausentes" };
  }

  // Proteção: HTML vazio/truncado não pode sobrescrever a página (apagaria tudo).
  if (html.trim().length < 200) {
    return {
      ok: false as const,
      error: "Conteúdo vazio ou muito pequeno — não salvei (proteção contra apagar a página).",
    };
  }

  const content = await loadContent(domain, slug);
  if (!content) {
    return { ok: false as const, error: "Página não encontrada" };
  }

  try {
    content.fullHtml = cleanEditorArtifacts(html);
    content.fetchedAt = new Date().toISOString();
    await saveContent(content);
  } catch (e) {
    // Sem "salvo" fantasma: se a gravação falhar, o usuário fica sabendo.
    return {
      ok: false as const,
      error: "Falha ao salvar: " + (e instanceof Error ? e.message : "erro no banco"),
    };
  }
  await logActivity("wp.edit", content.title || slug);

  // NÃO revalida a rota /edit — isso causa re-render do iframe e perde estado
  revalidatePath(`/wp-pages/${domain}/${slug}`);
  revalidatePath(`/wp-pages/${domain}/${slug}/preview`);
  revalidatePath("/dashboard");

  return { ok: true as const };
}
