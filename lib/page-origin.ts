// Fonte ÚNICA do rótulo de origem. Decide pela sourceKind — NUNCA pelo ternário
// domain==="main" hardcoded (que fazia cópia da web aparecer como WP).
export function pageOriginLabel(p: {
  sourceKind?: "wp" | "web";
  domain: string;
  sourceUrl?: string;
}): string {
  if (p.sourceKind === "web") {
    let host = p.domain;
    try {
      if (p.sourceUrl) host = new URL(p.sourceUrl).host.replace(/^www\./, "");
    } catch {}
    return `Copiada da web · ${host}`;
  }
  const wpHost = p.domain === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br";
  return `Migrada do WP · ${wpHost}`;
}
