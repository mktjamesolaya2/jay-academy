import "server-only";
import { kvGet, kvSet } from "./storage";

/**
 * A fila de acessos pra reenviar na Hotmart.
 *
 * ⚠️ Existe porque **reenviar acesso não tem API** — a sonda testou seis
 * endereços plausíveis e todos deram 404. É clique humano, na tela da Hotmart.
 *
 * Então a IA faz a parte dela: descobre que a aluna tem acesso válido e só
 * precisa receber o e-mail de novo, e **anota aqui**. James: *"deixar ali uma
 * caixa, um espaço, com os e-mails pra reenviar"*.
 *
 * Sem esta fila, o pedido viveria só na conversa — e conversa some no meio de
 * outras. Aqui ele fica até alguém dizer que reenviou.
 */

const CHAVE = "suporte:reenvios";
const MAX = 200;

export type Reenvio = {
  email: string;
  nome?: string;
  /** Os cursos que ela comprou, pra saber o que reenviar. */
  produtos: string[];
  /** Até quando o acesso vale — confirma que é reenvio, não renovação. */
  /**
   * Até quando o acesso vale.
   *
   * ⚠️ Opcional porque acesso VITALÍCIO não tem data — e obrigar uma aqui
   * faria alguém inventar um vencimento pra quem comprou acesso permanente.
   */
  venceEm?: string;
  pedidoEm: string;
};

export async function listarReenvios(): Promise<Reenvio[]> {
  return (await kvGet<Reenvio[]>(CHAVE)) ?? [];
}

/**
 * Põe na fila. Se a mesma aluna pedir de novo, atualiza em vez de duplicar —
 * ninguém quer reenviar duas vezes pro mesmo e-mail.
 */
export async function pedirReenvio(r: Reenvio): Promise<void> {
  const todos = await listarReenvios();
  const i = todos.findIndex(
    (x) => x.email.toLowerCase() === r.email.toLowerCase()
  );
  if (i === -1) todos.unshift(r);
  else todos[i] = { ...todos[i], ...r };
  await kvSet(CHAVE, todos.slice(0, MAX));
}

/** Alguém reenviou — sai da fila. */
export async function marcarReenviado(email: string): Promise<void> {
  const todos = await listarReenvios();
  await kvSet(
    CHAVE,
    todos.filter((x) => x.email.toLowerCase() !== email.toLowerCase())
  );
}

export async function quantosReenviosPendentes(): Promise<number> {
  return (await listarReenvios()).length;
}
