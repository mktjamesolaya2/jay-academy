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
export type ResultadoDaBusca = {
  compras: CompraHotmart[];
  /**
   * A consulta na API falhou (não é o mesmo que "não achou nada").
   *
   * ⚠️ Este campo existe por causa de um erro que chegou na aluna. A API
   * respondia 400 (`invalid_parameter`) pra TODO e-mail, o `catch` engolia,
   * a lista voltava vazia, e o suporte dizia "procurei e não achei compra
   * com esse e-mail" — negando a compra de quem pagou, por um erro nosso.
   *
   * Quem chama PRECISA distinguir os dois. Por isso a falha sobe junto com o
   * resultado, em vez de virar log e sumir.
   */
  apiFalhou: boolean;
};

export async function todasAsCompras(email: string): Promise<ResultadoDaBusca> {
  const doWebhook = await comprasDoEmail(email).catch(() => []);

  let daApi: CompraHotmart[] = [];
  let apiFalhou = false;
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
    // ⚠️ O `/sales/` está barrado pra nossa credencial (400 em tudo). Antes de
    // desistir, tenta a porta que responde: `/subscriptions/transactions`.
    // Ela cobre parcelado e assinatura — a maior parte das ofertas da casa.
    console.warn("[hotmart] histórico de vendas indisponível, tentando assinaturas:", e);
    try {
      const { temCredenciais, assinaturasDoEmail } = await import("./hotmart-api");
      if (temCredenciais()) {
        daApi = (await assinaturasDoEmail(email)).map((v) => ({
          email,
          nome: v.comprador || undefined,
          produto: v.produto,
          compradaEm: v.compradaEm,
          situacao: v.situacao,
          atualizadaEm: new Date().toISOString(),
        }));
      }
    } catch (e2) {
      // ⚠️ Só AQUI a consulta é dada por perdida — e é isso que faz o suporte
      // dizer "não consegui conferir" em vez de "não achei sua compra".
      apiFalhou = true;
      console.warn("[hotmart] assinaturas também falharam:", e2);
    }
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
  // ⚠️ Se o webhook achou alguma coisa, a falha da API não importa mais: a
  // gente TEM registro de compra, e é isso que a aluna precisa ouvir.
  return { compras: juntas, apiFalhou: apiFalhou && juntas.length === 0 };
}

/**
 * Dá pra consultar a Hotmart agora?
 *
 * ⚠️ Existe porque "não achei compra" e "não consegui procurar" são coisas
 * MUITO diferentes pra quem está do outro lado — e a segunda estava saindo
 * como a primeira. Sem as credenciais da API, `todasAsCompras` devolve lista
 * vazia, e a aluna ouvia "procurei e não achei nenhuma compra com esse e-mail".
 * Ela pagou. A frase nega a compra dela por causa de uma variável de ambiente
 * que ninguém configurou.
 */
export async function podeConsultarHotmart(): Promise<boolean> {
  try {
    const { temCredenciais } = await import("./hotmart-api");
    return temCredenciais();
  } catch {
    return false;
  }
}

/**
 * Grava VÁRIAS compras da mesma pessoa de uma vez.
 *
 * ⚠️ `registrarCompra` lê e grava a cada compra. Na importação isso vira uma
 * ida e volta ao banco por LINHA — 12 mil no arquivo real, com a mesma chave
 * sendo lida e regravada várias vezes pra mesma aluna. Aqui é uma leitura e
 * uma escrita por pessoa.
 *
 * ⚠️ O que já existe é preservado: a compra que veio pelo webhook continua lá
 * se não estiver no arquivo. Importar não pode apagar o que a gente já sabia.
 */
export async function registrarCompras(
  email: string,
  novas: CompraHotmart[]
): Promise<number> {
  if (!email.trim() || !novas.length) return 0;
  const todas = await comprasDoEmail(email);

  for (const c of novas) {
    const i = todas.findIndex(
      (x) => x.produto.toLowerCase() === c.produto.toLowerCase()
    );
    if (i === -1) todas.unshift(c);
    else todas[i] = { ...todas[i], ...c };
  }

  await kvSet(chave(email), todas.slice(0, 20));
  return novas.length;
}
