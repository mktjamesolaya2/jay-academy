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
    // A página vende DUAS formações, mas o checkout não distingue as duas: o
    // preço é o mesmo (R$ 2.997 no Pix, 10x R$ 397 no cartão), então há um par
    // de links só. Por isso a turma NÃO entra na chave — ela vai pro CRM, que
    // é quem precisa saber qual formação a pessoa quis.
    //
    // ⚠️ Se um dia as duas formações tiverem preços diferentes, aqui vira
    // `campos: ["turma", "pagamento"]` e a chave passa a ser "turma|pagamento".
    // A função já sabe lidar com isso; é só o mapa que muda.
    campos: ["pagamento"],
    destinos: {
      pix: "https://cielolink.com.br/4ipEfbT",
      cartao: "https://cielolink.com.br/4AixO0M",
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
  // hasOwn: o slug vem da URL, não pode alcançar o Object.prototype.
  if (!Object.hasOwn(REDIRECT_POR_ESCOLHA, slug)) return null;
  return resolverDestino(REDIRECT_POR_ESCOLHA[slug], campos);
}

/**
 * A resolução em si, separada da tabela: é ela que sabe montar a chave a partir
 * de um ou mais campos. Fica exportada porque hoje as duas páginas do mapa
 * decidem por UM campo só — sem isto, o caminho da chave composta ficaria sem
 * teste até o dia em que alguém precisasse dele, que é justamente o pior dia
 * pra descobrir que ele não funciona.
 */
export function resolverDestino(
  regra: RegraDeEscolha,
  campos: Record<string, string>
): string | null {
  const partes: string[] = [];
  for (const campo of regra.campos) {
    const valor = (campos[campo] || "").trim().toLowerCase();
    // Uma escolha faltando invalida a combinação inteira.
    if (!valor) return null;
    partes.push(valor);
  }

  const chave = partes.join("|");
  // hasOwn de novo: o valor veio do formulário.
  if (!Object.hasOwn(regra.destinos, chave)) return null;
  // Destino vazio = link ainda não configurado. Melhor não redirecionar do que
  // redirecionar errado.
  return regra.destinos[chave] || null;
}
