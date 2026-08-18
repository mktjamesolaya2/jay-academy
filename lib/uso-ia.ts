/**
 * Quanto da cota grátis do dia já foi.
 *
 * ⚠️ Isto existe porque a cota grátis **acaba**, e quando acaba a aluna é quem
 * descobre: a IA para de responder e a conversa cai pra uma pessoa. A cota da
 * OpenRouter (~50/dia) acabou no primeiro dia de teste, sem ninguém perceber
 * até alguém abrir a tela.
 *
 * ⚠️ O número de baixo (o limite) é um **palpite configurável**, não uma
 * verdade: o Google não tem endpoint de "quanto sobrou". Quem manda de verdade
 * é o `estourou` — esse vem do 429 que o próprio fornecedor devolveu. Por isso
 * o nível olha os dois, e o 429 ganha do palpite.
 */

/**
 * O teto do dia.
 *
 * 250 é o piso da camada grátis dos modelos flash — o número mais conservador
 * da cadeia. Errar pra baixo faz a barra assustar cedo; errar pra cima faz ela
 * mentir que está tranquilo. Cedo é melhor.
 */
export const LIMITE_PADRAO = 250;

export function limiteDoDia(env: Record<string, string | undefined> = process.env): number {
  const n = Number((env.IA_LIMITE_DIA ?? "").trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : LIMITE_PADRAO;
}

/**
 * A chave do dia, no fuso de quem olha a tela.
 *
 * ⚠️ Fuso de São Paulo de propósito. A cota do Google vira à meia-noite do
 * Pacífico, mas quem lê esta barra é o time daqui — se ela zerasse às 4 da
 * manhã, "hoje" na tela não seria o hoje dele. A barra é pra ele se situar,
 * não pra ser um contador fiscal da cota do Google.
 */
export function chaveDoDia(agora: Date): string {
  const d = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
  return `suporte:uso:${d}`;
}

/** Quanto da barra encheu. Nunca passa de 100 — barra vazando fica feia. */
export function percentual(usadas: number, limite: number): number {
  if (!(limite > 0)) return 0;
  const p = (Math.max(0, usadas) / limite) * 100;
  return Math.min(100, Math.round(p));
}

export type Nivel = "tranquilo" | "chegando" | "estourou";

/**
 * Em que pé está.
 *
 * ⚠️ `estourou` vindo do 429 ganha de qualquer conta: o fornecedor já disse
 * "chega", e discutir com ele pelo palpite do limite seria mostrar "tranquilo"
 * numa hora em que a IA não está respondendo ninguém.
 */
export function nivel(usadas: number, limite: number, estourou = false): Nivel {
  if (estourou) return "estourou";
  const p = percentual(usadas, limite);
  if (p >= 100) return "estourou";
  return p >= 70 ? "chegando" : "tranquilo";
}

/** O que a barra escreve embaixo. */
export function recado(usadas: number, limite: number, estourou = false): string {
  if (estourou) {
    return "A cota grátis de hoje acabou — a IA não está respondendo. As conversas estão indo direto pra uma pessoa.";
  }
  const sobra = Math.max(0, limite - usadas);
  if (nivel(usadas, limite) === "chegando") {
    return `Faltam ${sobra} mensagens pra cota de hoje acabar.`;
  }
  return `${usadas} de ${limite} mensagens da IA hoje.`;
}
