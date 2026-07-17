"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setLpFormConfig } from "@/lib/lp-form-config";

export async function setLpWebhookAction(
  prevState: { ok?: boolean; error?: string; slug?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  const formWebhookUrl = formData.get("webhook")?.toString() ?? "";
  const formRedirectUrl = formData.get("redirect")?.toString() ?? "";
  if (!slug) return { error: "slug ausente" };
  if (formWebhookUrl && !/^https?:\/\//i.test(formWebhookUrl)) {
    return { error: "Webhook precisa ser uma URL http(s)", slug };
  }
  await setLpFormConfig(slug, { formWebhookUrl, formRedirectUrl });
  revalidatePath("/leads");
  return { ok: true, slug };
}
