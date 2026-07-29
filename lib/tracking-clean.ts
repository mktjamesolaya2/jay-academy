// Remoção de tags de rastreamento do HTML — funções PURAS (sem server-only,
// sem KV), testadas em lib/tracking-clean.test.ts.
//
// Existem porque o portal deixou de aplicar o mesmo tracking em toda página
// (29/07): o pixel DSTV vale só nas LPs de curso online e o GTM só na
// /magicshadow. Só PARAR de injetar não bastava — parte das páginas traz tag
// gravada no próprio HTML: as migradas do WordPress vêm com os pixels do Pixel
// Cat, e três LPs de lp-html/ têm o container GTM ANTIGO embutido.

/**
 * Remove o Google Tag Manager do HTML — qualquer container, injetado ou
 * embutido. Casa pelo endereço do script (`googletagmanager.com/gtm.js`) e
 * pelo iframe do `ns.html` no noscript, então não depende do ID.
 *
 * NÃO toca no gtag.js do GA4 (`googletagmanager.com/gtag/js`), que é outra
 * tag e continua valendo em todas as páginas.
 */
export function stripGoogleTagManager(html: string): string {
  let out = html;

  // <script> … googletagmanager.com/gtm.js … </script>
  out = out.replace(
    /<script\b[^>]*>(?:(?!<\/script>)[\s\S])*?googletagmanager\.com\/gtm\.js(?:(?!<\/script>)[\s\S])*?<\/script>/gi,
    ""
  );
  // <noscript> … ns.html?id=GTM-… … </noscript>
  out = out.replace(
    /<noscript\b[^>]*>(?:(?!<\/noscript>)[\s\S])*?googletagmanager\.com\/ns\.html(?:(?!<\/noscript>)[\s\S])*?<\/noscript>/gi,
    ""
  );
  // Comentários de cortesia que sobram soltos (nossos e os do plugin do WP).
  out = out.replace(/<!--\s*(End\s+)?Google Tag Manager(\s*\(noscript\))?\s*-->/gi, "");

  return out;
}

/**
 * Remove os `fbq('init', '<id>')` cujo id NÃO está em `keepIds`, junto com os
 * `<img>`/`<noscript>` de `facebook.com/tr?id=<id>` desses mesmos ids.
 * Com `keepIds` vazio, remove TODOS — a página fica sem pixel.
 *
 * De propósito NÃO mexe em `fbq('track', …)` nem no stub do `fbq`: sem `init`
 * nenhum evento chega ao Meta, e nenhum JS da página quebra por `fbq`
 * indefinido. Também é cirúrgico quanto ao que casa — HTML de LP tem números
 * de 16 dígitos que não são pixel (ex.: nome de arquivo de vídeo do
 * Instagram), então só `fbq('init')` e `tr?id=` contam.
 */
export function stripPixelInits(html: string, keepIds: string[]): string {
  const keep = new Set(keepIds);
  let out = html;

  // fbq( 'init' , '1234' )  — com ou sem espaços, aspas simples ou duplas, e
  // engolindo o ponto-e-vírgula à direita quando houver.
  out = out.replace(
    /fbq\s*\(\s*(['"])init\1\s*,\s*(['"])(\d+)\2[^)]*\)\s*;?/gi,
    (match, _q1, _q2, id: string) => (keep.has(id) ? match : "")
  );

  // <noscript>…<img src="https://www.facebook.com/tr?id=1234&…">…</noscript>
  out = out.replace(
    /<noscript\b[^>]*>(?:(?!<\/noscript>)[\s\S])*?facebook\.com\/tr\/?\?id=(\d+)(?:(?!<\/noscript>)[\s\S])*?<\/noscript>/gi,
    (match, id: string) => (keep.has(id) ? match : "")
  );
  // …e o <img> avulso, fora de noscript.
  out = out.replace(
    /<img\b[^>]*facebook\.com\/tr\/?\?id=(\d+)[^>]*>/gi,
    (match, id: string) => (keep.has(id) ? match : "")
  );

  return out;
}
