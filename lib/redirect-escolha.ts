/**
 * Para onde a pessoa vai depois de enviar o formulário, quando isso depende do
 * que ela ESCOLHEU e não só de qual página ela estava.
 *
 * ⚠️ Isto é um módulo puro, separado e testado, pelo mesmo motivo de
 * lib/crm-envio.ts: o destino errado aqui manda a aluna pagar o preço de outra
 * formação, e é um erro que não aparece em tela nenhuma — o botão funciona, o
 * checkout abre, o valor é que está trocado. Os testes deste arquivo olham a
 * URL que sai.
 *
 * O campo de redirect do painel (/lps/<slug>) é UM só, e estas páginas têm dois
 * ou quatro destinos. Por isso, e só para os slugs listados aqui, esta escolha
 * passa na frente dele. O preço: trocar um link exige deploy.
 */

export type RegraDeEscolha = {
  /** Os campos do formulário que decidem, na ordem em que compõem a chave. */
  campos: readonly string[];
  /** Chave = os valores dos campos unidos por "|". Valor = a URL do checkout. */
  destinos: Readonly<Record<string, string>>;
};

/**
 * ⚠️ As chaves de `destinos` são comparadas contra o `value` dos rádios do HTML,
 * em minúsculas e sem espaços nas pontas. Os `value` são ASCII de propósito:
 * acento viajando por form-urlencoded é uma forma silenciosa de o destino não
 * casar, e o sintoma seria "não redirecionou", não "redirecionou errado".
 */
export const REDIRECT_POR_ESCOLHA: Readonly<Record<string, RegraDeEscolha>> = {
  "jaytransforma-remove": {
    campos: ["pagamento"],
    destinos: {
      pix: "https://cielolink.com.br/4iXIpI8",
      cartao: "https://cielolink.com.br/4cGaboO",
    },
  },
  "jaytransforma-start": {
    // Duas formações e duas formas de pagamento = quatro checkouts. A turma já
    // diz qual é a formação (é uma pergunta só no formulário), então as duas
    // turmas do Brows apontam para o MESMO par de links.
    //
    // As seis combinações estão escritas por extenso de propósito: derivar a
    // formação do prefixo "brows-"/"lips-" criaria um acoplamento invisível,
    // que quebraria em silêncio no dia em que alguém renomear uma turma.
    //
    // ⚠️ FALTAM OS LINKS DE PAGAMENTO. Destino vazio é tratado como "ainda não
    // configurado": o envio continua capturando o lead e cai na cascata normal,
    // em vez de mandar a pessoa para o checkout errado. Preencher os quatro
    // (o Brows repete nas duas turmas) libera a página.
    campos: ["turma", "pagamento"],
    destinos: {
      "brows-out|pix": "",
      "brows-out|cartao": "",
      "brows-dez|pix": "",
      "brows-dez|cartao": "",
      "lips-nov|pix": "",
      "lips-nov|cartao": "",
    },
  },
};

/**
 * A URL de checkout que a escolha da pessoa aponta, ou `null` quando não dá pra
 * saber — aí quem decide é a cascata normal do /api/elementor-form.
 *
 * Devolve `null` (e não um palpite) quando: a página não tem regra, algum campo
 * veio em branco, a combinação não existe no mapa, ou o destino está vazio
 * porque o link ainda não foi configurado. Em todos esses casos é melhor não
 * redirecionar do que redirecionar errado.
 */
export function destinoDaEscolha(
  slug: string,
  campos: Record<string, string>
): string | null {
  // hasOwn nos dois níveis: o slug vem da URL e os valores vêm do formulário —
  // nenhum dos dois pode alcançar o Object.prototype.
  if (!Object.hasOwn(REDIRECT_POR_ESCOLHA, slug)) return null;
  const regra = REDIRECT_POR_ESCOLHA[slug];

  const partes: string[] = [];
  for (const campo of regra.campos) {
    const valor = (campos[campo] || "").trim().toLowerCase();
    // Uma escolha faltando invalida a combinação inteira: sem ela não dá pra
    // saber nem a formação nem o preço.
    if (!valor) return null;
    partes.push(valor);
  }

  const chave = partes.join("|");
  if (!Object.hasOwn(regra.destinos, chave)) return null;
  return regra.destinos[chave] || null;
}
