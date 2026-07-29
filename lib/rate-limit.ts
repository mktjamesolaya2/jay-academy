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
  return rateLimitByIp(bucket, clientIp(req), limit, windowSec);
}

/**
 * Mesma janela fixa, mas recebendo o IP direto — pras **server actions**, que
 * não têm um `Request` em mãos (o IP sai do `headers()` do next/headers, ver
 * `clientIpFromHeaders`).
 */
export async function rateLimitByIp(
  bucket: string,
  ip: string,
  limit: number,
  windowSec: number
): Promise<{ ok: boolean; count: number }> {
  const key = `ratelimit:${bucket}:${ip}`;
  const count = await kvIncr(key, windowSec);
  return { ok: count <= limit, count };
}

/**
 * IP do cliente dentro de uma server action. Reusa a mesma leitura de
 * `x-forwarded-for`/`x-real-ip` do `clientIp`, só que a partir do `headers()`
 * do next/headers em vez de um `Request`.
 */
export async function clientIpFromHeaders(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}
