/**
 * Formatters de data/hora travados no fuso de São Paulo.
 *
 * O server da Vercel roda em UTC. Sem timezone explícito,
 * `new Date(iso).toLocaleString("pt-BR")` renderiza UTC no
 * Server Component — 3h adiantado pro James no horário padrão.
 */

const BR_TZ = "America/Sao_Paulo";

export function formatDateTimeBR(iso: string | undefined | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      timeZone: BR_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export function formatDateBR(iso: string | undefined | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      timeZone: BR_TZ,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
