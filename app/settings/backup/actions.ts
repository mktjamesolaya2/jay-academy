"use server";

import { revalidatePath } from "next/cache";
import { requireSenior } from "@/lib/auth";
import {
  createBackup,
  restoreBackup,
  deleteBackup,
  getBackup,
} from "@/lib/backup-store";
import { logActivity } from "@/lib/activity-log";

export async function createBackupAction(formData: FormData) {
  await requireSenior();
  const label = formData.get("label")?.toString().trim() || undefined;
  const meta = await createBackup(label);
  await logActivity("wp.edit", label || "Backup", `backup criado (${meta.keyCount} itens)`);
  revalidatePath("/settings/backup");
}

export async function restoreBackupAction(formData: FormData) {
  await requireSenior();
  const id = formData.get("id")?.toString() ?? "";
  if (!id) return;
  const r = await restoreBackup(id);
  await logActivity("wp.edit", "Backup", `restaurado (${r?.restored ?? 0} itens)`);
  // Revalida tudo que pode ter mudado
  revalidatePath("/", "layout");
}

export async function deleteBackupAction(formData: FormData) {
  await requireSenior();
  const id = formData.get("id")?.toString() ?? "";
  if (id) await deleteBackup(id);
  revalidatePath("/settings/backup");
}

/** Exporta o backup como string JSON (pro download no client). */
export async function exportBackupAction(id: string): Promise<string> {
  await requireSenior();
  const b = await getBackup(id);
  return JSON.stringify(b ?? {}, null, 2);
}
