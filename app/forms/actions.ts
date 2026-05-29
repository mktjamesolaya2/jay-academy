"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  deleteForm as deleteFormStore,
  getForm,
  getFormBySlug,
  newFormId,
  saveForm,
  slugify,
  type FormConfig,
} from "@/lib/forms-store";

type ActionResult = { error?: string; success?: string };

function validateUrl(url: string): boolean {
  if (!url) return true;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createFormAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const name = formData.get("name")?.toString().trim() ?? "";
    const slugInput = formData.get("slug")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";
    const buttonLabel =
      formData.get("buttonLabel")?.toString().trim() || "Cadastrar-se";
    const webhookUrl = formData.get("webhookUrl")?.toString().trim() ?? "";
    const redirectUrl = formData.get("redirectUrl")?.toString().trim() ?? "";

    if (!name) return { error: "Nome do formulário é obrigatório" };
    const slug = slugify(slugInput || name);
    if (!slug) return { error: "Slug inválido" };

    if (webhookUrl && !validateUrl(webhookUrl)) {
      return { error: "URL do webhook inválida (precisa começar com https://)" };
    }
    if (redirectUrl && !validateUrl(redirectUrl)) {
      return { error: "URL de redirect inválida" };
    }

    const existing = await getFormBySlug(slug);
    if (existing) return { error: `Já existe um formulário com slug "${slug}"` };

    const form: FormConfig = {
      id: newFormId(),
      slug,
      name,
      description: description || undefined,
      buttonLabel,
      webhookUrl: webhookUrl || undefined,
      redirectUrl: redirectUrl || undefined,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };
    await saveForm(form);
    await logActivity("form.create", name);

    revalidatePath("/forms");
    redirect(`/forms/${form.id}`);
  } catch (e) {
    // O redirect do Next joga uma exception interna — repropaga
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
    return { error: e instanceof Error ? e.message : "Erro ao criar formulário" };
  }
}

export async function updateFormAction(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = formData.get("id")?.toString() ?? "";
    if (!id) return { error: "ID ausente" };

    const existing = await getForm(id);
    if (!existing) return { error: "Formulário não encontrado" };

    const name = formData.get("name")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";
    const buttonLabel =
      formData.get("buttonLabel")?.toString().trim() || "Cadastrar-se";
    const webhookUrl = formData.get("webhookUrl")?.toString().trim() ?? "";
    const redirectUrl = formData.get("redirectUrl")?.toString().trim() ?? "";

    if (!name) return { error: "Nome obrigatório" };
    if (webhookUrl && !validateUrl(webhookUrl)) {
      return { error: "URL do webhook inválida" };
    }
    if (redirectUrl && !validateUrl(redirectUrl)) {
      return { error: "URL de redirect inválida" };
    }

    await saveForm({
      ...existing,
      name,
      description: description || undefined,
      buttonLabel,
      webhookUrl: webhookUrl || undefined,
      redirectUrl: redirectUrl || undefined,
    });
    await logActivity("form.update", name);

    revalidatePath("/forms");
    revalidatePath(`/forms/${id}`);
    revalidatePath(`/f/${existing.slug}`);

    return { success: "Salvo" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function deleteFormAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  if (!id) return;
  const existing = await getForm(id);
  await deleteFormStore(id);
  if (existing) await logActivity("form.delete", existing.name);
  revalidatePath("/forms");
  redirect("/forms");
}
