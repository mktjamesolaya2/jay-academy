"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  addLp,
  getLpFromStore,
  loadLps,
  removeLp,
  saveLps,
  updateLp,
} from "@/lib/lp-store";
import type { LandingPage } from "@/lib/landing-pages";
import { emptyPage, saveBuilderPage } from "@/lib/page-builder-store";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ALLOWED_ACCENTS = [
  "pink-orange",
  "purple-fuchsia",
  "amber-orange",
  "gold-black",
  "rose",
] as const;

export async function createLpAction(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name")?.toString().trim() ?? "";
  const slugInput = formData.get("slug")?.toString().trim() ?? "";
  const tagline = formData.get("tagline")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const typeRaw = formData.get("type")?.toString().trim() ?? "lp";
  const accentRaw = formData.get("accent")?.toString().trim() ?? "rose";
  const useBuilder = formData.get("useBuilder")?.toString() === "1";

  if (!name) throw new Error("Nome obrigatório");
  const baseSlug = slugInput ? slugify(slugInput) : slugify(name);
  if (!baseSlug) throw new Error("Slug inválido");

  // Se o slug colide com LP existente, adiciona sufixo -2, -3, etc.
  // Em vez de jogar 500 na cara do user.
  const existing = await loadLps();
  let slug = baseSlug;
  let suffix = 2;
  while (existing.find((lp) => lp.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  const type = (["website", "lp", "form"].includes(typeRaw) ? typeRaw : "lp") as LandingPage["type"];
  const accent = ((ALLOWED_ACCENTS as readonly string[]).includes(accentRaw)
    ? accentRaw
    : "rose") as LandingPage["accent"];

  const now = new Date();
  await addLp({
    slug,
    name,
    tagline,
    description,
    stack: useBuilder ? "Blocos (page builder)" : "",
    status: "draft",
    type,
    localPath: "",
    accent,
    createdAt: now.toISOString().split("T")[0],
    lastEditedAt: now.toISOString(),
  });

  if (useBuilder) {
    await saveBuilderPage(emptyPage(slug));
  }

  await logActivity("lp.create", name);

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");

  if (useBuilder) {
    redirect(`/lps/${slug}/build`);
  }
  redirect(`/lps/${slug}?just-created=1`);
}

export async function duplicateLpAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) throw new Error("Slug obrigatório");

  const original = await getLpFromStore(slug);
  if (!original) throw new Error("LP original não encontrada");

  const all = await loadLps();
  let suffix = 1;
  let newSlug = `${slug}-copy-${suffix}`;
  while (all.find((lp) => lp.slug === newSlug)) {
    suffix++;
    newSlug = `${slug}-copy-${suffix}`;
  }

  await addLp({
    ...original,
    slug: newSlug,
    name: `${original.name} (Cópia)`,
    status: "draft",
    trashed: false,
    trashedAt: undefined,
    createdAt: new Date().toISOString().split("T")[0],
  });
  await logActivity("lp.duplicate", original.name);

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  redirect(`/lps/${newSlug}`);
}

export async function editLpMetadataAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) throw new Error("Slug obrigatório");

  const name = formData.get("name")?.toString().trim() ?? "";
  const tagline = formData.get("tagline")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const typeRaw = formData.get("type")?.toString().trim() ?? "lp";
  const accentRaw = formData.get("accent")?.toString().trim() ?? "rose";

  const type = (["website", "lp", "form"].includes(typeRaw) ? typeRaw : "lp") as LandingPage["type"];
  const accent = ((ALLOWED_ACCENTS as readonly string[]).includes(accentRaw)
    ? accentRaw
    : "rose") as LandingPage["accent"];

  await updateLp(slug, {
    name,
    tagline,
    description,
    type,
    accent,
    lastEditedAt: new Date().toISOString(),
  });
  await logActivity("lp.update", name || slug);

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath(`/lps/${slug}`);
}

export async function moveToTrashAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) return;
  const lp = await getLpFromStore(slug);
  await updateLp(slug, { trashed: true, trashedAt: new Date().toISOString() });
  await logActivity("lp.delete", lp?.name || slug, "movida para a lixeira");
  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath("/lixeira");
  redirect("/lps");
}

export async function restoreFromTrashAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) return;
  const lp = await getLpFromStore(slug);
  await updateLp(slug, { trashed: false, trashedAt: undefined });
  await logActivity("lp.restore", lp?.name || slug);
  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath("/lixeira");
}

export async function permanentDeleteAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) return;
  const lp = await getLpFromStore(slug);
  await removeLp(slug);
  await logActivity("lp.delete", lp?.name || slug, "excluída permanentemente");
  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath("/lixeira");
}

export async function setLpStatusAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  const status = formData.get("status")?.toString() ?? "";
  const validStatuses = ["draft", "published", "archived", "deploying", "error"];
  if (!slug || !validStatuses.includes(status)) return;
  const lp = await getLpFromStore(slug);
  await updateLp(slug, {
    status: status as LandingPage["status"],
    lastEditedAt: new Date().toISOString(),
  });
  if (lp) {
    if (status === "published") {
      await logActivity("lp.update", lp.name, "publicada");
    } else if (status === "draft") {
      await logActivity("lp.update", lp.name, "despublicada");
    }
  }
  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath(`/lps/${slug}`);
  revalidatePath(`/p/${slug}`);
}
