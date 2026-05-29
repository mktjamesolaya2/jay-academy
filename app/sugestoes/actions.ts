"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import {
  addSuggestion,
  deleteSuggestion,
  setSuggestionStatus,
  toggleUpvote,
  type SuggestionStatus,
} from "@/lib/suggestions-store";

type FormState = { error?: string; success?: string } | undefined;

export async function createSuggestionAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const me = await getCurrentUser();
  if (!me) return { error: "Você precisa estar logado pra sugerir" };

  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";

  if (!title) return { error: "Título é obrigatório" };
  if (title.length > 120) return { error: "Título muito longo (máx 120 caracteres)" };
  if (description.length > 2000)
    return { error: "Descrição muito longa (máx 2000 caracteres)" };

  await addSuggestion({
    title,
    description,
    createdBy: me.name,
    createdById: me.id,
  });

  revalidatePath("/sugestoes");
  return { success: "Sugestão enviada — obrigado!" };
}

export async function toggleUpvoteAction(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return;
  const id = formData.get("id")?.toString() ?? "";
  if (!id) return;
  await toggleUpvote(id, me.id);
  revalidatePath("/sugestoes");
}

const VALID_STATUSES: SuggestionStatus[] = [
  "open",
  "planned",
  "in-progress",
  "done",
  "rejected",
];

export async function setStatusAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const statusRaw = formData.get("status")?.toString() ?? "";
  const adminNote = formData.get("adminNote")?.toString().trim() || undefined;
  if (!id || !VALID_STATUSES.includes(statusRaw as SuggestionStatus)) return;
  await setSuggestionStatus(id, statusRaw as SuggestionStatus, adminNote);
  revalidatePath("/sugestoes");
}

export async function deleteSuggestionAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  if (!id) return;
  await deleteSuggestion(id);
  revalidatePath("/sugestoes");
}
