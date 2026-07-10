import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  async rewrites() {
    return [
      // Magic Shadow e Laser agora têm route handlers dinâmicos
      // (app/magicshadow/route.ts e app/laser/route.ts) que podem servir
      // versão editada do KV, com fallback pro filesystem. Por isso saíram
      // dos rewrites estáticos. PMU CLASS continua servido como skeleton
      // estático — o conteúdo editável é puxado em runtime via /api/lp-content.
      { source: "/pmuclass", destination: "/pmuclass/index.html" },
      // LPs reconstruídas (estáticas em /public/recriadas/<slug>) ficam na URL
      // limpa original da LP. Rewrites correm antes do [slug] dinâmico, então
      // não colidem com as páginas WP publicadas.
      { source: "/inmersion-pelo-a-pelo", destination: "/recriadas/inmersion-pelo-a-pelo/index.html" },
      // Profissão Remove — redesign servido de arquivo estático commitado
      // (deploya no git push). Rewrite corre antes do [slug] dinâmico (que
      // serviria a versão antiga do KV), então esta versão tem prioridade.
      { source: "/curso-online-profissao-remove", destination: "/recriadas/curso-online-profissao-remove/index.html" },
    ];
  },
};

export default nextConfig;
