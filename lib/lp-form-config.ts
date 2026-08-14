import "server-only";
import { kvGet, kvSet } from "./storage";

// Configuração de formulário por LP de lp-html/ (slug do route handler).
// As LPs estáticas não têm gêmea no KV com webhook/redirect configuráveis —
// antes o lead só era gravado, sem notificar Clint/Zapier. Aqui o senior/admin
// define um webhook por LP; o /api/elementor-form lê isto (prioridade sobre a
// gêmea, se existir).

export type LpFormConfig = {
  formWebhookUrl?: string;
  formRedirectUrl?: string;
  /**
   * O código que o CRM gera pra página — formulário + script, ou só o script.
   *
   * ⚠️ O CRM não entrega uma URL: entrega um BLOCO DE CÓDIGO pronto pra colar.
   * Guardar só a URL obrigaria a gente a remontar o script na mão e a adivinhar
   * o formato — e aí toda vez que o Lucas mudasse alguma coisa a gente
   * quebrava. Guardando o código como veio, o que ele entrega é o que roda.
   *
   * É injetado antes de `</body>` na hora de servir a página (lib/serve-lp.ts).
   */
  codigoCrm?: string;
};

// ⚠️ NÃO existe campo de etiqueta aqui, e é decisão do James (13/08/2026):
// *"tira esse negócio de etiqueta aí, porque a gente não etiqueta nada. É só
// CRM. Aqui no portal a gente não vai etiquetar nada."*
//
// Chegou a existir por meio dia. O CRM ganhou tags fixas por integração, então
// quem etiqueta é ele — uma webhook por tag, criada lá, e a chave colada aqui.
// O portal só entrega o lead na porta certa.

const keyFor = (slug: string) => `lp-form-config:${slug}`;

export async function getLpFormConfig(slug: string): Promise<LpFormConfig | null> {
  return await kvGet<LpFormConfig>(keyFor(slug));
}

export async function setLpFormConfig(
  slug: string,
  cfg: LpFormConfig
): Promise<void> {
  // Grava só o que veio preenchido; strings vazias apagam o campo.
  const clean: LpFormConfig = {};
  if (cfg.formWebhookUrl && cfg.formWebhookUrl.trim())
    clean.formWebhookUrl = cfg.formWebhookUrl.trim();
  if (cfg.formRedirectUrl && cfg.formRedirectUrl.trim())
    clean.formRedirectUrl = cfg.formRedirectUrl.trim();
  if (cfg.codigoCrm && cfg.codigoCrm.trim())
    clean.codigoCrm = cfg.codigoCrm.trim();
  await kvSet(keyFor(slug), clean);
}
