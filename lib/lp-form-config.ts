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
  /**
   * A tag do formulário — o que diz de QUAL formulário o lead veio.
   *
   * ⚠️ É ela que decide o roteiro e as mensagens prontas do comercial. No Clint
   * cada formulário tinha seu webhook e a tag vinha do webhook. No CRM ela
   * viaja no envio, como `utm_source`: o próprio campo "Rótulo de origem" diz
   * *"quando a página manda utm_source, ele vence"*.
   *
   * É por isso que 6 webhooks bastam (um por funil, porque Etapa e Responsável
   * são por webhook) em vez de um por formulário.
   */
  tag?: string;
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
  if (cfg.codigoCrm && cfg.codigoCrm.trim())
    clean.codigoCrm = cfg.codigoCrm.trim();
  if (cfg.tag && cfg.tag.trim()) clean.tag = cfg.tag.trim();
  await kvSet(keyFor(slug), clean);
}
