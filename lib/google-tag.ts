// Google Tag Manager — container do marketing (Gabriel): GTM-TVLJSVJZ.
// Injeta o GTM no <head> + o noscript logo após o <body>. As páginas WP
// importadas já trazem o GTM ANTIGO do WordPress (GTM-NN5KDTCB) → migramos
// pro container novo em vez de somar uma segunda tag (a orientação do Google
// é ter só 1 tag do Google por página). O GA4 (G-K3K6P8N1E9) é configurado
// DENTRO do GTM pelo marketing — não precisa colar o gtag separado.

export const GTM_ID = "GTM-TVLJSVJZ";
const OLD_GTM_ID = "GTM-NN5KDTCB";

/** Garante o GTM-TVLJSVJZ na página (migrando o antigo, ou injetando fresco). */
export function withGoogleTag(html: string): string {
  if (html.includes(OLD_GTM_ID)) {
    return html.split(OLD_GTM_ID).join(GTM_ID);
  }
  if (html.includes(GTM_ID)) return html;

  const headTag =
    `<!-- Google Tag Manager -->` +
    `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':` +
    `new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],` +
    `j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=` +
    `'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);` +
    `})(window,document,'script','dataLayer','${GTM_ID}');</script>` +
    `<!-- End Google Tag Manager -->`;
  const bodyTag =
    `<!-- Google Tag Manager (noscript) --><noscript><iframe ` +
    `src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" ` +
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
