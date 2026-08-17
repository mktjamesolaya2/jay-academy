/**
 * As contas do acesso de 12 meses — puras, pra poderem ser testadas.
 *
 * ⚠️ Separadas do `hotmart-store.ts` porque aquele importa `server-only`, que o
 * runner de teste não consegue carregar. Mesmo padrão do `wp-localize-core.ts`.
 *
 * É a conta que responde a pergunta mais comum do suporte: *"não consigo
 * acessar"* — que quase sempre é o acesso vencido sem a aluna perceber.
 */

/** O acesso vale 12 meses a partir da compra. */
export function venceEm(compradaEm: string): Date {
  const d = new Date(compradaEm);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export function acessoVencido(compradaEm: string, hoje = new Date()): boolean {
  return venceEm(compradaEm).getTime() < hoje.getTime();
}

/** Quantos dias faltam (negativo = já venceu). */
export function diasRestantes(compradaEm: string, hoje = new Date()): number {
  const ms = venceEm(compradaEm).getTime() - hoje.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
