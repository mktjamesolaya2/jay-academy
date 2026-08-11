import type { Lead } from "./lead-campos";

/**
 * As regras puras da integração: aplicar o mapeamento e montar o que vai pro
 * CRM. Fora do store (que é `server-only`) porque é a parte que decide se um
 * lead chega inteiro ou chega torto — e isso precisa de teste.
 */

export type ParDeCampo = { doFormulario: string; paraOCrm: string };

/** Como foi o repasse de um lead pro CRM. Fica junto do lead, no histórico. */
export type Entrega = {
  destinoId: string;
  destinoNome: string;
  status: "ok" | "falhou" | "pulado";
  http?: number;
  erro?: string;
  em: string;
  tentativas: number;
};

export type ConfigIntegracao = {
  nome: string;
  tipo: "negocio" | "contato";
  acao: "criar" | "atualizar" | "criar_ou_atualizar";
  mapeamento: ParDeCampo[];
  tags: string[];
  etapaCriacao?: string;
  etapaAtualizacao?: string;
  status?: string;
};

/**
 * Aplica o mapeamento no que chegou do formulário.
 *
 * Direção igual à do Clint: a chave é o nome do campo NO FORMULÁRIO, o valor é
 * o campo do CRM. O que não estiver mapeado passa direto com o nome original —
 * campo a mais nunca é motivo pra perder informação.
 *
 * Comparação sem diferenciar maiúscula, e aceitando `form_fields[name]` como
 * `name`, porque é assim que o Elementor manda.
 */
export function aplicarMapeamento(
  recebido: Record<string, string>,
  mapeamento: ParDeCampo[]
): Record<string, string> {
  const regras = new Map(
    mapeamento
      .filter((p) => p.doFormulario.trim() && p.paraOCrm.trim())
      .map((p) => [normalizar(p.doFormulario), p.paraOCrm.trim()])
  );

  const saida: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(recebido)) {
    if (valor === undefined || valor === null || `${valor}`.trim() === "") continue;
    const destino = regras.get(normalizar(chave));
    saida[destino ?? chave] = `${valor}`.trim();
  }
  return saida;
}

function normalizar(chave: string): string {
  return chave
    .trim()
    .toLowerCase()
    .replace(/^.*\[(.+)\]$/, "$1");
}

/**
 * O corpo que vai pro CRM.
 *
 * Leva junto o que a integração define — tipo de registro, o que fazer se já
 * existir, tags, etapa e status —, que é justamente o que o CRM precisa saber
 * pra colocar o lead no lugar certo, e não só quem é a pessoa.
 */
export function corpoParaOCrm(
  cfg: ConfigIntegracao,
  lead: Lead,
  campos: Record<string, string>
): Record<string, unknown> {
  const tags = [...new Set([...(lead.tags ?? []), ...(cfg.tags ?? [])])];
  const corpo: Record<string, unknown> = {
    id: lead.id,
    tipo: cfg.tipo,
    acao: cfg.acao,
    integracao: cfg.nome,
    recebido_em: lead.enviado_em,
    ...campos,
  };
  if (tags.length) corpo.tags = tags;
  if (cfg.etapaCriacao) corpo.etapa_criacao = cfg.etapaCriacao;
  if (cfg.etapaAtualizacao) corpo.etapa_atualizacao = cfg.etapaAtualizacao;
  if (cfg.status) corpo.status = cfg.status;
  return corpo;
}

/**
 * A integração consegue identificar a pessoa?
 *
 * O Clint exige e-mail e/ou telefone mapeados — é por eles que ele sabe se o
 * contato já existe. Sem isso, "atualizar" não tem como funcionar.
 */
export function identificaContato(mapeamento: ParDeCampo[]): boolean {
  const alvos = mapeamento.map((p) => p.paraOCrm.trim().toLowerCase());
  return alvos.includes("email") || alvos.includes("telefone");
}
