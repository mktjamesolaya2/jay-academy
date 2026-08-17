import "server-only";
import { kvGet, kvSet } from "./storage";

export { venceEm, acessoVencido, diasRestantes } from "./hotmart-acesso";

/**
 * O que a Hotmart nos conta sobre cada compra.
 *
 * ⚠️ Existe pra responder a pergunta que mais chega no suporte: *"não consigo
 * acessar o curso"*. Na maioria das vezes o acesso venceu — vale 12 meses — e a
 * pessoa não percebeu. Hoje a IA precisa PERGUNTAR há quanto tempo a aluna
 * comprou; com isto ela sabe.
 *
 * Guarda só o necessário pra responder isso: quem, qual curso, quando comprou e
 * se foi reembolsado. Nada de dado de pagamento — o portal não tem o que fazer
 * com cartão, e guardar aumentaria o estrago de qualquer vazamento.
 */

const PREFIXO = "hotmart:compra:";

export type CompraHotmart = {
  email: string;
  nome?: string;
  produto: string;
  compradaEm: string;
  /** `aprovada`, `reembolsada`, `cancelada`, `atrasada`… */
  situacao: string;
  atualizadaEm: string;
};

function chave(email: string): string {
  return `${PREFIXO}${email.trim().toLowerCase()}`;
}

export async function comprasDoEmail(email: string): Promise<CompraHotmart[]> {
  if (!email.trim()) return [];
  return (await kvGet<CompraHotmart[]>(chave(email))) ?? [];
}

export async function registrarCompra(c: CompraHotmart): Promise<void> {
  const todas = await comprasDoEmail(c.email);
  // Mesma pessoa + mesmo produto = atualiza (ex.: aprovada → reembolsada).
  const i = todas.findIndex(
    (x) => x.produto.toLowerCase() === c.produto.toLowerCase()
  );
  if (i === -1) todas.unshift(c);
  else todas[i] = { ...todas[i], ...c };
  await kvSet(chave(c.email), todas.slice(0, 20));
}
