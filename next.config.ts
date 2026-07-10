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
};

export default nextConfig;
