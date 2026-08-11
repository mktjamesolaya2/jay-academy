import type { Lead } from "./lead-campos";

/**
 * Um destino de lead: pra onde o lead vai depois de entrar no portal.
 *
 * Existe porque hoje cada formulário guarda UMA url de webhook, e o disparo
 * está escrito três vezes (formulários do portal, LPs Elementor, páginas WP).
 * Pra o lead cair no Clint E no CRM novo ao mesmo tempo — que é a situação da
 * transição — seria preciso editar formulário por formulário e mexer nos três
 * arquivos. Aqui o destino é cadastrado UMA vez e vale pra todo lead.
 *
 * O desenho segue o que o Clint já faz (link, mapeamento, tags, etapa,
 * status), porque é o vocabulário que o James conhece — e porque o CRM do
 * Lucas vai precisar das mesmas peças.
 */
export type Destino = {
  id: string;
  nome: string;
  url: string;
  ativo: boolean;
  /** ordem de exibição; não muda o envio (todos vão em paralelo) */
  ordem?: number;
  /**
   * Autenticação. `nenhuma` cobre o Clint (o segredo está na própria URL);
   * `bearer` e `header` cobrem praticamente todo CRM próprio.
   */
  auth?:
    | { tipo: "nenhuma" }
    | { tipo: "bearer"; valor: string }
    | { tipo: "header"; header: string; valor: string };
  /** nosso id de campo → nome do campo no destino */
  mapeamento: Record<string, string>;
  /** tags que TODO lead deste destino recebe, além das do próprio lead */
  tagsFixas?: string[];
  /** campos fixos que o destino exige (etapa, status, tipo de registro…) */
  extras?: Record<string, string>;
  /** só recebe lead destes formulários/páginas; vazio = recebe de todos */
  somenteDe?: string[];
};

/** Como foi a entrega em UM destino. Um por destino, e não um status só. */
export type Entrega = {
  destinoId: string;
  destinoNome: string;
  status: "ok" | "falhou" | "pulado";
  http?: number;
  erro?: string;
  em: string;
  tentativas: number;
};

/**
 * Monta o corpo que vai pro destino, já com os nomes que ELE usa.
 *
 * Campo vazio não entra: CRM que valida formato costuma recusar o lead inteiro
 * por causa de um "" num campo de CPF ou de data.
 */
export function montarPayload(
  lead: Lead,
  mapeamento: Record<string, string>,
  extras: Record<string, string> = {}
): Record<string, unknown> {
  const valores: Record<string, unknown> = {
    id: lead.id,
    nome: lead.nome,
    email: lead.email,
    telefone: lead.telefone,
    enviado_em: lead.enviado_em,
    tags: lead.tags,
    ...lead.campos,
  };

  const corpo: Record<string, unknown> = {};
  for (const [nosso, valor] of Object.entries(valores)) {
    if (valor === undefined || valor === null || valor === "") continue;
    if (Array.isArray(valor) && valor.length === 0) continue;
    corpo[mapeamento[nosso] ?? nosso] = valor;
  }
  // extras (etapa, status, tipo) são do destino e mandam sobre o mapeamento
  return { ...corpo, ...extras };
}

/** O destino aceita este lead? (filtro por origem) */
export function aceita(destino: Destino, origem: string): boolean {
  if (!destino.ativo) return false;
  if (!destino.somenteDe?.length) return true;
  return destino.somenteDe.includes(origem);
}

/** Cabeçalhos da requisição, já com a autenticação do destino. */
export function cabecalhos(destino: Destino): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const a = destino.auth;
  if (a?.tipo === "bearer") h["Authorization"] = `Bearer ${a.valor}`;
  if (a?.tipo === "header" && a.header) h[a.header] = a.valor;
  return h;
}

/** O corpo que vai pra ESTE destino: mapeamento + tags fixas + extras. */
export function corpoPara(destino: Destino, lead: Lead): Record<string, unknown> {
  const tags = [...new Set([...(lead.tags ?? []), ...(destino.tagsFixas ?? [])])];
  return montarPayload({ ...lead, tags }, destino.mapeamento, destino.extras ?? {});
}

/**
 * Esconde o segredo antes de gravar em log ou mostrar na tela.
 * O link do Clint É o segredo (não tem token separado), então some quase todo.
 */
export function urlSegura(url: string): string {
  try {
    const u = new URL(url);
    const partes = u.pathname.split("/").filter(Boolean);
    const ultimo = partes.pop() ?? "";
    const mascara = ultimo.length > 8 ? `${ultimo.slice(0, 4)}…${ultimo.slice(-4)}` : "…";
    return `${u.host}/${partes.join("/")}${partes.length ? "/" : ""}${mascara}`;
  } catch {
    return "(url inválida)";
  }
}
