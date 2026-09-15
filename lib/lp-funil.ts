/**
 * As LPs que têm funil próprio: onde o lead é a conversão que a campanha paga,
 * o envio termina num checkout e um lead que não chega ao CRM é prejuízo.
 *
 * Os DOIS mapas deste arquivo descrevem o mesmo conjunto de páginas e precisam
 * andar juntos — por isso moram lado a lado, e por isso existe um teste que
 * falha se um slug entrar num e não no outro. Eles já divergiram uma vez: a
 * /jaytransforma-start nasceu com checkout mas sem regras, e a consequência
 * foi silenciosa — telefone indo pro CRM com máscara em vez de E.164, e recusa
 * do CRM virando "sucesso" na tela da pessoa.
 *
 * Parte 1 — para onde a pessoa vai depois de enviar o formulário, quando isso
 * depende do que ela ESCOLHEU e não só de qual página ela estava.
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
  // ⚠️ Migrado da Cielo para o C6 em 15/09. O Pix e o cartão do C6 chegam por
  // DOMÍNIOS diferentes (api-gateway.c6bank.info e checkout2.c6pay.com.br) —
  // é o que permite o teste pegar um link trocado de lugar, que é o erro fácil
  // de cometer quando se cola seis UUIDs vindos de duas listas separadas.
  //
  // ⚠️ Não dá pra conferir estes links por requisição: o checkout do C6 é um
  // SPA e devolve a MESMA casca 404 para UUID válido e inventado. Só abrindo
  // no navegador.
  "jaytransforma-beauty": {
    // Ganhou escolha em 15/09, com o Pix. Até então era a única das três com
    // um destino só, fixo no REDIRECT_PADRAO_POR_LP da rota de captura.
    campos: ["pagamento"],
    destinos: {
      pix: "https://api-gateway.c6bank.info/v1/payment/6c8f923a-9ec2-4c8a-857a-7eddaf9ada54",
      cartao: "https://checkout2.c6pay.com.br/payment/378ed588-2128-4d1b-ba53-74ea8d95f85a",
    },
  },
  "jaytransforma-remove": {
    campos: ["pagamento"],
    destinos: {
      pix: "https://api-gateway.c6bank.info/v1/payment/64dda652-b9b8-49af-9c99-39a5f1da13b7",
      cartao: "https://checkout2.c6pay.com.br/payment/ca1a7f3a-c975-44f6-abf3-83e3e9c42be0",
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
      pix: "https://api-gateway.c6bank.info/v1/payment/92923a19-2df9-4dae-9112-869dfc151156",
      cartao: "https://checkout2.c6pay.com.br/payment/7ccd7058-3b5d-429b-bd2b-cf840d42add9",
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

/**
 * Parte 2 — o que vale de diferente nessas páginas: validação estrita antes de
 * mandar (telefone normalizado em E.164, com o "+"), recusa explícita quando o
 * CRM diz não, e a mensagem de sucesso própria.
 *
 * ⚠️ Página com checkout que NÃO estiver aqui falha em silêncio: o telefone vai
 * pro CRM com a máscara do formulário (que o CRM recusa), e a recusa vira
 * "sucesso" na tela — a pessoa segue pro pagamento e o negócio não existe.
 */
export type RegrasDaLp = { exigeEmail: boolean; mensagemOk: string };

const OK_FECHAMENTO = "Tudo certo! Você será direcionada para garantir sua vaga.";

export const REGRAS_POR_LP: Readonly<Record<string, RegrasDaLp>> = {
  transforma: {
    exigeEmail: true,
    mensagemOk: "Inscrição confirmada! Você será direcionada ao grupo do evento.",
  },
  // As três ofertas de fechamento do JAY TRANSFORMA pedem só nome e telefone:
  // quem chega nelas já deu o e-mail na inscrição do evento, e cada campo a
  // mais é gente que desiste na hora da oferta.
  "jaytransforma-beauty": { exigeEmail: false, mensagemOk: OK_FECHAMENTO },
  "jaytransforma-remove": { exigeEmail: false, mensagemOk: OK_FECHAMENTO },
  "jaytransforma-start": { exigeEmail: false, mensagemOk: OK_FECHAMENTO },
};

/** As regras desta página, ou `null` se ela não tem funil próprio. */
export function regrasDaLp(slug: string): RegrasDaLp | null {
  // hasOwn: o slug vem da URL, não pode alcançar o Object.prototype.
  return Object.hasOwn(REGRAS_POR_LP, slug) ? REGRAS_POR_LP[slug] : null;
}
