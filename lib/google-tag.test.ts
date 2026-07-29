import { test } from "node:test";
import assert from "node:assert/strict";
import { GTM_ID, gtmIdForSlug, withGoogleTag } from "./google-tag.ts";
import { stripGoogleTagManager } from "./tracking-clean.ts";

const MAGIC = "GTM-TVLJSVJZ";
const BASIC = "GTM-W394J499";
const FIOAFIO = "GTM-NB2WK5SJ";
const OLD_WP = "GTM-NN5KDTCB";

// Container antigo do WordPress embutido no HTML de LP, com o
// `type="rocketlazyloadscript"` do WP-Rocket (igual ao que vem em produção).
const GTM_EMBUTIDO = `<script type="rocketlazyloadscript">(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${OLD_WP}');</script>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${OLD_WP}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;

// ---------------------------------------------------------------------------
// gtmIdForSlug
// ---------------------------------------------------------------------------

test("gtmIdForSlug devolve o container de cada página", () => {
  assert.equal(gtmIdForSlug("basic-magic-shadow"), BASIC);
  assert.equal(gtmIdForSlug("magicshadow"), MAGIC);
  assert.equal(gtmIdForSlug("fio-a-fio-realista-by-james-olaya"), FIOAFIO);
});

test("gtmIdForSlug devolve null nas páginas sem GTM", () => {
  assert.equal(gtmIdForSlug("basic-nanofios"), null);
  assert.equal(gtmIdForSlug("pdv-lips-sense-technique"), null);
  assert.equal(gtmIdForSlug(""), null);
});

test("gtmIdForSlug não herda propriedades do Object.prototype", () => {
  assert.equal(gtmIdForSlug("constructor"), null);
  assert.equal(gtmIdForSlug("toString"), null);
});

test("GTM_ID é o container do marketing (/magicshadow)", () => {
  assert.equal(GTM_ID, MAGIC);
});

// ---------------------------------------------------------------------------
// withGoogleTag
// ---------------------------------------------------------------------------

test("withGoogleTag injeta o container pedido no head e o noscript no body", () => {
  const out = withGoogleTag(
    `<html><head><title>x</title></head><body class="lp">oi</body></html>`,
    BASIC
  );
  assert.ok(
    out.includes(`'dataLayer','${BASIC}')`),
    "o loader não ficou com o container pedido"
  );
  assert.ok(
    out.indexOf("googletagmanager.com/gtm.js") < out.indexOf("<title>"),
    "o loader não foi pro começo do head"
  );
  assert.ok(
    out.includes(`ns.html?id=${BASIC}`),
    "faltou o iframe do noscript"
  );
  assert.ok(
    out.indexOf(`ns.html?id=${BASIC}`) > out.indexOf(`<body class="lp">`),
    "o noscript não ficou logo após a abertura do body"
  );
  assert.ok(!out.includes(MAGIC), "vazou o container da /magicshadow");
});

test("withGoogleTag é idempotente pro mesmo container", () => {
  const once = withGoogleTag(`<html><head></head><body></body></html>`, BASIC);
  assert.equal(withGoogleTag(once, BASIC), once);
});

test("withGoogleTag funciona em HTML sem head nem body", () => {
  const out = withGoogleTag(`<div>fragmento</div>`, BASIC);
  assert.ok(out.includes(`'dataLayer','${BASIC}')`));
  assert.ok(!out.includes("ns.html"), "não deve inventar noscript sem body");
});

// ---------------------------------------------------------------------------
// Política: limpar antes de injetar (é o que withTracking faz)
// ---------------------------------------------------------------------------

test("limpar + injetar deixa só o container novo na página", () => {
  const html = `<html><head>${GTM_EMBUTIDO}</head><body>oi</body></html>`;
  const out = withGoogleTag(stripGoogleTagManager(html), BASIC);

  assert.ok(!out.includes(OLD_WP), "sobrou o container antigo do WordPress");
  assert.ok(!out.includes(MAGIC), "vazou o container da /magicshadow");
  assert.equal(
    out.match(/googletagmanager\.com\/gtm\.js/g)?.length,
    1,
    "a página ficou com mais de um loader do GTM"
  );
  assert.equal(
    out.match(/googletagmanager\.com\/ns\.html/g)?.length,
    1,
    "a página ficou com mais de um noscript do GTM"
  );
  assert.ok(out.includes(`'dataLayer','${BASIC}')`));
});

// Cenário exato da /fio-a-fio-realista-by-james-olaya: a LP tem o container
// ANTIGO do WP gravado no próprio HTML e agora deve servir o NB2WK5SJ.
test("LP com container antigo embutido serve só o container do seu slug", () => {
  const html = `<html><head>${GTM_EMBUTIDO}</head><body>oi</body></html>`;
  const out = withGoogleTag(stripGoogleTagManager(html), FIOAFIO);

  assert.ok(out.includes(`'dataLayer','${FIOAFIO}')`), "faltou o container da LP");
  assert.ok(out.includes(`ns.html?id=${FIOAFIO}`), "faltou o noscript da LP");
  assert.ok(!out.includes(OLD_WP), "sobrou o container antigo do WordPress");
  assert.ok(!out.includes(BASIC) && !out.includes(MAGIC), "vazou container de outra página");
  assert.equal(out.match(/googletagmanager\.com\/gtm\.js/g)?.length, 1);
  assert.equal(out.match(/googletagmanager\.com\/ns\.html/g)?.length, 1);
});

test("limpar sem injetar deixa a página sem GTM nenhum", () => {
  const out = stripGoogleTagManager(
    `<html><head>${GTM_EMBUTIDO}</head><body>oi</body></html>`
  );
  assert.ok(!out.includes("gtm.js"));
  assert.ok(!out.includes("ns.html"));
});
