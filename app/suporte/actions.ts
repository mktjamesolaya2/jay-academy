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
import { registrarCompra } from "@/lib/hotmart-store";
import type { LinhaDeCompra } from "@/lib/hotmart-csv";

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

/**
 * Apaga uma conversa de vez.
 *
 * ⚠️ Redireciona pra lista no fim: a tela da conversa apagada continuaria
 * aberta mostrando algo que não existe mais, e o primeiro clique daria erro.
 */
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

/**
 * Grava o histórico de vendas importado do CSV da Hotmart.
 *
 * ⚠️ Grava no MESMO lugar do webhook (`registrarCompra`), de propósito. Duas
 * fontes escrevendo em lugares diferentes viraria duas verdades sobre o acesso
 * da mesma aluna — e a consulta teria que escolher uma.
 *
 * ⚠️ Reimportar é seguro: `registrarCompra` atualiza a compra existente em vez
 * de duplicar. Isso importa porque o caminho natural é subir o relatório de
 * novo daqui a um mês.
 */
export async function importarVendasAction(
  comprasJson: string
): Promise<{ ok: boolean; gravadas?: number; erro?: string }> {
  try {
    await requireAdmin();
    const linhas = JSON.parse(comprasJson) as LinhaDeCompra[];
    if (!Array.isArray(linhas)) return { ok: false, erro: "Arquivo não reconhecido." };
    if (linhas.length > 20_000) {
      return { ok: false, erro: "Arquivo grande demais — exporta em períodos menores." };
    }

    const agora = new Date().toISOString();
    let gravadas = 0;
    for (const l of linhas) {
      if (!l?.email || !l?.compradaEm) continue;
      await registrarCompra({
        email: l.email,
        nome: l.nome,
        produto: l.produto || "curso",
        compradaEm: l.compradaEm,
        situacao: l.situacao || "aprovada",
        atualizadaEm: agora,
      });
      gravadas++;
    }
    await logActivity("wp.edit", "Suporte", `${gravadas} vendas importadas da Hotmart`);
    revalidatePath("/suporte");
    return { ok: true, gravadas };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro ao importar" };
  }
}
