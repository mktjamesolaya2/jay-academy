// Google Tag Manager — política POR PÁGINA: cada slug tem (ou não) o seu
// container. Injeta o GTM no <head> + o noscript logo após o <body>. O GA4
// (configurado DENTRO do container pelo marketing) não precisa do gtag
// separado; o gtag do fluxo "site" é injetado por lib/meta-tracking.ts.
//
// 29/07: o GTM deixou de ser global (decisão do James). Nas páginas fora do
// mapa abaixo o container é REMOVIDO ao servir (ver stripGoogleTagManager em
// lib/tracking-clean.ts), inclusive quando vem embutido no HTML — três LPs de
// lp-html/ trazem o container ANTIGO do WordPress (GTM-NN5KDTCB) gravado
// dentro. withTracking() SEMPRE limpa antes de injetar, então nunca sobra um
// container a mais nem o antigo.

/** Slug → container do GTM. Fora do mapa, a página não leva GTM. */
export const GTM_BY_SLUG: Record<string, string> = {
  // Container do marketing (Gabriel) — configura o GA4 G-K3K6P8N1E9 por dentro.
  magicshadow: "GTM-TVLJSVJZ",
  // Container da LP Basic Magic Shadow (pedido de 29/07).
  "basic-magic-shadow": "GTM-W394J499",
  // Container da LP Fio a Fio Realista (pedido de 29/07). Esta LP traz o
  // container ANTIGO do WP embutido no HTML — a limpeza do withTracking tira.
  "fio-a-fio-realista-by-james-olaya": "GTM-NB2WK5SJ",
  // As prévias v2 e v3 da mesma LP (pedido de 23/09): MESMO container da
  // oficial, de propósito — é o mesmo produto e o mesmo checkout; o marketing
  // separa as versões pela URL dentro do container.
  "fio-a-fio-realista-v2": "GTM-NB2WK5SJ",
  "fio-a-fio-realista-v3": "GTM-NB2WK5SJ",
  // Container da LP Método Shadow PRO (pedido de 30/07).
  "metodo-shadow-pro": "GTM-NGVQTHXT",
  // Evento JAY TRANSFORMA (pedido de 10/09): mesmo container do marketing da
  // magicshadow — o GA4 do evento é configurado por dentro dele.
  transforma: "GTM-TVLJSVJZ",
  // As três ofertas de fechamento do Transforma. Nasceram no container do
  // evento (a ideia era a jornada inteira cair no mesmo lugar), e em 14/09
  // ganharam um container CADA — cada página vende uma formação diferente, com
  // preço e checkout próprios, e misturar as conversões das três no container
  // do marketing tornava a medição de cada oferta ilegível.
  // ⚠️ Vizinhas de container diferente: a `transforma` acima continua no do
  // marketing, de propósito. Não "uniformizar" isto.
  "jaytransforma-beauty": "GTM-PX3XWDMW",
  "jaytransforma-remove": "GTM-N78J7X4K",
  "jaytransforma-start": "GTM-KH73NTJS",
};

/** Container padrão do marketing (referenciado nas notas e no CLAUDE.md). */
export const GTM_ID = GTM_BY_SLUG.magicshadow;

/** Qual container vale nesta página? `null` = página sem GTM. */
export function gtmIdForSlug(slug: string): string | null {
  // hasOwn: o slug vem da URL, não pode alcançar o Object.prototype ("constructor").
  return Object.hasOwn(GTM_BY_SLUG, slug) ? GTM_BY_SLUG[slug] : null;
}

/** Injeta o snippet do container `gtmId` (head + noscript), se ainda não presente. */
export function withGoogleTag(html: string, gtmId: string): string {
  if (html.includes(gtmId)) return html;

  const headTag =
    `<!-- Google Tag Manager -->` +
    `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':` +
    `new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],` +
    `j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=` +
    `'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);` +
    `})(window,document,'script','dataLayer','${gtmId}');</script>` +
    `<!-- End Google Tag Manager -->`;
  const bodyTag =
    `<!-- Google Tag Manager (noscript) --><noscript><iframe ` +
    `src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" ` +
    `style="display:none;visibility:hidden"></iframe></noscript><!-- End Google Tag Manager (noscript) -->`;

  let out = html;
  out = /<head[^>]*>/i.test(out)
    ? out.replace(/<head([^>]*)>/i, `<head$1>${headTag}`)
    : headTag + out;
  if (/<body[^>]*>/i.test(out)) {
    out = out.replace(/<body([^>]*)>/i, `<body$1>${bodyTag}`);
  }
  return out;
}
