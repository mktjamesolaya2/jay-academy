"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";

export async function loginAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const rawRedirect = formData.get("redirect")?.toString() || "/dashboard";
  // Só aceita caminho interno (começa com "/" e não com "//") pra evitar
  // open redirect (ex: /login?redirect=https://site-malicioso.com).
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/dashboard";

  const result = await signIn(email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect(redirectTo);
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}
