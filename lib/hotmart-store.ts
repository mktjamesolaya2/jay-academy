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

/**
 * Todas as compras que a gente conhece de um e-mail.
 *
 * ⚠️ Junta as DUAS fontes, e cada uma cobre o buraco da outra:
 * - a **API** tem o histórico completo, inclusive quem comprou antes de a
 *   gente conectar — que é justamente a aluna com acesso perto de vencer;
 * - o **webhook** tem o que acabou de acontecer, e continua funcionando se a
 *   API estiver fora do ar ou a credencial expirar.
 *
 * Se a API falhar, seguimos com o webhook em vez de dizer "não achei nada" —
 * responder "você não tem compra" pra quem tem é pior do que responder com
 * informação parcial.
 */
export async function todasAsCompras(email: string): Promise<CompraHotmart[]> {
  const doWebhook = await comprasDoEmail(email).catch(() => []);

  let daApi: CompraHotmart[] = [];
  try {
    const { temCredenciais, vendasDoEmail } = await import("./hotmart-api");
    if (temCredenciais()) {
      daApi = (await vendasDoEmail(email)).map((v) => ({
        email,
        nome: v.comprador || undefined,
        produto: v.produto,
        compradaEm: v.compradaEm,
        situacao: v.situacao,
        atualizadaEm: new Date().toISOString(),
      }));
    }
  } catch (e) {
    console.warn("[hotmart] consulta na API falhou, usando só o webhook:", e);
  }

  // Mesma compra nas duas fontes: fica uma só (produto + dia).
  const vistas = new Set<string>();
  const juntas: CompraHotmart[] = [];
  for (const c of [...daApi, ...doWebhook]) {
    const chave = `${c.produto.toLowerCase()}|${c.compradaEm.slice(0, 10)}`;
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    juntas.push(c);
  }
  return juntas;
}
