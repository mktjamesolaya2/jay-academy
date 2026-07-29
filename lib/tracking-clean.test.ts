import { test } from "node:test";
import assert from "node:assert/strict";
import { stripGoogleTagManager, stripPixelInits } from "./tracking-clean.ts";

const DSTV = "1841776429524244";

// Fixtures copiados do HTML REAL servido em produção (/acao-mshadow), inclusive
// o `type="rocketlazyloadscript"` do WP-Rocket e os espaços dentro do fbq().
const PIXEL_CAT_WP = `<script type="rocketlazyloadscript">
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js' );
fbq( 'init', '935630436819595' );fbq( 'init', '1841776429524244' );fbq( 'init', '872802227099574' );	</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=935630436819595&ev=PageView&noscript=1" /></noscript>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1841776429524244&ev=PageView&noscript=1" /></noscript>`;

const GTM_WP = `<script type="rocketlazyloadscript">(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TVLJSVJZ');</script>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TVLJSVJZ" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;

const GA4_TAG = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-N93TQZV050"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','G-N93TQZV050');</script>`;

// ---------------------------------------------------------------------------
// stripGoogleTagManager
// ---------------------------------------------------------------------------

test("stripGoogleTagManager remove o script e o noscript do container", () => {
  const out = stripGoogleTagManager(`<head>${GTM_WP}</head>`);
  assert.ok(!out.includes("gtm.js"), "sobrou o loader do GTM");
  assert.ok(!out.includes("ns.html"), "sobrou o iframe do noscript");
  assert.ok(!out.includes("GTM-TVLJSVJZ"), "sobrou o ID do container");
});

test("stripGoogleTagManager pega container ANTIGO embutido (não depende do ID)", () => {
  const antigo = GTM_WP.replace(/GTM-TVLJSVJZ/g, "GTM-NN5KDTCB");
  const out = stripGoogleTagManager(antigo);
  assert.ok(!out.includes("GTM-NN5KDTCB"));
  assert.ok(!out.includes("googletagmanager.com/gtm.js"));
});

test("stripGoogleTagManager NÃO derruba o GA4 (gtag/js é outra tag)", () => {
  const out = stripGoogleTagManager(`${GTM_WP}\n${GA4_TAG}`);
  assert.ok(out.includes("gtag/js?id=G-N93TQZV050"), "o GA4 tem que sobreviver");
  assert.ok(out.includes("gtag('config','G-N93TQZV050')"));
  assert.ok(!out.includes("gtm.js"));
});

test("stripGoogleTagManager preserva o resto do HTML", () => {
  const out = stripGoogleTagManager(`<h1>Curso</h1>${GTM_WP}<p>texto</p>`);
  assert.ok(out.includes("<h1>Curso</h1>"));
  assert.ok(out.includes("<p>texto</p>"));
});

// ---------------------------------------------------------------------------
// stripPixelInits
// ---------------------------------------------------------------------------

test("stripPixelInits mantém só o DSTV e tira os pixels do Pixel Cat", () => {
  const out = stripPixelInits(PIXEL_CAT_WP, [DSTV]);
  assert.ok(out.includes(`fbq( 'init', '${DSTV}' )`), "o DSTV tem que ficar");
  assert.ok(!out.includes("935630436819595"), "sobrou o 935…");
  assert.ok(!out.includes("872802227099574"), "sobrou o 872…");
  // o noscript do id estranho sai, o do DSTV fica
  assert.ok(!out.includes("tr?id=935630436819595"));
  assert.ok(out.includes(`tr?id=${DSTV}`));
});

test("stripPixelInits com keepIds vazio remove TODOS os inits", () => {
  const out = stripPixelInits(PIXEL_CAT_WP, []);
  assert.ok(!/fbq\s*\(\s*['"]init['"]/.test(out), "sobrou algum init");
  assert.ok(!out.includes("tr?id="), "sobrou algum beacon de noscript");
});

test("stripPixelInits não quebra o stub do fbq nem os track()", () => {
  const html = `${PIXEL_CAT_WP}<script>fbq('track','PageView');</script>`;
  const out = stripPixelInits(html, []);
  assert.ok(out.includes("n=f.fbq=function()"), "o stub do fbq tem que continuar");
  assert.ok(out.includes("fbq('track','PageView')"), "os track() ficam (viram no-op)");
});

test("stripPixelInits aceita aspas duplas e sem espaço", () => {
  const html = `<script>fbq("init","935630436819595");fbq('init','${DSTV}');</script>`;
  const out = stripPixelInits(html, [DSTV]);
  assert.ok(!out.includes("935630436819595"));
  assert.ok(out.includes(DSTV));
});

test("stripPixelInits ignora número de 16 dígitos que NÃO é pixel", () => {
  // Caso real da /fio-a-fio-realista: nome de arquivo de vídeo do Instagram.
  // Um regex ingênuo apagaria a lista de vídeos e quebraria a seção.
  const html = `<script>(function(){var VIDS=[
"b10a39e931ec-snapinsta.app-118651566-3287498404622196-5607887651076890258-n.mp4",
"3267b48f325a-snapinsta.app-118708879-321346189118582-8314541208787868570-n.mp4"];})();</script>`;
  const out = stripPixelInits(html, []);
  assert.equal(out, html, "não pode tocar em nada fora de fbq('init')/tr?id=");
});

test("stripPixelInits com pixel do bootstrap do portal (eventID) preserva o init", () => {
  // O nosso bootstrap usa aspas simples sem espaço e vem seguido do track com eventID.
  const nosso = `<script>fbq('init', '${DSTV}');\nfbq('track', 'PageView', {}, { eventID: window.__metaEventId });</script>`;
  const out = stripPixelInits(nosso, [DSTV]);
  assert.equal(out, nosso);
});
