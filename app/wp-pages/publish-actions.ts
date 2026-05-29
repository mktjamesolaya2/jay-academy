"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  loadContent,
  setPublished,
  unsetPublished,
} from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function publishPageAction(
  prevState: { error?: string; success?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    await requireAdmin();
    const domain = formData.get("domain")?.toString() as WpDomain;
    const slug = formData.get("slug")?.toString() ?? "";
    const customSlug = formData.get("publicSlug")?.toString().trim() ?? "";

    if (!domain || !slug) return { error: "Faltam dados" };

    const content = await loadContent(domain, slug);
    if (!content) return { error: "Página não encontrada" };

    const publicSlug = customSlug ? slugify(customSlug) : slug;
    if (!publicSlug) return { error: "Slug inválido" };

    await setPublished(content, publicSlug);
    await logActivity("wp.publish", content.title || slug, `/p/${publicSlug}`);

    revalidatePath(`/wp-pages/${domain}/${slug}`);
    revalidatePath(`/p/${publicSlug}`);
    revalidatePath("/dashboard");

    return { success: `Publicada em /p/${publicSlug}` };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Erro ao publicar",
    };
  }
}

export async function unpublishPageAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  if (!domain || !slug) return;

  const content = await loadContent(domain, slug);
  if (!content) return;

  const oldPublicSlug = content.publicSlug;
  await unsetPublished(content);
  await logActivity("wp.unpublish", content.title || slug);

  revalidatePath(`/wp-pages/${domain}/${slug}`);
  if (oldPublicSlug) revalidatePath(`/p/${oldPublicSlug}`);
  revalidatePath("/dashboard");
}
