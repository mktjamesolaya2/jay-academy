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
 * Qual corpo esta página manda ao CRM.
 *
 * ⚠️ FONTE ÚNICA: a captura (/api/elementor-form) e o reenvio manual do painel
 * chamam ESTA função. A escolha morava só dentro da rota de captura, e o
 * reenvio reinventou um corpo mais pobre — passou de 13/08 a 10/09 mandando
 * lead sem as respostas de qualificação e sem a etiqueta do Transforma,
 * justamente no caminho que existe pra recuperar lead que não chegou lá.
 */
export function corpoParaOCrm(d: DadosDoLead): Record<string, string> {
  return d.slug === "transforma" ? montarCorpoTransforma(d) : montarCorpoDoLead(d);
}
