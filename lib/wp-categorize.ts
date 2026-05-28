import type { WpPage } from "./wp-api";

export function isCampaign(page: WpPage): boolean {
  const s = page.slug.toLowerCase();
  const t = page.title.toLowerCase();
  return (
    t.startsWith("[acao]") ||
    s.startsWith("acao-") ||
    s.startsWith("camp") ||
    /^(remove_|stbrows|stnano)/.test(s)
  );
}

export function suggestionForPage(page: WpPage): "copy" | "ignore" {
  const s = page.slug.toLowerCase();
  const t = page.title.toLowerCase();

  if (s === "inicio") return "copy";

  // Campanhas e testes A/B → ignorar
  if (
    t.startsWith("[acao]") ||
    s.startsWith("acao-") ||
    s.startsWith("camp") ||
    /^(remove_|stbrows|stnano)/.test(s)
  ) {
    return "ignore";
  }

  // Versões antigas/duplicadas → ignorar
  if (/(-up|-v1|-v2|-v1b|_v2|-promo)$/.test(s)) return "ignore";

  return "copy";
}
