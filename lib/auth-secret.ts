// Segredo de assinatura do JWT (cookie jay_session), compartilhado por
// lib/auth.ts e middleware.ts. ANTES tinha um fallback público hardcoded em
// dois lugares — se produção subisse sem AUTH_SECRET, qualquer um assinava um
// JWT como senior. Agora: em produção a env é OBRIGATÓRIA (falha no load); em
// dev cai num default marcado com aviso.

const DEV_SECRET = "jayacademy-dev-secret-change-in-production-please";

const rawSecret = process.env.AUTH_SECRET;

// Fail-fast SÓ no ambiente Vercel (deploy real) — `process.env.VERCEL` é setado
// lá no build e no runtime. Um `next build` local roda com NODE_ENV=production
// mas sem VERCEL, então não pode derrubar o build de teste; cai no dev default.
if (process.env.VERCEL && !rawSecret) {
  throw new Error(
    "AUTH_SECRET não configurada na Vercel — o login seria forjável. " +
      "Defina AUTH_SECRET nas Environment Variables do projeto."
  );
}

if (!rawSecret) {
  console.warn(
    "[auth] AUTH_SECRET não definida — usando segredo de DEV. NUNCA use isso em produção."
  );
}

export const AUTH_SECRET = new TextEncoder().encode(rawSecret || DEV_SECRET);
