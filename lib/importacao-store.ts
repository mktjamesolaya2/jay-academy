import "server-only";
import { kvGet, kvSet } from "./storage";

/**
 * O histórico das importações de vendas.
 *
 * ⚠️ James: *"importei, fechei e abri a aba de novo, e sumiu"*. Sem registro,
 * não dá pra saber se a importação rodou, quando, nem quanta coisa entrou — e
 * a dúvida vira reimportar por garantia, toda vez.
 *
 * ⚠️ Fica no banco e não na tela, porque a pergunta ("já importei?") aparece
 * justamente numa aba nova, dias depois, de outro computador.
 */

const CHAVE = "suporte:importacoes";
const QUANTAS_GUARDAR = 20;

export type Importacao = {
  em: string;
  /** Quantas compras foram gravadas. */
  compras: number;
  /** Quantas alunas distintas. */
  alunas: number;
  /** Quem clicou — dá pra perguntar pra pessoa certa depois. */
  quem: string;
  /** Nomes dos arquivos, pra saber quais anos entraram. */
  arquivos: string[];
};

export async function listarImportacoes(): Promise<Importacao[]> {
  return (await kvGet<Importacao[]>(CHAVE)) ?? [];
}

export async function registrarImportacao(i: Importacao): Promise<void> {
  const todas = await listarImportacoes();
  todas.unshift(i);
  await kvSet(CHAVE, todas.slice(0, QUANTAS_GUARDAR));
}
