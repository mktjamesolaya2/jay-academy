/**
 * Quanto a IA respondeu hoje, e se ela ainda está de pé.
 *
 * ⚠️ Isto existe porque a cota grátis **acaba**, e quando acaba quem descobre
 * é a aluna: a IA para de responder e a conversa cai pra uma pessoa. A cota da
 * OpenRouter (~50/dia) acabou no primeiro dia de teste sem ninguém perceber.
 *
 * ⚠️ **Não existe teto conhecido.** O Google não tem endpoint de "quanto
 * sobrou", e eu não vou inventar um número e desenhar uma barra que finge
 * saber. Antes esta tela mostrava "de 250" — um chute meu, com cara de fato.
 * Se alguém souber o teto de verdade, põe em `IA_LIMITE_DIA` e a barra
 * aparece. Sem isso, mostra só o que é medido: quantas ela respondeu.
 *
 * ⚠️ O sinal vermelho vem do **429 do fornecedor**, e não de conta nossa. É a
 * única fonte que sabe mesmo.
 */

/**
 * O teto do dia, se alguém souber qual é.
 *
 * `null` = ninguém disse, e a tela não finge saber.
 */
export function limiteDoDia(
  env: Record<string, string | undefined> = process.env
): number | null {
  const n = Number((env.IA_LIMITE_DIA ?? "").trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

/**
 * A chave do dia, no fuso de quem olha a tela.
 *
 * ⚠️ Fuso de São Paulo de propósito. A cota do Google vira à meia-noite do
 * Pacífico, mas quem lê isto é o time daqui — se zerasse às 4 da manhã, "hoje"
 * na tela não seria o hoje dele.
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

/** Quanto da barra encheu — `null` quando não há teto pra comparar. */
export function percentual(usadas: number, limite: number | null): number | null {
  if (!limite || limite <= 0) return null;
  return Math.min(100, Math.round((Math.max(0, usadas) / limite) * 100));
}

export type Nivel = "tranquilo" | "chegando" | "parada";

/**
 * Em que pé está.
 *
 * ⚠️ `parada` significa **a IA não está respondendo agora** — não "passou de
 * um número". Quem diz isso é o fornecedor, recusando a fila inteira.
 */
export function nivel(
  usadas: number,
  limite: number | null,
  paradaPorCota = false
): Nivel {
  if (paradaPorCota) return "parada";
  const p = percentual(usadas, limite);
  if (p === null) return "tranquilo";
  if (p >= 100) return "parada";
  return p >= 70 ? "chegando" : "tranquilo";
}

/** O que a tela escreve embaixo do número. */
export function recado(
  usadas: number,
  limite: number | null,
  paradaPorCota = false
): string {
  if (paradaPorCota) {
    return "A cota grátis acabou — a I.A. parou de responder e as conversas estão indo direto pra uma pessoa.";
  }
  if (limite && nivel(usadas, limite) === "chegando") {
    return `Faltam ${Math.max(0, limite - usadas)} pro teto configurado.`;
  }
  if (limite) return `Teto configurado: ${limite} por dia.`;
  // ⚠️ Sem teto conhecido, a tela diz o que sabe e nada além disso.
  return usadas === 1 ? "1 resposta hoje. A I.A. está de pé." : "A I.A. está de pé.";
}
