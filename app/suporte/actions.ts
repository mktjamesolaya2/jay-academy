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
import { registrarCompras } from "@/lib/hotmart-store";
import { registrarImportacao } from "@/lib/importacao-store";
import type { ComprasDeUmEmail } from "@/lib/hotmart-csv";

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
export async function apagarConversaAction(
  id: string
): Promise<{ ok: boolean; erro?: string }> {
  // ⚠️ Erro não tratado em ação de servidor vira "This page couldn't load" —
  // uma tela branca que não diz nada e ainda perde de vista o que a pessoa
  // estava fazendo. Aqui ele vira uma frase que dá pra ler e pra me mandar.
  try {
    await requireAdmin();
    await apagarConversa(id);
    revalidatePath("/suporte");
    revalidatePath("/suporte/conversas");
    return { ok: true };
  } catch (e) {
    const erro = e instanceof Error ? e.message : "erro desconhecido";
    console.error("[suporte] apagar conversa falhou:", erro);
    return { ok: false, erro };
  }
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
  loteJson: string
): Promise<{ ok: boolean; gravadas?: number; erro?: string }> {
  try {
    await requireAdmin();
    const lote = JSON.parse(loteJson) as ComprasDeUmEmail[];
    if (!Array.isArray(lote)) return { ok: false, erro: "Arquivo não reconhecido." };
    if (lote.length > 600) {
      return { ok: false, erro: "Lote grande demais — a tela deveria ter fatiado antes." };
    }

    const agora = new Date().toISOString();
    let gravadas = 0;

    // ⚠️ Em paralelo, mas com rédea curta. Sequencial, 8.477 e-mails levariam
    // minutos e estourariam o tempo limite; solto, abriria milhares de
    // conexões ao KV de uma vez e ele começaria a recusar.
    const FILA = 12;
    for (let i = 0; i < lote.length; i += FILA) {
      // ⚠️ Soma DEPOIS, com o que cada tarefa devolveu. Antes era
      // `gravadas += await registrar(...)` dentro do `map` — e em JavaScript o
      // `+=` lê o valor da esquerda ANTES do await. Com 12 tarefas em
      // paralelo, as 12 liam o mesmo número e só a última gravava: o
      // contador mostrou 914 no lugar de 10.835. Os dados entraram certos; era
      // só a conta. Mas o número é o que diz se deu certo, então mentir nele é
      // pior do que não mostrar.
      const feitas = await Promise.all(
        lote.slice(i, i + FILA).map(async (pessoa) => {
          // ⚠️ Uma leitura e uma escrita por PESSOA, não por compra. Antes a
          // mesma chave era lida e regravada uma vez por linha — e quem tem
          // três cursos custava seis idas ao banco em vez de duas.
          const validas = (pessoa.compras ?? [])
            .filter((c) => c?.email && c?.compradaEm)
            .map((c) => ({
              email: c.email,
              nome: c.nome,
              produto: c.produto || "curso",
              compradaEm: c.compradaEm,
              situacao: c.situacao || "aprovada",
              atualizadaEm: agora,
            }));
          return await registrarCompras(pessoa.email, validas);
        })
      );
      gravadas += feitas.reduce((a, b) => a + b, 0);
    }

    return { ok: true, gravadas };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro ao importar" };
  }
}

/**
 * Fecha a importação: registra no histórico e atualiza as telas.
 *
 * ⚠️ Separado do lote de propósito. Chamar `revalidatePath` a cada um dos 17
 * lotes jogaria fora o cache do portal inteiro 17 vezes seguidas, sem nenhum
 * ganho — o número final é o mesmo.
 */
export async function fecharImportacaoAction(
  total: number,
  alunas: number,
  arquivos: string[]
): Promise<{ ok: boolean }> {
  const me = await requireAdmin();
  await registrarImportacao({
    em: new Date().toISOString(),
    compras: total,
    alunas,
    quem: me?.email ?? "—",
    arquivos: arquivos.slice(0, 20),
  }).catch(() => {});
  await logActivity("wp.edit", "Suporte", `${total} vendas importadas da Hotmart`);
  revalidatePath("/suporte");
  revalidatePath("/suporte/importar");
  return { ok: true };
}
