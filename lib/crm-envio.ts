/**
 * Monta o corpo do lead que vai pro CRM.
 *
 * ⚠️ Isto é uma função pura, separada e testada, por causa de um erro que custou
 * caro em 13/08/2026: eu afirmei ao James que um campo ia no envio, ele **não
 * foi**, e a partir do corpo que chegou lá eu tirei uma conclusão errada sobre
 * o CRM — e mexi na tela por causa dela. O Lucas é que apontou: *"não estava
 * ignorando; nunca chegou"*.
 *
 * A lição não é "prestar mais atenção": é que o corpo do envio precisa ser
 * verificável sem depender de um teste manual no CRM de produção. Os testes
 * deste arquivo olham o objeto que sai.
 *
 * ⚠️ O portal **não manda etiqueta**. Quem etiqueta é o CRM, pelas tags fixas
 * da integração. Decisão do James: *"aqui no portal a gente não vai etiquetar
 * nada"*.
 */

export type DadosDoLead = {
  /** Campos crus do formulário, já normalizados (sem `form_fields[...]`). */
  fields: Record<string, string>;
  name: string;
  email: string;
  whatsapp: string;
  /** Slug da página de origem. */
  slug: string;
};

export function montarCorpoDoLead(d: DadosDoLead): Record<string, string> {
  return {
    // Os campos crus vêm PRIMEIRO: os normalizados têm que vencer. Na ordem
    // inversa, um campo do formulário com o mesmo nome sobrescrevia o valor
    // já tratado.
    ...d.fields,
    nome: d.name,
    email: d.email,
    telefone: d.whatsapp,
    // O CRM grava isto na anotação do negócio ("Página: ciafol-luz") — é assim
    // que o comercial sabe de onde veio.
    pagina: d.slug,
  };
}

/**
 * As perguntas de qualificação do formulário da /transforma — FONTE ÚNICA.
 *
 * ⚠️ Esta lista estava copiada em três lugares (envio ao CRM, coluna "Perfil"
 * do /leads e o CSV do /leads/export), então pergunta nova no HTML era coletada
 * e descartada em silêncio nos três. Quem mexer no formulário mexe AQUI, e os
 * três lugares acompanham sozinhos.
 *
 * `campo` é o `name` do rádio no HTML. `rotulo` é o texto curto do painel (a
 * coluna é estreita, não cabe a pergunta inteira) e `colunaCsv` é o cabeçalho
 * da planilha, onde há espaço pra dizer a pergunta por inteiro.
 *
 * ⚠️ Ao criar campo novo, fugir das substrings que o pick() do
 * /api/elementor-form usa como atalho (nome, email, mail, tel, fone, phone,
 * celular): um `name` que as contenha é sequestrado e vira o contato do lead.
 */
export const PERGUNTAS_TRANSFORMA = [
  { campo: "incomodo_atual", rotulo: "Incômodo", colunaCsv: "O que mais incomoda hoje" },
  { campo: "quando_comecar", rotulo: "Quando", colunaCsv: "Quando quer começar" },
  { campo: "adiar_decisao", rotulo: "Adia por", colunaCsv: "O que faria adiar a decisão" },
  { campo: "proximo_passo", rotulo: "Próximo passo", colunaCsv: "O que faria diante da formação certa" },
  // Perguntas antigas (saíram do formulário em 10/09). Ficam na lista porque os
  // leads captados antes disso têm essas respostas gravadas — tirar daqui faria
  // o histórico sumir do painel e do CSV.
  { campo: "prontidao_proximo_passo", rotulo: "Prontidão", colunaCsv: "Prontidão para o próximo passo" },
  { campo: "barreira_proximo_passo", rotulo: "Barreira", colunaCsv: "Barreira para o próximo passo" },
] as const;

/**
 * O Transforma só precisa identificar o contato e registrar as respostas no
 * campo de observações do CRM. Campos desconhecidos pelo webhook viram
 * observações; por isso não enviamos perfil, curso ou resumo duplicados.
 */
export function montarCorpoTransforma(
  d: Pick<DadosDoLead, "fields" | "name" | "email" | "whatsapp">
): Record<string, string> {
  const respostas: Record<string, string> = {};
  for (const { campo } of PERGUNTAS_TRANSFORMA) {
    const valor = (d.fields[campo] || "").trim();
    // Pergunta sem resposta não vira chave vazia — o CRM não precisa saber.
    if (valor) respostas[campo] = valor;
  }

  return {
    nome: d.name,
    email: d.email,
    telefone: d.whatsapp,
    tag: "JAY Transforma",
    ...respostas,
  };
}

/**
 * As ETIQUETAS dos leads das ofertas de fechamento do JAY TRANSFORMA.
 *
 * ⚠️ É ela que decide em que etapa o negócio cai no CRM. Se o negócio chegar
 * lá mas na etapa errada, o problema é ESTA string, e trocar aqui resolve:
 * ela não está escrita em mais lugar nenhum (o HTML não carrega etiqueta).
 */
/** Destino: a etapa "Checkout BEAUTY". */
export const TAG_BEAUTY = "Check BEAUTY";
/** Destino: a etapa de checkout do JAY Remove. */
export const TAG_REMOVE = "Check Remove";
/** Destino: a etapa de checkout do JAY Start. */
export const TAG_START = "Check START";

/**
 * A fábrica dos montadores das ofertas de fechamento do JAY TRANSFORMA
 * (/jaytransforma-beauty e /jaytransforma-remove).
 *
 * O corpo é o MESMO que o formulário oficial do CRM manda — nome, telefone,
 * email, tag, pagina e os utm_* — só que postado pelo servidor, não pelo
 * navegador. Do browser, a verificação prévia do POST com JSON barra o envio
 * quando o domínio não está liberado na chave, e o lead some sem erro nenhum.
 *
 * As duas páginas só diferem na etiqueta e em UM campo de decisão: o Beauty
 * pergunta a turma, o Remove pergunta a forma de pagamento. Era barato copiar
 * a função inteira e caro descobrir depois que só uma das cópias foi corrigida.
 *
 * ⚠️ Chave vazia não é enviada: quem chega aqui quase sempre já é contato do
 * CRM (veio do evento), e mandar `email: ""` apagaria o e-mail que ele já tem.
 */
function montarCorpoDeFechamento(tag: string, camposExtras: readonly string[]) {
  return (d: DadosDoLead): Record<string, string> => {
    const corpo: Record<string, string> = {
      nome: d.name,
      telefone: d.whatsapp,
      tag,
    };

    const email = (d.email || "").trim();
    if (email) corpo.email = email;

    // `pagina` é a URL inteira (o formulário preenche com location.href), não o
    // slug: é o que o CRM mostra na anotação do negócio.
    const pagina = (d.fields.pagina || "").trim();
    corpo.pagina = pagina || d.slug;

    // O campo que decide a conversa do comercial. Campo em branco não vira
    // chave vazia — o CRM não precisa saber o que a pessoa não respondeu.
    for (const campo of camposExtras) {
      const valor = (d.fields[campo] || "").trim();
      if (valor) corpo[campo] = valor;
    }

    for (const [campo, valor] of Object.entries(d.fields)) {
      if (!campo.startsWith("utm_")) continue;
      const limpo = (valor || "").trim();
      if (limpo) corpo[campo] = limpo;
    }

    return corpo;
  };
}

/**
 * Qual das duas turmas de 2026 ela quer, e como prefere pagar. ⚠️ A forma de
 * pagamento entrou em 15/09, junto com o Pix: é ela que decide para qual dos
 * dois checkouts a pessoa é mandada (lib/lp-funil.ts).
 */
export const montarCorpoBeauty = montarCorpoDeFechamento(TAG_BEAUTY, ["turma", "pagamento"]);

/**
 * Pix ou cartão. ⚠️ Este campo não é só informação: é ele que decide para qual
 * dos dois checkouts a pessoa é mandada (REDIRECT_POR_ESCOLHA em
 * app/api/elementor-form/route.ts).
 */
export const montarCorpoRemove = montarCorpoDeFechamento(TAG_REMOVE, ["pagamento"]);

/**
 * A página do Start vende DUAS formações, então aqui a turma não é só a data:
 * é ela que diz ao comercial qual das duas a pessoa quis. Junto com a forma de
 * pagamento, é também o par que escolhe o checkout (lib/redirect-escolha.ts).
 */
export const montarCorpoStart = montarCorpoDeFechamento(TAG_START, ["turma", "pagamento"]);

/**
 * Qual corpo esta página manda ao CRM.
 *
 * ⚠️ FONTE ÚNICA: a captura (/api/elementor-form) e o reenvio manual do painel
 * chamam ESTA função. A escolha morava só dentro da rota de captura, e o
 * reenvio reinventou um corpo mais pobre — passou de 13/08 a 10/09 mandando
 * lead sem as respostas de qualificação e sem a etiqueta do Transforma,
 * justamente no caminho que existe pra recuperar lead que não chegou lá.
 *
 * Um mapa, não uma cadeia de ifs: a segunda LP com funil próprio já chegou.
 */
const MONTADORES_POR_SLUG: Record<string, (d: DadosDoLead) => Record<string, string>> = {
  transforma: montarCorpoTransforma,
  "jaytransforma-beauty": montarCorpoBeauty,
  "jaytransforma-remove": montarCorpoRemove,
  "jaytransforma-start": montarCorpoStart,
};

export function corpoParaOCrm(d: DadosDoLead): Record<string, string> {
  // hasOwn: o slug vem da URL, não pode alcançar o Object.prototype.
  const montar = Object.hasOwn(MONTADORES_POR_SLUG, d.slug)
    ? MONTADORES_POR_SLUG[d.slug]
    : montarCorpoDoLead;
  return montar(d);
}
