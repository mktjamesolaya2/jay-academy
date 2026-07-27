// Guarda contra SSRF: bloqueia hosts internos/privados que um admin possa colar
// sem querer (ex: metadata de nuvem, loopback, rede interna).
// Recebe o hostname já PARSEADO (ex: new URL(url).hostname) — não uma URL inteira.

/** Um octeto (0-255) de IPv4, para checagens de range. */
function octet(parts: string[], i: number): number {
  const n = Number(parts[i]);
  return Number.isFinite(n) ? n : -1;
}

function isIpv4(hostname: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
}

function isBlockedIpv4(hostname: string): boolean {
  if (!isIpv4(hostname)) return false;
  const parts = hostname.split(".");
  const a = octet(parts, 0);
  const b = octet(parts, 1);

  if (hostname === "0.0.0.0") return true;
  if (a === 127) return true; // loopback 127.0.0.0/8
  if (a === 169 && b === 254) return true; // link-local / metadata 169.254.0.0/16
  if (a === 10) return true; // RFC1918 10.0.0.0/8
  if (a === 192 && b === 168) return true; // RFC1918 192.168.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918 172.16.0.0/12

  return false;
}

function isBlockedIpv6(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "::1") return true; // loopback
  if (h.startsWith("fe80:")) return true; // link-local
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique-local fc00::/7
  return false;
}

/** true = host interno/privado, deve ser bloqueado antes de fazer fetch. */
export function isBlockedHost(hostname: string): boolean {
  // Remove colchetes de IPv6 literal (ex: "[::1]" -> "::1").
  let host = hostname.trim();
  if (host.startsWith("[") && host.endsWith("]")) {
    host = host.slice(1, -1);
  }
  const lower = host.toLowerCase();

  if (lower === "localhost") return true;
  if (lower.endsWith(".local")) return true;
  if (lower === "metadata.google.internal") return true;

  if (isBlockedIpv4(lower)) return true;
  if (isBlockedIpv6(lower)) return true;

  return false;
}
