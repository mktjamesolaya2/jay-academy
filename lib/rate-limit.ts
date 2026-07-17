import "server-only";
import { kvIncr } from "./storage";
import { clientIp } from "./rate-limit-core";

// Re-exporta os helpers puros pra os endpoints importarem de um lugar só.
export {
  clientIp,
  tooManyRequests,
  payloadTooLarge,
  isSameOrigin,
} from "./rate-limit-core";

/**
 * Rate-limit de janela fixa por IP, ancorado no KV (kvIncr + expire). Sem
 * dependência externa. No dev (sem KV) é no-op — sempre `ok:true`.
 *
 * @param bucket  nome do endpoint (namespace da chave)
 * @param limit   máximo de requests na janela
 * @param windowSec  tamanho da janela em segundos
 */
export async function rateLimit(
  bucket: string,
  req: Request,
  limit: number,
  windowSec: number
): Promise<{ ok: boolean; count: number }> {
  const ip = clientIp(req);
  const key = `ratelimit:${bucket}:${ip}`;
  const count = await kvIncr(key, windowSec);
  return { ok: count <= limit, count };
}
