/**
 * O tempo que a resposta espera antes de aparecer.
 *
 * ⚠️ James: *"vamos colocar um intervalo de 3 a 5 segundos de resposta"*. O
 * motivo é humano, não técnico: resposta instantânea entrega que é robô, e uma
 * pessoa que acabou de contar um problema estranha ser respondida em 400ms.
 *
 * ⚠️ É um PISO, não uma soma. Se o modelo já demorou 6 segundos, ninguém espera
 * mais 4 — somar puniria justamente quem já esperou. A conta é: complete o
 * mínimo, ou apareça na hora se já passou dele.
 */

export const MIN_MS = 3000;
export const MAX_MS = 5000;

/**
 * Quanto ainda falta esperar.
 *
 * @param decorridoMs quanto já se passou desde o envio
 * @param sorteio     0..1 — de fora, pra poder testar sem sorte
 */
export function faltaEsperar(decorridoMs: number, sorteio = Math.random()): number {
  const alvo = MIN_MS + (MAX_MS - MIN_MS) * Math.min(1, Math.max(0, sorteio));
  return Math.max(0, Math.round(alvo - Math.max(0, decorridoMs)));
}
