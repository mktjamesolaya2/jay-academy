"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  loadPmuClassContent,
  PMU_CLASS_DEFAULT,
  saveLpContent,
  type PmuClassContent,
  type PmuHeroSlide,
} from "@/lib/lp-content-store";

type ActionResult = { error?: string; success?: string };

function parseSlide(formData: FormData, idx: number): PmuHeroSlide {
  const fallback = PMU_CLASS_DEFAULT.heroSlides[idx];
  return {
    badge: (formData.get(`slide_${idx}_badge`)?.toString() ?? fallback.badge).trim(),
    title: (formData.get(`slide_${idx}_title`)?.toString() ?? fallback.title).trim(),
    description: (formData.get(`slide_${idx}_description`)?.toString() ?? fallback.description).trim(),
    metaLeft: (formData.get(`slide_${idx}_metaLeft`)?.toString() ?? fallback.metaLeft).trim(),
    metaRight: (formData.get(`slide_${idx}_metaRight`)?.toString() ?? fallback.metaRight).trim(),
    slug: (formData.get(`slide_${idx}_slug`)?.toString() ?? fallback.slug).trim(),
    hotmartUrl: (formData.get(`slide_${idx}_hotmartUrl`)?.toString() ?? fallback.hotmartUrl).trim(),
  };
}

export async function savePmuClassContentAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const whatsappLink = (formData.get("whatsappLink")?.toString() ?? "").trim();
    if (!whatsappLink) return { error: "Link do WhatsApp é obrigatório" };

    const content: PmuClassContent = {
      whatsappLink,
      heroSlides: [parseSlide(formData, 0), parseSlide(formData, 1), parseSlide(formData, 2)],
    };

    await saveLpContent("pmuclass", content);
    await logActivity("lp.update", "PMU CLASS", "conteúdo dinâmico");

    revalidatePath("/lps/pmuclass");
    revalidatePath("/lps/pmuclass/edit-content");

    return { success: "Salvo — as mudanças aparecem em /pmuclass após F5 (cache de 15s)" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function resetPmuClassContentAction(): Promise<void> {
  await requireAdmin();
  await saveLpContent("pmuclass", await loadPmuClassContent().then(() => PMU_CLASS_DEFAULT));
  await logActivity("lp.update", "PMU CLASS", "conteúdo resetado pro default");
  revalidatePath("/lps/pmuclass/edit-content");
}
