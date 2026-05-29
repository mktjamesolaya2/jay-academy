"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { loadContent, saveContent } from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";

function validateUrl(url: string): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function setWpPageBehaviorAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin();
    const domain = formData.get("domain")?.toString() as WpDomain;
    const slug = formData.get("slug")?.toString() ?? "";
    const webhookUrl = formData.get("webhookUrl")?.toString().trim() ?? "";
    const redirectUrl = formData.get("redirectUrl")?.toString().trim() ?? "";

    if (!domain || !slug) return { error: "Dados ausentes" };
    if (webhookUrl && !validateUrl(webhookUrl)) {
      return { error: "URL do webhook inválida" };
    }
    if (redirectUrl && !validateUrl(redirectUrl)) {
      return { error: "URL de redirect inválida" };
    }

    const content = await loadContent(domain, slug);
    if (!content) return { error: "Página não encontrada" };

    content.formWebhookUrl = webhookUrl || undefined;
    content.formRedirectUrl = redirectUrl || undefined;
    await saveContent(content);
    await logActivity("wp.edit", content.title || slug, "comportamento de form");

    revalidatePath(`/wp-pages/${domain}/${slug}`);
    if (content.publicSlug) revalidatePath(`/p/${content.publicSlug}`);

    return { success: "Salvo" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}
