/**
 * A caixa de entrada do time.
 *
 * ⚠️ A pergunta que esta tela precisa responder num piscar de olho não é
 * *"o que chegou agora?"* — é **"quem está esperando há mais tempo?"**. Essa é
 * a pessoa prestes a desistir e mandar "alguém aí???" (ou pedir reembolso).
 *
 * Por isso a ordem NÃO é a mais recente primeiro, que é o padrão de quase toda
 * caixa de mensagem. Quem espera vem primeiro, e entre eles o que espera há
 * mais tempo. Uma conversa nova que a IA já resolveu não tem pressa nenhuma.
 */

export type ConversaResumo = {
  id: string;
  quem: string;
  emailAluna?: string;
  aguardandoPessoa: boolean;
  mensagens: Array<{ de: string; texto: string; em: string }>;
  atualizadaEm: string;
};

export type LinhaDaCaixa = {
  id: string;
  quem: string;
  email?: string;
  esperando: boolean;
  /** A última coisa dita, cortada pra caber numa linha. */
  previa: string;
  /** Quem falou por último — se foi a aluna, ninguém respondeu ainda. */
  ultimaDe: string;
  /** Minutos desde a última mensagem. */
  minutos: number;
};

const MAX_PREVIA = 90;

/** Minutos entre dois instantes, nunca negativo. */
export function minutosDesde(iso: string, agora = new Date()): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.floor((agora.getTime() - t) / 60000));
}

/**
 * "há 5 min", "há 2 h", "há 3 dias".
 *
 * ⚠️ Em português de gente, não "5m" nem timestamp. Quem abre esta tela está
 * com pressa e precisa sentir o tamanho da espera, não decodificar.
 */
export function espera(minutos: number): string {
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const h = Math.floor(minutos / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "há 1 dia" : `há ${d} dias`;
}

/** Corta a prévia sem cortar palavra no meio nem deixar quebra de linha. */
export function previa(texto: string): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= MAX_PREVIA) return limpo;
  const corte = limpo.slice(0, MAX_PREVIA);
  const espaco = corte.lastIndexOf(" ");
  return (espaco > 40 ? corte.slice(0, espaco) : corte) + "…";
}

export function montarLinha(c: ConversaResumo, agora = new Date()): LinhaDaCaixa {
  const ultima = c.mensagens[c.mensagens.length - 1];
  return {
    id: c.id,
    quem: c.quem,
    email: c.emailAluna,
    esperando: c.aguardandoPessoa,
    previa: ultima ? previa(ultima.texto) : "(sem mensagens)",
    ultimaDe: ultima?.de ?? "aluno",
    minutos: minutosDesde(ultima?.em ?? c.atualizadaEm, agora),
  };
}

/**
 * A ordem da caixa.
 *
 * ⚠️ Quem espera uma pessoa vem primeiro — e entre eles, **o que espera há mais
 * tempo no topo**. Só depois vêm as conversas que a IA resolveu, essas sim da
 * mais recente pra mais antiga.
 */
export function ordenarCaixa(
  conversas: ConversaResumo[],
  agora = new Date()
): LinhaDaCaixa[] {
  return conversas
    .map((c) => montarLinha(c, agora))
    .sort((a, b) => {
      if (a.esperando !== b.esperando) return a.esperando ? -1 : 1;
      // Esperando: o mais antigo primeiro (está esperando há mais tempo).
      // Resolvido: o mais recente primeiro.
      return a.esperando ? b.minutos - a.minutos : a.minutos - b.minutos;
    });
}

/** Quantas conversas têm gente esperando resposta. */
export function quantosEsperando(linhas: LinhaDaCaixa[]): number {
  return linhas.filter((l) => l.esperando).length;
}
