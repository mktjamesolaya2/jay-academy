"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteAllContent,
  deleteContent,
  markPlaced,
  type PlacementType,
} from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";

const VALID_TYPES = new Set<PlacementType>(["website", "lp", "form"]);

export async function placeWpPageAction(formData: FormData) {
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  const typeRaw = formData.get("type")?.toString() ?? "";
  if (!domain || !slug) return;

  const type = VALID_TYPES.has(typeRaw as PlacementType)
    ? (typeRaw as PlacementType)
    : null;

  await markPlaced(domain, slug, type);

  revalidatePath("/dashboard");
  revalidatePath(`/wp-pages/${domain}/${slug}`);
}

export async function placeAndReturnAction(formData: FormData) {
  await placeWpPageAction(formData);
  redirect("/dashboard");
}

export async function deleteWpPageAction(formData: FormData) {
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  if (!domain || !slug) return;
  await deleteContent(domain, slug);
  revalidatePath("/dashboard");
  revalidatePath("/wordpress");
  redirect("/dashboard");
}

export async function deleteAllWpPagesAction() {
  await deleteAllContent();
  revalidatePath("/dashboard");
  revalidatePath("/wordpress");
}
