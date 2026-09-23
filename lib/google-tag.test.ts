import { test } from "node:test";
import assert from "node:assert/strict";
import { GTM_BY_SLUG, GTM_ID, gtmIdForSlug, withGoogleTag } from "./google-tag.ts";
import { stripGoogleTagManager } from "./tracking-clean.ts";

const MAGIC = "GTM-TVLJSVJZ";
const BASIC = "GTM-W394J499";
const FIOAFIO = "GTM-NB2WK5SJ";
const OLD_WP = "GTM-NN5KDTCB";

// As três ofertas de fechamento do JAY TRANSFORMA (14/09). Cada uma tem o seu.
const OFERTAS = {
  "jaytransforma-beauty": "GTM-PX3XWDMW",
  "jaytransforma-remove": "GTM-N78J7X4K",
  "jaytransforma-start": "GTM-KH73NTJS",
} as const;

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

// ── Os containers das ofertas de fechamento ──────────────────────────────────

test("cada oferta de fechamento serve o container dela", () => {
  // Assert literal de propósito: um dígito trocado num ID não quebra nada em
  // runtime — a página carrega, o GTM responde, e os dados vão para a conta
  // errada (ou para nenhuma). Só um teste que conhece o ID pega isso.
  for (const [slug, container] of Object.entries(OFERTAS)) {
    assert.equal(gtmIdForSlug(slug), container, slug);
  }
});

test("as três ofertas não compartilham container entre si", () => {
  // ESTE é o teste que pega copiar-e-colar: três linhas quase idênticas no
  // mapa, e o erro provável é a segunda repetir o ID da primeira. O sintoma
  // seria duas páginas reportando no mesmo lugar, que ninguém nota olhando.
  const slugs = Object.keys(OFERTAS);
  const distintos = new Set(slugs.map((s) => gtmIdForSlug(s)));
  assert.equal(distintos.size, slugs.length, [...distintos].join(", "));
});

test("as ofertas saíram do container do marketing", () => {
  // Elas nasceram no GTM-TVLJSVJZ e saíram de lá em 14/09. Se alguma voltar
  // pra ele, as conversões das três se misturam de novo com as do site.
  for (const slug of Object.keys(OFERTAS)) {
    assert.notEqual(gtmIdForSlug(slug), MAGIC, slug);
  }
});

test("a troca das ofertas não vazou para as vizinhas", () => {
  // A /transforma (o evento) e a /magicshadow continuam no container do
  // marketing, de propósito. São as linhas coladas às que mudaram.
  assert.equal(gtmIdForSlug("transforma"), MAGIC);
  assert.equal(gtmIdForSlug("magicshadow"), MAGIC);
});

test("nenhuma página divide container com outra sem ser os grupos intencionais", () => {
  // Varre o mapa inteiro: container repetido é ou intencional (magicshadow e
  // transforma; a Fio a Fio oficial e as prévias v2/v3) ou um engano. Assim, página nova entrando com ID copiado de
  // outra falha aqui em vez de ir pro ar medindo errado.
  const porContainer = new Map<string, string[]>();
  for (const [slug, container] of Object.entries(GTM_BY_SLUG)) {
    porContainer.set(container, [...(porContainer.get(container) || []), slug]);
  }
  for (const [container, slugs] of porContainer) {
    if (slugs.length === 1) continue;
    const grupos = [
      ["magicshadow", "transforma"],
      ["fio-a-fio-realista-by-james-olaya", "fio-a-fio-realista-v2", "fio-a-fio-realista-v3"],
    ];
    const ordenado = JSON.stringify([...slugs].sort());
    assert.ok(
      grupos.some((g) => JSON.stringify([...g].sort()) === ordenado),
      `${container} está em mais de uma página: ${slugs.join(", ")}`
    );
  }
});

test("a página serve o container dela no head E no noscript", () => {
  // O noscript é o passo 2 do snippet do Google. Ele sai do mesmo ID do script,
  // então basta conferir que os dois aparecem na página servida.
  const out = withGoogleTag(
    "<html><head></head><body>oi</body></html>",
    gtmIdForSlug("jaytransforma-start")!
  );
  assert.ok(out.includes(`gtm.js?id='+i+dl`) || out.includes("gtm.js"));
  assert.ok(out.includes(`ns.html?id=${OFERTAS["jaytransforma-start"]}`));
  assert.ok(out.includes(OFERTAS["jaytransforma-start"]));
  assert.ok(!out.includes(MAGIC));
});

test("as prévias v2 e v3 do Fio a Fio levam o container da oficial", () => {
  for (const slug of ["fio-a-fio-realista-v2", "fio-a-fio-realista-v3"]) {
    assert.equal(gtmIdForSlug(slug), FIOAFIO, slug);
  }
});
