// Helpers PUROS do rate-limit (sem server-only nem KV) — testáveis com
// node --test. A parte que toca o KV (rateLimit) fica em lib/rate-limit.ts.

/** IP do cliente a partir do x-forwarded-for (primeiro da lista). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Resposta 429 padrão. */
export function tooManyRequests(): Response {
  return new Response(
    JSON.stringify({ error: "Muitas requisições. Tente de novo em instantes." }),
    { status: 429, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * Rejeita corpos grandes demais pelo header Content-Length (barato, antes de
 * ler o body). Retorna true se está acima do limite.
 */
export function payloadTooLarge(req: Request, maxBytes: number): boolean {
  const len = Number(req.headers.get("content-length") || "0");
  return len > maxBytes;
}

/**
 * Confere se o request veio do mesmo site (Origin/Referer batem com o host da
 * requisição). Usado nos endpoints que só o nosso próprio front deve chamar
 * (ex: /api/meta-capi). Sem Origin nem Referer → trata como suspeito (false),
 * exceto se `allowEmpty`.
 */
export function isSameOrigin(req: Request, allowEmpty = false): boolean {
  const host = req.headers.get("host");
  if (!host) return false;
  const src = req.headers.get("origin") || req.headers.get("referer");
  if (!src) return allowEmpty;
  try {
    return new URL(src).host === host;
  } catch {
    return false;
  }
}
