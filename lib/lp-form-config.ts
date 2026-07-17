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
};

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
  await kvSet(keyFor(slug), clean);
}
