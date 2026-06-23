"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createGroup,
  renameGroup,
  deleteGroup,
  toggleProjectGroup,
} from "@/lib/project-groups-store";

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function createGroupAction(
  formData: FormData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    await requireAdmin();
    const name = (formData.get("name")?.toString() || "").trim();
    const accent = formData.get("accent")?.toString() || undefined;
    if (!name) return { ok: false, error: "Dê um nome pra pasta" };
    const g = await createGroup(name, newId, accent);
    revalidatePath("/dashboard");
    return { ok: true, id: g.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

export async function renameGroupAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const name = formData.get("name")?.toString() ?? "";
  if (id && name.trim()) await renameGroup(id, name);
  revalidatePath("/dashboard");
}

export async function deleteGroupAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  if (id) await deleteGroup(id);
  revalidatePath("/dashboard");
}

/** Liga/desliga um projeto numa pasta. O projeto continua em "Todos os projetos". */
export async function toggleProjectGroupAction(
  projectKey: string,
  groupId: string
): Promise<{ ok: boolean }> {
  await requireAdmin();
  await toggleProjectGroup(projectKey, groupId);
  revalidatePath("/dashboard");
  return { ok: true };
}
