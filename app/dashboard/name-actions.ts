"use server";

import { revalidatePath } from "next/cache";
import { updateMyName } from "@/lib/auth";

export async function updateMyNameAction(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const name = formData.get("name")?.toString() ?? "";
  const res = await updateMyName(name);
  if (!res.ok) return { error: res.error };
  // Revalida o próprio dashboard e qualquer rota que mostre o nome (sidebar, etc.)
  revalidatePath("/", "layout");
  return { success: true };
}
