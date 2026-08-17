"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  setConhecimento,
  getConversa,
  salvarConversa,
  apagarConversa,
  removerLacuna,
} from "@/lib/suporte-store";
import { marcarReenviado } from "@/lib/reenvio-store";

/** Salva o que a IA sabe. É aqui que ela é treinada. */
export async function salvarConhecimentoAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const texto = formData.get("conhecimento")?.toString() ?? "";
    if (texto.length > 100_000) {
      return { ok: false, error: "Texto grande demais." };
    }
    await setConhecimento(texto);
    await logActivity("wp.edit", "Suporte", "base de conhecimento atualizada");
    revalidatePath("/suporte");
    revalidatePath("/suporte/conversas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

/**
 * Devolve a conversa pra IA depois que uma pessoa resolveu.
 *
 * ⚠️ Só por aqui. A IA não volta a responder sozinha — se voltasse, atropelaria
 * o atendimento humano no meio de uma conversa delicada.
 */
export async function reativarIaAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const c = await getConversa(id);
    if (!c) return { ok: false, error: "Conversa não encontrada" };
    c.aguardandoPessoa = false;
    await salvarConversa(c);
    revalidatePath("/suporte");
    revalidatePath("/suporte/conversas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

/** Responde como pessoa — a IA continua calada. */
export async function responderComoPessoaAction(
  id: string,
  texto: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const c = await getConversa(id);
    if (!c) return { ok: false, error: "Conversa não encontrada" };
    c.mensagens.push({
      de: "pessoa",
      texto: texto.trim(),
      em: new Date().toISOString(),
    });
    c.aguardandoPessoa = true;
    await salvarConversa(c);
    revalidatePath("/suporte");
    revalidatePath("/suporte/conversas");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

export async function apagarConversaAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await apagarConversa(id);
  revalidatePath("/suporte");
  revalidatePath("/suporte/conversas");
  return { ok: true };
}

/** Tira uma pergunta da fila de lacunas (já foi respondida na base). */
export async function removerLacunaAction(pergunta: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await removerLacuna(pergunta);
  revalidatePath("/suporte");
  revalidatePath("/suporte/conversas");
  return { ok: true };
}

/** Alguém reenviou o acesso na Hotmart — tira da fila. */
export async function marcarReenviadoAction(email: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  await marcarReenviado(email);
  await logActivity("wp.edit", email, "acesso reenviado na Hotmart");
  revalidatePath("/suporte");
  revalidatePath("/suporte/conversas");
  return { ok: true };
}
