import type { NextConfig } from "next";

// Magic Shadow, Laser, PMU CLASS e as LPs reconstruídas (recriadas/*) agora
// têm route handlers dedicados (app/<slug>/route.ts) que aplicam o
// rastreamento unificado (lib/meta-tracking.ts) — GTM, GA4 legado, Meta
// Pixel/CAPI. Por isso não usam mais rewrites pra public/: um arquivo
// servido puro do public/ não roda nenhum código Next, então não dava pra
// injetar tracking nele.

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  async headers() {
    // Headers de segurança globais. NÃO uso CSP estrita — as LPs embutem
    // scripts de terceiros (Meta Pixel, GTM, Hotmart) e uma CSP apertada
    // quebraria o tracking. Estes são seguros pra todas as rotas.
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];
    return [
      // Painel admin: bloqueia enquadramento (clickjacking). As LPs públicas
      // NÃO recebem X-Frame-Options — podem ser legitimamente embutidas.
      {
        source:
          "/:path(dashboard|analytics|forms|leads|lixeira|lps|midia|paginas|settings|sugestoes|websites|wordpress|wp-pages)/:rest*",
        headers: [...base, { key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      { source: "/:path*", headers: base },
    ];
  },
};

export default nextConfig;
