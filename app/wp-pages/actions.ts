"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteAllContent,
  deleteContent,
  loadContent,
  markPlaced,
  restoreContent,
  trashContent,
  type PlacementType,
} from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

const VALID_TYPES = new Set<PlacementType>(["website", "lp", "form"]);

const PLACEMENT_LABEL: Record<PlacementType, string> = {
  website: "Website",
  lp: "Landing page",
  form: "Formulário",
};

export async function placeWpPageAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  const typeRaw = formData.get("type")?.toString() ?? "";
  if (!domain || !slug) return;

  const type = VALID_TYPES.has(typeRaw as PlacementType)
    ? (typeRaw as PlacementType)
    : null;

  await markPlaced(domain, slug, type);

  const content = await loadContent(domain, slug);
  const target = content?.title || slug;
  if (type === null) {
    await logActivity("wp.categorize", target, "removeu da categoria");
  } else {
    await logActivity("wp.categorize", target, PLACEMENT_LABEL[type]);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/wp-pages/${domain}/${slug}`);
}

export async function placeAndReturnAction(formData: FormData) {
  await placeWpPageAction(formData);
  redirect("/dashboard");
}

/** Soft delete — move pra lixeira. */
export async function deleteWpPageAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  if (!domain || !slug) return;
  const content = await loadContent(domain, slug);
  const target = content?.title || slug;
  await trashContent(domain, slug);
  await logActivity("wp.delete", target, "movida pra lixeira");
  revalidatePath("/dashboard");
  revalidatePath("/wordpress");
  revalidatePath("/lixeira");
  revalidatePath(`/p/${content?.publicSlug || slug}`);
  redirect("/dashboard");
}

export async function restoreWpPageAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  if (!domain || !slug) return;
  const content = await loadContent(domain, slug);
  await restoreContent(domain, slug);
  await logActivity("wp.delete", content?.title || slug, "restaurada da lixeira");
  revalidatePath("/dashboard");
  revalidatePath("/wordpress");
  revalidatePath("/lixeira");
}

export async function permanentDeleteWpPageAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  if (!domain || !slug) return;
  const content = await loadContent(domain, slug);
  await deleteContent(domain, slug);
  await logActivity("wp.delete", content?.title || slug, "excluída permanentemente");
  revalidatePath("/dashboard");
  revalidatePath("/wordpress");
  revalidatePath("/lixeira");
}

export async function deleteAllWpPagesAction() {
  await requireAdmin();
  await deleteAllContent();
  await logActivity("wp.delete", "todas as páginas WP");
  revalidatePath("/dashboard");
  revalidatePath("/wordpress");
}
