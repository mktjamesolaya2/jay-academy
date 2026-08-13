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

// ⚠️ NÃO existe campo de tag aqui, e é de propósito. Chegou a existir em
// 13/08/2026 — a ideia era mandar a tag como `utm_source` e usar uma webhook
// pra vários formulários. O teste na /ciafol-luz mostrou que o CRM **ignora**
// o utm_source do corpo: o negócio chegou com "Canal: FORMULARIO CONTEUDO",
// que é o nome da webhook. A anotação provou que o resto do corpo é lido
// ("Página: ciafol-luz" é campo nosso) — só a tag não.
//
// Decisão do James, e é a divisão certa: **o CRM cuida de webhook e tag, o
// portal só entrega o lead na porta certa**. Uma webhook por tag, criada no
// CRM, e a chave dela colada na página. Campo de tag aqui seria campo que não
// faz nada — e campo que não faz nada engana.

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
