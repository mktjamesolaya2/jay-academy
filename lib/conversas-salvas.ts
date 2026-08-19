/**
 * As conversas que a aluna já teve, guardadas no navegador dela.
 *
 * ⚠️ James: *"a conversa ficar salva no chat, para assim toda vez não ficar
 * iniciando uma conversa nova"*. Hoje ela fecha a aba e perde tudo — inclusive
 * o protocolo, que era justamente o que ligava ela ao atendimento.
 *
 * ⚠️ Fica no **navegador**, não numa conta. A página de ajuda não tem login (de
 * propósito: pedir cadastro pra quem já está com problema é o jeito mais rápido
 * de ela desistir). Então o navegador é o único lugar onde "as minhas
 * conversas" existe.
 *
 * ⚠️ O id da conversa é a CREDENCIAL dela — quem tem o id lê a conversa. Por
 * isso ele mora só aqui, no computador dela, e nunca numa URL que ela possa
 * mandar pra alguém sem perceber.
 */

const CHAVE = "jay-ajuda-conversas";
const QUANTAS = 10;

export type ConversaSalva = {
  id: string;
  /** Com o que ela chegou — é como ela reconhece a conversa na lista. */
  assunto: string;
  em: string;
};

/**
 * Lê a lista.
 *
 * ⚠️ Tudo dentro de try: navegador em aba anônima, ou com cookies bloqueados,
 * **lança exceção** ao tocar no localStorage. Sem isto, o chat inteiro morreria
 * na abertura — e justamente pra quem já navega de um jeito mais restrito.
 */
export function lerConversas(): ConversaSalva[] {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return [];
    const lista = JSON.parse(cru) as ConversaSalva[];
    return Array.isArray(lista) ? lista.filter((c) => c && typeof c.id === "string") : [];
  } catch {
    return [];
  }
}

/** Guarda (ou atualiza) uma conversa no topo da lista. */
export function salvarConversa(nova: ConversaSalva): ConversaSalva[] {
  const lista = [nova, ...lerConversas().filter((c) => c.id !== nova.id)].slice(0, QUANTAS);
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // Sem espaço ou sem permissão. A conversa da vez continua funcionando na
    // tela — só não vai estar aqui da próxima vez.
  }
  return lista;
}

/**
 * O nome da conversa na lista.
 *
 * ⚠️ A primeira coisa que ELA escreveu, não a resposta da IA. É o que ela
 * reconhece — "não consigo acessar meu curso" diz muito mais do que
 * "Boa noite! Aqui é o suporte".
 */
export function assuntoDaConversa(mensagens: Array<{ de: string; texto: string }>): string {
  const dela = mensagens.find((m) => m.de === "aluno" && m.texto.trim());
  const t = (dela?.texto ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "Conversa";
  return t.length <= 42 ? t : t.slice(0, 42).replace(/\s+\S*$/, "") + "…";
}

/** "hoje", "ontem", ou a data — do jeito que gente fala. */
export function quando(iso: string, agora = new Date()): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((dia(agora) - dia(d)) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
