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
import { getLpFromStore } from "@/lib/lp-store";

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
    await logActivity("lp.update", lp?.name || slug, "blocos atualizados");
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
