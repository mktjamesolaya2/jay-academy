/**
 * O catálogo de campos de um lead — a lista completa, num lugar só.
 *
 * É a fonte de verdade pra três coisas: o que o portal guarda, o que a tela de
 * mapeamento oferece, e o que sai no payload pro CRM. Campo novo entra AQUI e
 * aparece sozinho nos três.
 *
 * A lista veio do que o Clint já tem hoje (James, 11/08), mais o que dá pra
 * saber sozinho na hora do envio (utm, página, anúncio).
 *
 * ⚠️ `de` é a parte que mais engana: só `formulario` e `automatico` chegam
 * sozinhos. Tudo que é `conversa` — barreira, se está disposta a investir,
 * perfil — nasce do atendimento, NÃO do formulário. Hoje os formulários do
 * portal pedem três coisas: nome, WhatsApp e e-mail. Prometer que o resto
 * chega preenchido é mentira; o que a gente pode garantir é que existe o campo
 * e que ele viaja inteiro quando alguém preencher.
 */

export type OrigemCampo =
  /** a pessoa digita no formulário */
  | "formulario"
  /** o portal sabe sozinho (página, utm, anúncio, data) */
  | "automatico"
  /** vem do atendimento/qualificação, depois do lead entrar */
  | "conversa";

export type CampoLead = {
  id: string;
  rotulo: string;
  grupo: "Contato" | "Empresa" | "Origem" | "Qualificação" | "Formação";
  de: OrigemCampo;
  /** nome mais comum desse campo em CRM — sugestão inicial do mapeamento */
  sugestao?: string;
};

export const CAMPOS_LEAD: CampoLead[] = [
  // ── Contato ────────────────────────────────────────────────────────────
  { id: "nome", rotulo: "Nome", grupo: "Contato", de: "formulario", sugestao: "name" },
  { id: "email", rotulo: "E-mail", grupo: "Contato", de: "formulario", sugestao: "email" },
  { id: "telefone", rotulo: "Telefone / WhatsApp", grupo: "Contato", de: "formulario", sugestao: "phone" },
  { id: "ddi", rotulo: "DDI (código do país)", grupo: "Contato", de: "formulario", sugestao: "country_code" },
  { id: "instagram", rotulo: "Instagram", grupo: "Contato", de: "conversa" },
  { id: "documento", rotulo: "Documento (CPF)", grupo: "Contato", de: "conversa", sugestao: "document" },
  { id: "cidade", rotulo: "Cidade", grupo: "Contato", de: "conversa", sugestao: "city" },
  { id: "estado", rotulo: "Estado", grupo: "Contato", de: "conversa", sugestao: "state" },

  // ── Empresa ────────────────────────────────────────────────────────────
  { id: "empresa", rotulo: "Nome da empresa", grupo: "Empresa", de: "conversa", sugestao: "company" },
  { id: "cnpj", rotulo: "CNPJ", grupo: "Empresa", de: "conversa" },
  { id: "cargo", rotulo: "Cargo", grupo: "Empresa", de: "conversa", sugestao: "role" },
  { id: "segmento", rotulo: "Segmento", grupo: "Empresa", de: "conversa" },

  // ── Origem (tudo isto o portal sabe sozinho) ───────────────────────────
  { id: "url", rotulo: "URL de origem", grupo: "Origem", de: "automatico", sugestao: "url" },
  { id: "pagina", rotulo: "Página / formulário", grupo: "Origem", de: "automatico", sugestao: "source" },
  { id: "utm_source", rotulo: "utm_source", grupo: "Origem", de: "automatico" },
  { id: "utm_medium", rotulo: "utm_medium", grupo: "Origem", de: "automatico" },
  { id: "utm_campaign", rotulo: "utm_campaign", grupo: "Origem", de: "automatico" },
  { id: "utm_content", rotulo: "utm_content", grupo: "Origem", de: "automatico" },
  { id: "utm_term", rotulo: "utm_term", grupo: "Origem", de: "automatico" },
  { id: "referrer", rotulo: "De onde veio (referrer)", grupo: "Origem", de: "automatico" },
  { id: "fbclid", rotulo: "Clique do Meta (fbclid)", grupo: "Origem", de: "automatico" },
  { id: "gclid", rotulo: "Clique do Google (gclid)", grupo: "Origem", de: "automatico" },
  { id: "enviado_em", rotulo: "Data do envio", grupo: "Origem", de: "automatico", sugestao: "submitted_at" },
  { id: "tags", rotulo: "Tags", grupo: "Origem", de: "automatico", sugestao: "tags" },

  // ── Qualificação (nasce do atendimento) ────────────────────────────────
  { id: "perfil", rotulo: "Perfil do lead", grupo: "Qualificação", de: "conversa" },
  { id: "resumo", rotulo: "Resumo completo", grupo: "Qualificação", de: "conversa" },
  { id: "notas", rotulo: "Notas do contato", grupo: "Qualificação", de: "conversa", sugestao: "notes" },
  { id: "conversa_url", rotulo: "Link da conversa (Menchat)", grupo: "Qualificação", de: "conversa" },
  { id: "barreira", rotulo: "Barreira principal", grupo: "Qualificação", de: "conversa" },
  { id: "investir", rotulo: "Disposta a investir", grupo: "Qualificação", de: "conversa" },
  { id: "interesse", rotulo: "Interesse principal", grupo: "Qualificação", de: "conversa" },
  { id: "momento", rotulo: "Modalidade e momento", grupo: "Qualificação", de: "conversa" },
  { id: "motivo", rotulo: "Por que quer se tornar", grupo: "Qualificação", de: "conversa" },
  { id: "frente", rotulo: "Frente principal de interesse", grupo: "Qualificação", de: "conversa" },

  // ── Formação (o vocabulário da casa) ───────────────────────────────────
  { id: "ja_atua", rotulo: "Já trabalha na área", grupo: "Formação", de: "conversa" },
  { id: "area_atual", rotulo: "Área atual de atuação", grupo: "Formação", de: "conversa" },
  { id: "estilo_sobrancelha", rotulo: "Estilo desejado da sobrancelha", grupo: "Formação", de: "conversa" },
  { id: "estrutura_formacao", rotulo: "Estrutura da formação desejada", grupo: "Formação", de: "conversa" },
  { id: "interesse_tecnico", rotulo: "Interesse técnico principal", grupo: "Formação", de: "conversa" },
];

export const CAMPO_POR_ID = new Map(CAMPOS_LEAD.map((c) => [c.id, c]));

/** Um lead: os campos do catálogo + o que vier de brinde, sem perder nada. */
export type Lead = {
  /** id estável — serve pra reenviar e pro CRM não duplicar */
  id: string;
  nome: string;
  email: string;
  telefone: string;
  enviado_em: string;
  tags: string[];
  /** qualquer outro campo do catálogo, e também os que ainda não existem nele */
  campos: Record<string, string>;
};

/**
 * Mapeamento padrão: nosso id → nome no CRM. É só o ponto de partida da tela de
 * integração; cada destino pode mudar o que quiser.
 */
export function mapeamentoSugerido(): Record<string, string> {
  const m: Record<string, string> = {};
  for (const c of CAMPOS_LEAD) m[c.id] = c.sugestao ?? c.id;
  return m;
}
