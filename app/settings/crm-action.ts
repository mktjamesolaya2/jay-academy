"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setChavePadrao, getChavePadrao } from "@/lib/crm-chave";
import { extrairChave } from "@/lib/webhook-codigo";
import { logActivity } from "@/lib/activity-log";

/** Salva a chave do CRM que vale pro site inteiro. */
export async function salvarChavePadraoAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string; chave?: string }> {
  try {
    await requireAdmin();
    const texto = (formData.get("chave")?.toString() ?? "").trim();

    if (texto && !extrairChave(texto)) {
      return {
        ok: false,
        error: "Não achei a chave (pk_...) nesse texto. Cole o código do CRM, ou só a chave.",
      };
    }

    await setChavePadrao(texto);
    const chave = await getChavePadrao();
    await logActivity(
      "wp.edit",
      "CRM",
      chave ? "chave padrão do CRM definida" : "chave padrão do CRM removida"
    );
    revalidatePath("/settings");
    return { ok: true, chave: chave ?? "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}
