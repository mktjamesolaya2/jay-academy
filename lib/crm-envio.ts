/**
 * Monta o corpo do lead que vai pro CRM.
 *
 * ⚠️ Isto é uma função pura, separada e testada, por causa de um erro que custou
 * caro em 13/08/2026: eu mandei o James testar dizendo que a tag ia no envio,
 * ela **não foi**, e a partir do corpo que chegou lá (`name, nome, email,
 * telefone, pagina` — sem tag) eu concluí que *"o CRM ignora a tag"*. Cheguei a
 * remover o campo da tela por causa dessa conclusão errada. O Lucas é que
 * apontou: *"o webhook não estava ignorando o utm_source — ele nunca chegou"*.
 *
 * A lição não é "prestar mais atenção": é que o corpo do envio precisa ser
 * verificável sem depender de um teste manual no CRM de produção. Os testes
 * deste arquivo olham o objeto que sai.
 */

export type DadosDoLead = {
  /** Campos crus do formulário, já normalizados (sem `form_fields[...]`). */
  fields: Record<string, string>;
  name: string;
  email: string;
  whatsapp: string;
  /** Slug da página de origem. */
  slug: string;
  /** A etiqueta desta página no CRM. */
  tag?: string | null;
};

export function montarCorpoDoLead(d: DadosDoLead): Record<string, string> {
  const corpo: Record<string, string> = {
    // Os campos crus vêm PRIMEIRO: os normalizados têm que vencer. Na ordem
    // inversa, um campo do formulário com o mesmo nome sobrescrevia o valor
    // já tratado.
    ...d.fields,
    nome: d.name,
    email: d.email,
    telefone: d.whatsapp,
    pagina: d.slug,
  };

  // A tag vira etiqueta no contato — o CRM cria na hora se ainda não existir.
  // É ela que diz de QUAL formulário o lead veio; a tag fixa da integração diz
  // de qual funil. As duas somam.
  const tag = d.tag?.trim();
  if (tag) corpo.tag = tag;

  return corpo;
}
