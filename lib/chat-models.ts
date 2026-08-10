/**
 * A cadeia de modelos do chat do PMU CLASS.
 *
 * ⚠️ SUGESTÃO "ajustar bug I.A pmuclass" (João, 17/07/2026).
 *
 * O que estava errado: dois dos quatro IDs da cadeia NÃO EXISTEM mais na
 * OpenRouter — `deepseek/deepseek-v4-flash:free` e
 * `meta-llama/llama-3.3-70b-instruct:free`. Como eles vinham em 1º e 2º lugar,
 * toda pergunta do visitante fazia duas chamadas HTTP que falhavam antes de
 * chegar num modelo válido: resposta lenta sempre, e erro
 * "todos os modelos estão indisponíveis" toda vez que os gratuitos que sobram
 * estavam saturados.
 *
 * ID de modelo não é estável: a OpenRouter aposenta modelo sem aviso, e o
 * código só descobre em produção porque a falha é silenciosa (o `catch`
 * engole e tenta o próximo). Por isso existe `npm run checar-modelos`, que
 * confere esta lista contra o catálogo público da OpenRouter — sem precisar
 * de chave. Rodar quando o chat começar a ficar lento ou a falhar.
 */
export const MODEL_CHAIN = [
  // 262k de contexto, responde bem em português
  "google/gemma-4-31b-it:free",
  // fallback de outro fornecedor: se o Google estiver saturado, este não está
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "openai/gpt-oss-20b:free",
  // roteador automático da própria OpenRouter — último recurso
  "openrouter/free",
] as const;

/** Só o formato: `fornecedor/modelo` ou `fornecedor/modelo:tag`. */
export function idDeModeloValido(id: string): boolean {
  return /^[a-z0-9._-]+\/[a-z0-9._-]+(:[a-z0-9-]+)?$/i.test(id);
}
