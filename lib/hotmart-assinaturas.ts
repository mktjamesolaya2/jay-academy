/**
 * As compras de uma pessoa, lidas pela porta que a Hotmart deixou aberta.
 *
 * ⚠️ Todo `/sales/` responde 400 pra nossa credencial, mas
 * `/subscriptions/transactions?subscriber_email=` responde **200 com dado
 * real** — e filtra de verdade (6 itens contra 500 sem filtro). É por aqui que
 * o suporte volta a consultar ao vivo.
 *
 * ⚠️ Cobre quem comprou **parcelado ou por assinatura**, que na Jay Academy é
 * boa parte da base (as ofertas são 12x). Quem pagou à vista em parcela única
 * pode não aparecer — por isso a importação do histórico continua valendo. As
 * duas juntas cobrem mais do que qualquer uma sozinha.
 *
 * ⚠️ O formato aqui NÃO foi adivinhado: veio de uma chamada real, com os campos
 * conferidos um a um. Hoje já perdi tempo escrevendo contra formato imaginado.
 */

/** Um item da resposta — só os campos que a gente usa. */
type ItemDeAssinatura = {
  /** Quando a pessoa entrou. **Milissegundos.** */
  adoption_date?: number;
  /** `ACTIVE`, `CANCELLED`, `INACTIVE`… */
  status?: string;
  subscription_id?: number;
  product?: { id?: number; name?: string };
  plan?: { offer?: { description?: string } };
  purchase?: {
    order_date?: number;
    approved_date?: number;
    status?: string;
    transaction?: string;
  };
};

export type CompraDeAssinatura = {
  produto: string;
  /** ISO. */
  compradaEm: string;
  situacao: string;
  transacao?: string;
};

/**
 * O nome do curso, do jeito que a aluna reconhece.
 *
 * A resposta traz `product.name` e também a descrição da oferta. O nome do
 * produto é mais curto e estável; a descrição costuma ser texto de venda
 * ("CURSO BASIC MAGIC SHADOW COM PREÇO PROMOCIONAL POR TEMPO LIMITADO!"), que
 * não é jeito de falar do curso de alguém.
 */
function nomeDoProduto(i: ItemDeAssinatura): string {
  const nome = (i.product?.name ?? "").trim();
  if (nome) return nome;
  const oferta = (i.plan?.offer?.description ?? "").trim();
  return oferta || "curso";
}

/**
 * Quando a compra aconteceu.
 *
 * ⚠️ `adoption_date` primeiro, e não a data da parcela. Cada item da resposta é
 * uma PARCELA (as ofertas são 12x), então usar a data do item faria a 6ª
 * parcela parecer uma compra nova — e o acesso de 12 meses passaria a contar do
 * mês passado pra quem comprou ano passado.
 */
function dataDaCompra(i: ItemDeAssinatura): string | null {
  const ms = i.adoption_date ?? i.purchase?.order_date ?? i.purchase?.approved_date;
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return null;
  // ⚠️ A Hotmart manda MILISSEGUNDOS. Tratar como segundos jogaria a compra
  // pra 1970, e aí toda aluna apareceria com acesso vencido há 50 anos.
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Junta as parcelas numa compra só.
 *
 * ⚠️ Sem isto, quem comprou em 12x apareceria como 12 compras do mesmo curso
 * na tela do time — e a conversa começaria por "você comprou 12 vezes?".
 */
export function lerAssinaturas(resposta: unknown): CompraDeAssinatura[] {
  const itens = (resposta as { items?: ItemDeAssinatura[] })?.items;
  if (!Array.isArray(itens)) return [];

  const porAssinatura = new Map<string, CompraDeAssinatura>();

  for (const i of itens) {
    const compradaEm = dataDaCompra(i);
    if (!compradaEm) continue;

    const produto = nomeDoProduto(i);
    // A chave é a assinatura; sem ela, o produto + o dia da adesão.
    const chave = String(i.subscription_id ?? `${produto}|${compradaEm.slice(0, 10)}`);

    const jaTem = porAssinatura.get(chave);
    // ⚠️ Fica a adesão MAIS ANTIGA: é ela que marca o começo do acesso. Entre
    // parcelas, a mais nova diria que a compra é recente.
    if (!jaTem || compradaEm < jaTem.compradaEm) {
      porAssinatura.set(chave, {
        produto,
        compradaEm,
        // A situação da ASSINATURA, não a da parcela: uma parcela atrasada
        // ("DELAYED") não quer dizer que a compra foi cancelada.
        situacao: (i.status ?? i.purchase?.status ?? "").toLowerCase() || "ativa",
        transacao: i.purchase?.transaction,
      });
    }
  }

  return [...porAssinatura.values()].sort((a, b) =>
    a.compradaEm < b.compradaEm ? 1 : -1
  );
}
