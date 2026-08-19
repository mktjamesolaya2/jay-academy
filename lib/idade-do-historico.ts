/**
 * Há quanto tempo o histórico de vendas não é atualizado.
 *
 * ⚠️ Existe porque o suporte depende de uma planilha que alguém precisa
 * lembrar de exportar. Enquanto a API de vendas não for liberada, é assim que
 * a gente enxerga compra antiga — e o dia em que ninguém lembrar, o sistema
 * não avisa: ele simplesmente responde "não consegui conferir" pra quem
 * comprou depois da última importação, e ninguém liga uma coisa na outra.
 *
 * ⚠️ O aviso é sobre **idade**, não sobre "importe todo mês". Se a Hotmart
 * liberar a API, a importação deixa de importar e o aviso some junto — sem
 * ninguém precisar desligar nada.
 */

/** Depois disso, a planilha começou a ficar velha demais pra confiar. */
export const DIAS_ATE_AVISAR = 30;

export type EstadoDoHistorico =
  | { tipo: "nunca" }
  | { tipo: "em-dia"; dias: number }
  | { tipo: "envelhecendo"; dias: number };

export function idadeDoHistorico(
  ultimaEm: string | undefined,
  agora = new Date()
): EstadoDoHistorico {
  if (!ultimaEm) return { tipo: "nunca" };
  const quando = new Date(ultimaEm);
  if (isNaN(quando.getTime())) return { tipo: "nunca" };

  const dias = Math.floor((agora.getTime() - quando.getTime()) / 86_400_000);
  // ⚠️ Data no futuro (relógio errado, fuso) conta como zero em vez de virar
  // número negativo — "importada há -3 dias" faz quem lê desconfiar da tela.
  const limpo = Math.max(0, dias);
  return limpo >= DIAS_ATE_AVISAR
    ? { tipo: "envelhecendo", dias: limpo }
    : { tipo: "em-dia", dias: limpo };
}

/** O que o aviso escreve. */
export function recadoDoHistorico(e: EstadoDoHistorico): string {
  switch (e.tipo) {
    case "nunca":
      return "O histórico de vendas nunca foi importado. Sem ele, o suporte só enxerga quem comprou depois que o aviso automático foi ligado.";
    case "envelhecendo":
      return `O histórico foi importado há ${e.dias} dias. Quem comprou depois disso, e não é assinante, o suporte não acha.`;
    case "em-dia":
      return e.dias === 0
        ? "Histórico importado hoje."
        : `Histórico importado há ${e.dias} ${e.dias === 1 ? "dia" : "dias"}.`;
  }
}
