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
  mapeamento: ParDeCampo[];
  /** viajam como campo a mais — no CRM do Lucas isso vira nota do negócio */
  tags: string[];
};

/**
 * Endereço do endpoint público de lead do JAY.O CRM.
 *
 * ⚠️ Com `www`, e não é capricho: sem ele a URL responde com redirecionamento,
 * e requisição POST não é repetida depois de redirecionar — o lead sumiria em
 * silêncio. Está na documentação do Lucas e vale pro nosso envio também.
 */
export const BASE_CRM = "https://www.sistemajayo.com/api/integrations/site/lead/";

/** Aceita colar a chave sozinha (`pk_…`) ou a URL inteira. Devolve a URL. */
export function urlDoCrm(chaveOuUrl: string): string | null {
  const t = chaveOuUrl.trim().replace(/\s+/g, "");
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t.replace(/\/+$/, "");
  if (/^pk_[A-Za-z0-9_-]+$/.test(t)) return BASE_CRM + t;
  return null;
}

/** Mostra a chave sem entregá-la inteira em tela ou log. */
export function chaveSegura(chaveOuUrl: string): string {
  const t = chaveOuUrl.trim();
  const chave = t.split("/").pop() ?? t;
  return chave.length > 12 ? `${chave.slice(0, 7)}…${chave.slice(-4)}` : "…";
}

/**
 * Aplica o mapeamento no que chegou do formulário.
 *
 * Direção igual à do Clint e à do JAY.O: a chave é o nome do campo NO
 * FORMULÁRIO, o valor é o campo do CRM. O que não estiver mapeado passa direto
 * com o nome original — no CRM do Lucas todo campo a mais vira nota do negócio,
 * então perder campo é perder informação de graça.
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
    // a isca de robô nunca viaja: o CRM não tem o que fazer com ela
    if (normalizar(chave) === "_gotcha") continue;
    saida[regras.get(normalizar(chave)) ?? chave] = `${valor}`.trim();
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
 * O corpo que vai pro CRM, no formato que o endpoint do Lucas espera:
 * `nome`, `telefone`, `email` e o que mais vier — campo a mais vira nota, e
 * `utm_source` vira a origem do negócio. Etapa, responsável e rótulo de origem
 * NÃO vão aqui: eles ficam guardados na própria chave, configurados no CRM.
 */
export function corpoParaOCrm(
  cfg: ConfigIntegracao,
  lead: Lead,
  campos: Record<string, string>
): Record<string, string> {
  const corpo: Record<string, string> = {
    ...campos,
    nome: campos.nome || lead.nome,
    telefone: campos.telefone || lead.telefone,
  };
  const email = campos.email || lead.email;
  if (email) corpo.email = email;
  if (cfg.tags.length) corpo.tags = cfg.tags.join(", ");
  // dá pra reconhecer no CRM de qual página veio, mesmo sem utm
  if (!corpo.origem_formulario) corpo.origem_formulario = cfg.nome;
  for (const [k, v] of Object.entries(corpo)) if (!v) delete corpo[k];
  return corpo;
}

/**
 * Telefone é o que identifica a pessoa no CRM — sem ele a resposta é 422 e
 * nada é criado. Melhor saber disso ANTES de gastar a requisição.
 */
export function temTelefone(corpo: Record<string, string>): boolean {
  const t = (corpo.telefone ?? "").replace(/\D/g, "");
  return t.length >= 10;
}

/** Traduz a resposta do CRM pro que a pessoa precisa fazer. */
export function explicarResposta(http: number, corpo?: string): string {
  if (http === 422)
    return "O CRM recusou: telefone faltando ou sem DDD. Deixe o campo de telefone obrigatório na página.";
  if (http === 404)
    return "Chave não encontrada — o webhook foi desativado no CRM, ou a chave está errada.";
  if (http === 403)
    return "O CRM barrou a origem. Para envio pelo servidor, a lista de domínios liberados precisa ficar VAZIA no CRM.";
  if (http === 429)
    return "Limite de envios do CRM atingido (20/h por IP, 300/h por chave). Falar com o Lucas antes de subir campanha.";
  return corpo?.slice(0, 300) || `O CRM respondeu ${http}.`;
}
