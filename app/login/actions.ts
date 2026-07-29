"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { rateLimitByIp, clientIpFromHeaders } from "@/lib/rate-limit";

// Teto de tentativas por IP. Sem isso dá pra varrer a senha do senior à
// vontade — os endpoints públicos de API já tinham rate-limit, o login não.
// Janela generosa o bastante pra quem só errou a senha algumas vezes.
const LOGIN_MAX_TRIES = 10;
const LOGIN_WINDOW_SEC = 5 * 60;

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

  const ip = await clientIpFromHeaders();
  if (!(await rateLimitByIp("login", ip, LOGIN_MAX_TRIES, LOGIN_WINDOW_SEC)).ok) {
    return { error: "Muitas tentativas. Espere alguns minutos e tente de novo." };
  }

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
