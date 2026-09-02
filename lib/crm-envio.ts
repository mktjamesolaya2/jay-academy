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
 * O Transforma só precisa identificar o contato e registrar as respostas no
 * campo de observações do CRM. Campos desconhecidos pelo webhook viram
 * observações; por isso não enviamos perfil, curso ou resumo duplicados.
 */
export function montarCorpoTransforma(
  d: Pick<DadosDoLead, "fields" | "name" | "email" | "whatsapp">
): Record<string, string> {
  const prontidao = (d.fields.prontidao_proximo_passo || "").trim();
  const barreira = (d.fields.barreira_proximo_passo || "").trim();

  return {
    nome: d.name,
    email: d.email,
    telefone: d.whatsapp,
    tag: "JAY Transforma",
    ...(prontidao ? { prontidao_proximo_passo: prontidao } : {}),
    ...(barreira ? { barreira_proximo_passo: barreira } : {}),
  };
}
