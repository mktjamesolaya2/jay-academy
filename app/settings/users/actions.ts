"use server";

import { revalidatePath } from "next/cache";
import {
  deleteUser,
  setUserRole,
  requireSenior,
  adminCreateUser,
} from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function createUserAction(
  prevState: { error?: string; ok?: boolean } | undefined,
  formData: FormData
) {
  await requireSenior();
  const name = formData.get("name")?.toString() ?? "";
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const roleRaw = formData.get("role")?.toString() ?? "viewer";
  const role = roleRaw === "admin" ? "admin" : "viewer";

  const res = await adminCreateUser(name, email, password, role);
  if (!res.ok) return { error: res.error };
  await logActivity("user.promote", `criou ${name} (${role})`);
  revalidatePath("/settings/users");
  return { ok: true };
}

export async function promoteUserAction(formData: FormData) {
  await requireSenior();
  const userId = formData.get("userId")?.toString() ?? "";
  const userName = formData.get("userName")?.toString() ?? "";
  if (!userId) return;
  const res = await setUserRole(userId, "admin");
  if (res.ok) await logActivity("user.promote", userName || userId);
  revalidatePath("/settings/users");
}

export async function demoteUserAction(formData: FormData) {
  await requireSenior();
  const userId = formData.get("userId")?.toString() ?? "";
  const userName = formData.get("userName")?.toString() ?? "";
  if (!userId) return;
  const res = await setUserRole(userId, "viewer");
  if (res.ok) await logActivity("user.demote", userName || userId);
  revalidatePath("/settings/users");
}

export async function deleteUserAction(formData: FormData) {
  await requireSenior();
  const userId = formData.get("userId")?.toString() ?? "";
  const userName = formData.get("userName")?.toString() ?? "";
  if (!userId) return;
  const res = await deleteUser(userId);
  if (res.ok) await logActivity("user.delete", userName || userId);
  revalidatePath("/settings/users");
}
