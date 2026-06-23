"use server";

import { redirect } from "next/navigation";
import { signIn, signUp, signOut } from "@/lib/auth";

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

export async function signUpAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  const name = formData.get("name")?.toString() ?? "";
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

  if (password !== confirmPassword) {
    return { error: "As senhas não conferem" };
  }

  const result = await signUp(name, email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}
