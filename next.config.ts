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
  /**
   * O Chrome sem tela precisa ficar FORA do empacotamento.
   *
   * ⚠️ O `@sparticuz/chromium` carrega um binário do Chrome dentro dele. O
   * empacotador do Next reescreve os caminhos dos arquivos que processa — e
   * aí o pacote procura o binário em `/var/task/node_modules/@sparticuz/
   * chromium/bin`, que não existe mais porque foi movido. O erro que aparece
   * é exatamente esse, e a própria mensagem manda externalizar.
   *
   * ⚠️ Só quebra em PRODUÇÃO: no computador do James o código usa o Chrome
   * já instalado, então o problema nunca aparece local — foi por isso que
   * passou batido.
   */
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
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
      // Assets da /protocolo-labial (evento com tráfego pago, velocidade conta pra
      // entrega do Facebook). Sem isto o public/ sai com max-age=0 e o celular
      // revalida toda imagem em toda visita. ⚠️ Trocou uma imagem? Troque o NOME
      // do arquivo — o navegador segura a antiga por até 7 dias. A borda da
      // Vercel é por deploy, então lá o deploy novo já renova.
      {
        source: "/lp/protocolo-labial/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/lp/protocolo-labial/fonts/:file",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Mesma regra pra /inmersion-pelo-a-pelo-v2 (evento com tráfego pago): as versões leves
      // das fotos, os vídeos de 480px e as fontes. Mesmo aviso: trocou um arquivo, troque o nome.
      {
        source: "/lp/inmersion-pelo-a-pelo-v2/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/lp/inmersion-pelo-a-pelo-v2/fonts/:file",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
