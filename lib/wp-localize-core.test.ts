import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isWpHost,
  classifyAsset,
  resolveUrl,
  isWpAssetUrl,
  extractWpAssetUrls,
  extractAssetUrls,
  isAssetUrl,
  delazyHtml,
  delazyBackgrounds,
  rewriteUrls,
  localizeHtml,
  rewriteCssUrls,
  rewriteWpAnchors,
  deRocketUrl,
} from "./wp-localize-core.ts";

test("isWpHost reconhece subdomínios do WP e rejeita o resto", () => {
  assert.ok(isWpHost("lp.jayacademy.com.br"));
  assert.ok(isWpHost("jayacademy.com.br"));
  assert.ok(isWpHost("LP.JayAcademy.com.br"));
  assert.ok(!isWpHost("jay-academy.vercel.app"));
  assert.ok(!isWpHost("evil-jayacademy.com.br.attacker.com"));
});

test("classifyAsset pela extensão", () => {
  assert.equal(classifyAsset("https://x/a.css?ver=1"), "css");
  assert.equal(classifyAsset("https://x/a.min.js"), "js");
  assert.equal(classifyAsset("https://x/foto-300x300.JPG"), "image");
  assert.equal(classifyAsset("https://x/font.woff2"), "font");
  assert.equal(classifyAsset("https://x/video.mp4"), "media");
  assert.equal(classifyAsset("https://x/page"), "other");
});

test("resolveUrl: absoluto, relativo, protocol-relative, data/skip", () => {
  assert.equal(resolveUrl("https://a.com/x.png"), "https://a.com/x.png");
  assert.equal(resolveUrl("//a.com/x.png"), "https://a.com/x.png");
  assert.equal(
    resolveUrl("../img/x.png", "https://a.com/css/style.css"),
    "https://a.com/img/x.png"
  );
  assert.equal(resolveUrl("data:image/svg+xml,abc"), null);
  assert.equal(resolveUrl("#anchor"), null);
  assert.equal(resolveUrl("relative.png"), null); // sem base
});

test("isWpAssetUrl só aceita asset do WP", () => {
  assert.ok(isWpAssetUrl("https://lp.jayacademy.com.br/wp-content/x.jpg"));
  assert.ok(isWpAssetUrl("https://lp.jayacademy.com.br/a/b.css?ver=3"));
  // página (sem extensão de asset) NÃO conta
  assert.ok(!isWpAssetUrl("https://lp.jayacademy.com.br/minha-pagina/"));
  // asset de outro host NÃO conta
  assert.ok(!isWpAssetUrl("https://i.ytimg.com/vi/abc/0.jpg"));
});

test("extractWpAssetUrls pega src, data-lazy-src, srcset, css e style url()", () => {
  const html = `
    <img src="data:image/svg+xml,..." data-lazy-src="https://lp.jayacademy.com.br/wp-content/a.jpg" />
    <img srcset="https://lp.jayacademy.com.br/wp-content/b-300x300.png 300w, https://lp.jayacademy.com.br/wp-content/b.png 768w" />
    <link rel="stylesheet" href="https://lp.jayacademy.com.br/wp-content/style.css?ver=1" />
    <script src="https://lp.jayacademy.com.br/wp-content/app.js"></script>
    <div style="background-image:url('https://lp.jayacademy.com.br/wp-content/bg.webp')"></div>
    <a href="https://lp.jayacademy.com.br/pagina-link/">link de página (ignorar)</a>
    <img src="https://i.ytimg.com/vi/x/0.jpg" />`;
  const urls = extractWpAssetUrls(html).sort();
  assert.deepEqual(urls, [
    "https://lp.jayacademy.com.br/wp-content/a.jpg",
    "https://lp.jayacademy.com.br/wp-content/app.js",
    "https://lp.jayacademy.com.br/wp-content/b-300x300.png",
    "https://lp.jayacademy.com.br/wp-content/b.png",
    "https://lp.jayacademy.com.br/wp-content/bg.webp",
    "https://lp.jayacademy.com.br/wp-content/style.css?ver=1",
  ]);
});

test("delazyHtml joga data-lazy-src no src e remove placeholder", () => {
  const html = `<img class="lazy" src="data:image/svg+xml,vazio" data-lazy-src="https://lp.jayacademy.com.br/real.jpg" />`;
  const out = delazyHtml(html);
  assert.ok(out.includes(`src="https://lp.jayacademy.com.br/real.jpg"`));
  assert.ok(!out.includes("data:image/svg+xml"));
});

test("delazyHtml cria src quando não existe e cobre srcset", () => {
  const html = `<img data-lazy-src="https://lp.jayacademy.com.br/r.jpg" data-lazy-srcset="https://lp.jayacademy.com.br/r-2x.jpg 2x" />`;
  const out = delazyHtml(html);
  assert.ok(out.includes(`src="https://lp.jayacademy.com.br/r.jpg"`));
  assert.ok(out.includes(`srcset="https://lp.jayacademy.com.br/r-2x.jpg 2x"`));
});

test("delazyHtml troca placeholder data-URI SVG (com aspas internas) sem corromper a tag", () => {
  // O placeholder real do lazy-load do WP é um data:image/svg que contém ASPAS
  // SIMPLES por dentro (xmlns='...'). O setAttr ingênuo parava na primeira aspa
  // interna e deixava lixo no meio da <img> → imagem quebrada. Regressão real.
  const ph =
    `<img width="959" height="519" ` +
    `src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20959%20519'%3E%3C/svg%3E" ` +
    `data-lazy-src="https://lp.jayacademy.com.br/logo.png" />`;
  const out = delazyHtml(ph);
  assert.ok(
    out.includes(`src="https://lp.jayacademy.com.br/logo.png"`),
    "src deve apontar pra imagem real"
  );
  assert.ok(!out.includes("data:image/svg"), "placeholder removido");
  assert.ok(!out.includes("w3.org"), "nenhum resto do data-URI sobra na tag: " + out);
  // a tag continua sendo UMA <img ...> bem-formada (uma abertura, um fechamento)
  assert.equal((out.match(/<img\b/gi) || []).length, 1);
  assert.equal((out.match(/>/g) || []).length, 1);
});

test("delazyBackgrounds aplica o fundo do WP Rocket (--wpr-bg → background-image)", () => {
  // A var é definida mas nunca aplicada no CSS (caso real do WP Rocket).
  const css = `<style>.hero{--wpr-bg-abc123: url('https://jayacademy.com.br/wp-content/uploads/2024/hero.jpg')}</style>`;
  const out = delazyBackgrounds(css);
  // A var original continua lá...
  assert.match(out, /--wpr-bg-abc123:\s*url\('https:\/\/jayacademy\.com\.br\/wp-content\/uploads\/2024\/hero\.jpg'\)/);
  // ...e agora o background-image é aplicado com a MESMA url (aparece sem JS).
  assert.match(out, /background-image:url\('https:\/\/jayacademy\.com\.br\/wp-content\/uploads\/2024\/hero\.jpg'\)/);
});

test("delazyBackgrounds funciona em style inline e sem aspas na url()", () => {
  const inline = `<section style="--wpr-bg-x: url(https://jayacademy.com.br/a/bg.png); color:red">`;
  const out = delazyBackgrounds(inline);
  assert.match(out, /background-image:url\(https:\/\/jayacademy\.com\.br\/a\/bg\.png\)/);
  // não quebra o resto da style
  assert.match(out, /color:red/);
});

test("delazyBackgrounds não faz nada quando não há --wpr-bg", () => {
  const css = `<style>.x{background-image:url(https://jayacademy.com.br/a.png)}</style>`;
  assert.equal(delazyBackgrounds(css), css);
});

test("delazyHtml não inventa src a partir de placeholder data:", () => {
  const html = `<img src="x.jpg" data-src="data:image/gif;base64,AAAA" />`;
  const out = delazyHtml(html);
  assert.ok(out.includes(`src="x.jpg"`)); // não substitui por data:
});

test("rewriteUrls troca todas as ocorrências, prefixo-seguro", () => {
  const map = {
    "https://lp.jayacademy.com.br/a.jpg": "/blob/a.jpg",
    "https://lp.jayacademy.com.br/a.jpg?v=2": "/blob/a-v2.jpg",
  };
  const text = `x https://lp.jayacademy.com.br/a.jpg?v=2 y https://lp.jayacademy.com.br/a.jpg z`;
  const out = rewriteUrls(text, map);
  assert.equal(out, "x /blob/a-v2.jpg y /blob/a.jpg z");
});

test("localizeHtml = delazy + rewrite (imagem lazy fica local e visível)", () => {
  const html = `<img src="data:image/svg+xml,v" data-lazy-src="https://lp.jayacademy.com.br/p.jpg" />`;
  const map = { "https://lp.jayacademy.com.br/p.jpg": "/blob/p.jpg" };
  const out = localizeHtml(html, map);
  assert.ok(out.includes(`src="/blob/p.jpg"`));
  assert.ok(!out.includes("lp.jayacademy.com.br"));
  assert.ok(!out.includes("data:image/svg+xml"));
});

test("extractWpAssetUrls pega URL de asset escapada em JSON (data-settings Elementor)", () => {
  const html = `<div data-settings='{"background_image":{"url":"https:\\/\\/lp.jayacademy.com.br\\/wp-content\\/uploads\\/bg.jpg","id":1}}'></div>`;
  const urls = extractWpAssetUrls(html);
  assert.deepEqual(urls, ["https://lp.jayacademy.com.br/wp-content/uploads/bg.jpg"]);
});

test("rewriteUrls troca também a forma escapada em JSON", () => {
  const map = {
    "https://lp.jayacademy.com.br/wp-content/uploads/bg.jpg": "https://blob.x/bg.jpg",
  };
  const text = `"url":"https:\\/\\/lp.jayacademy.com.br\\/wp-content\\/uploads\\/bg.jpg" e src="https://lp.jayacademy.com.br/wp-content/uploads/bg.jpg"`;
  const out = rewriteUrls(text, map);
  assert.ok(out.includes(`"url":"https:\\/\\/blob.x\\/bg.jpg"`), "forma escapada trocada");
  assert.ok(out.includes(`src="https://blob.x/bg.jpg"`), "forma normal trocada");
  assert.ok(!out.includes("lp.jayacademy.com.br"), "nada do WP sobra");
});

test("rewriteWpAnchors: link absoluto pra própria página vira âncora (rola)", () => {
  const html = `<a class="btn" href="https://jayacademy.com.br/basic-magic-shadow/?_gl=1*x#VALOR">EU QUERO</a>`;
  const out = rewriteWpAnchors(html, ["basic-magic-shadow"], {});
  assert.ok(out.includes(`href="#VALOR"`), out);
  assert.ok(!out.includes("jayacademy.com.br"));
});

test("rewriteWpAnchors: link pra outra página copiada vira rota do portal", () => {
  const html = `<a href="https://lp.jayacademy.com.br/pmu-upsell-x/">ver</a>`;
  const out = rewriteWpAnchors(html, ["basic-magic-shadow"], {
    "pmu-upsell-x": "oferta-pmu",
  });
  assert.ok(out.includes(`href="/oferta-pmu"`), out);
});

test("rewriteWpAnchors: WhatsApp/Hotmart e página WP desconhecida ficam intactos", () => {
  const wa = `<a href="https://wa.me/5519999?text=oi">whats</a>`;
  const ht = `<a href="https://pay.hotmart.com/ABC?off=x">comprar</a>`;
  const unknown = `<a href="https://jayacademy.com.br/pagina-nao-copiada/">x</a>`;
  assert.equal(rewriteWpAnchors(wa, ["p"], {}), wa);
  assert.equal(rewriteWpAnchors(ht, ["p"], {}), ht);
  assert.equal(rewriteWpAnchors(unknown, ["p"], {}), unknown);
});

test("rewriteWpAnchors: self-link sem hash cai na raiz da própria página", () => {
  const html = `<a href="https://jayacademy.com.br/basic-magic-shadow/">topo</a>`;
  const out = rewriteWpAnchors(html, ["basic-magic-shadow"], {});
  assert.ok(out.includes(`href="/basic-magic-shadow"`), out);
});

test("deRocketUrl reconstrói o original do cache volátil do WP Rocket", () => {
  // /wp-content/cache/min/N/<caminho-original> → /<caminho-original>. O cache do
  // WP Rocket é purgado e passa a dar 404 mesmo com o WP no ar; o original fica.
  assert.equal(
    deRocketUrl(
      "https://lp.jayacademy.com.br/wp-content/cache/min/1/wp-content/themes/hello-elementor/assets/css/reset.css?ver=1779830030"
    ),
    "https://lp.jayacademy.com.br/wp-content/themes/hello-elementor/assets/css/reset.css?ver=1779830030"
  );
  assert.equal(
    deRocketUrl(
      "https://lp.jayacademy.com.br/wp-content/cache/min/3/wp-content/uploads/elementor/google-fonts/css/roboto.css"
    ),
    "https://lp.jayacademy.com.br/wp-content/uploads/elementor/google-fonts/css/roboto.css"
  );
  // URLs que NÃO são do cache do WP Rocket → null
  assert.equal(
    deRocketUrl("https://lp.jayacademy.com.br/wp-content/uploads/2025/04/logo.png"),
    null
  );
  assert.equal(deRocketUrl("https://outro.com/cache/min/1/x.css"), null);
});

test("rewriteCssUrls resolve url() relativo e troca pelo destino", () => {
  const css = `@font-face{src:url('../fonts/x.woff2')} .a{background:url("https://lp.jayacademy.com.br/img/bg.png")}`;
  const base = "https://lp.jayacademy.com.br/wp-content/css/style.css";
  const map = {
    "https://lp.jayacademy.com.br/wp-content/fonts/x.woff2": "/blob/x.woff2",
    "https://lp.jayacademy.com.br/img/bg.png": "/blob/bg.png",
  };
  const out = rewriteCssUrls(css, base, map);
  assert.ok(out.includes(`url('/blob/x.woff2')`));
  assert.ok(out.includes(`url("/blob/bg.png")`));
});

test("extractAssetUrls pega assets de QUALQUER host, resolvendo relativo", () => {
  const html = `
    <img src="/img/hero.png">
    <link rel="stylesheet" href="https://cdn.outro.com/app.css">
    <div style="background:url('bg.jpg')"></div>
    <script src="https://site.com/bundle.js"></script>`;
  const urls = extractAssetUrls(html, "https://site.com/pagina");
  assert.ok(urls.includes("https://site.com/img/hero.png"));
  assert.ok(urls.includes("https://cdn.outro.com/app.css"));
  assert.ok(urls.includes("https://site.com/bg.jpg"));
  assert.ok(urls.includes("https://site.com/bundle.js"));
});

test("isAssetUrl aceita por extensão, ignora não-asset", () => {
  assert.ok(isAssetUrl("https://x.com/a.woff2"));
  assert.equal(isAssetUrl("https://x.com/pagina-sem-ext"), false);
});

// ─── F1: absolutizeUrls + decodeUrlEntities (cópia da web) ───
import { absolutizeUrls, decodeUrlEntities } from "./wp-localize-core.ts";

test("decodeUrlEntities decodifica &amp;", () => {
  assert.equal(decodeUrlEntities("a?x=1&amp;y=2"), "a?x=1&y=2");
  assert.equal(decodeUrlEntities("a?x=1&#38;y=2"), "a?x=1&y=2");
});

test("absolutizeUrls: relativo/root-relativo/protocol-relativo → absoluto", () => {
  const base = "https://site.com/blog/post";
  const html = `
    <link rel="stylesheet" href="/static/app.css">
    <img src="img/hero.jpg">
    <script src="//cdn.com/x.js"></script>
    <a href="/login">entrar</a>
    <div style="background:url('bg.png')"></div>`;
  const out = absolutizeUrls(html, base);
  assert.ok(out.includes('href="https://site.com/static/app.css"'));
  assert.ok(out.includes('src="https://site.com/blog/img/hero.jpg"'));
  assert.ok(out.includes('src="https://cdn.com/x.js"'));
  assert.ok(out.includes('href="https://site.com/login"'));
  assert.ok(out.includes("url('https://site.com/blog/bg.png')"));
});

test("absolutizeUrls: NÃO mexe em absoluto/data/#/mailto", () => {
  const base = "https://site.com/";
  const html = `<img src="https://x.com/a.png"><a href="#top">t</a><img src="data:image/png;base64,AAA"><a href="mailto:a@b.com">m</a>`;
  const out = absolutizeUrls(html, base);
  assert.ok(out.includes('src="https://x.com/a.png"'));
  assert.ok(out.includes('href="#top"'));
  assert.ok(out.includes("data:image/png;base64,AAA"));
  assert.ok(out.includes("mailto:a@b.com"));
});

test("absolutizeUrls: decodifica &amp; ao absolutizar (load.php)", () => {
  const out = absolutizeUrls(
    `<link rel="stylesheet" href="/w/load.php?lang=pt&amp;only=styles">`,
    "https://pt.wikipedia.org/wiki/X"
  );
  assert.ok(out.includes("https://pt.wikipedia.org/w/load.php?lang=pt&only=styles"));
  assert.ok(!out.includes("&amp;"));
});

test("absolutizeUrls: srcset com múltiplas URLs", () => {
  const out = absolutizeUrls(
    `<img srcset="a.jpg 1x, b.jpg 2x">`,
    "https://site.com/x/"
  );
  assert.ok(out.includes("https://site.com/x/a.jpg 1x"));
  assert.ok(out.includes("https://site.com/x/b.jpg 2x"));
});

// ─── F3/F8: extractWebAssetUrls + extractCssAssets ───
import { extractWebAssetUrls, extractCssAssets } from "./wp-localize-core.ts";

test("extractWebAssetUrls pega CSS disfarçado (sem extensão) por tag", () => {
  const html = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto">
    <link rel="stylesheet" href="https://site.com/w/load.php?only=styles">
    <link rel="icon" href="https://site.com/favicon.ico">
    <link rel="preload" as="font" href="https://site.com/f/Inter">`;
  const urls = extractWebAssetUrls(html);
  assert.ok(urls.includes("https://fonts.googleapis.com/css2?family=Roboto"));
  assert.ok(urls.includes("https://site.com/w/load.php?only=styles"));
  assert.ok(urls.includes("https://site.com/favicon.ico"));
  assert.ok(urls.includes("https://site.com/f/Inter"));
});

test("extractCssAssets pega url() e @import (qualquer host)", () => {
  const css = `@import "base.css";
    @import url('https://cdn.com/vendor.css');
    @font-face { src: url(../fonts/Inter.woff2) }
    body { background: url("https://cdn.com/bg.jpg") }`;
  const urls = extractCssAssets(css, "https://site.com/css/main.css");
  assert.ok(urls.includes("https://site.com/css/base.css"));
  assert.ok(urls.includes("https://cdn.com/vendor.css"));
  assert.ok(urls.includes("https://site.com/fonts/Inter.woff2"));
  assert.ok(urls.includes("https://cdn.com/bg.jpg"));
});

test("absolutizeUrls NÃO corrompe srcset com data: URI (placeholder lazy)", () => {
  const html = `<source srcset="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">`;
  const out = absolutizeUrls(html, "https://site.com/pagina");
  assert.ok(out.includes("data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="));
  assert.ok(!out.includes("site.com/R0lGODlh")); // não corrompeu
});

import { stripPlaceholderSources } from "./wp-localize-core.ts";
test("stripPlaceholderSources remove placeholder e deixa a img real aparecer", () => {
  const html = `<picture><source data-empty="" srcSet="data:image/gif;base64,R0lGODlh" media="(min-width:0px)"/><img src="https://x.com/real.jpg" alt="a"/></picture>`;
  const out = stripPlaceholderSources(html);
  assert.ok(!out.includes("<source")); // placeholder removido
  assert.ok(out.includes('src="https://x.com/real.jpg"')); // img real fica
});
test("stripPlaceholderSources NÃO remove source real (srcset de verdade)", () => {
  const html = `<picture><source srcset="https://x.com/big.jpg 2x" media="(min-width:800px)"/><img src="https://x.com/small.jpg"/></picture>`;
  const out = stripPlaceholderSources(html);
  assert.ok(out.includes('srcset="https://x.com/big.jpg 2x"')); // source real preservado
});

test("absolutizeUrls cobre <form action> (senão form posta pro portal)", () => {
  const out = absolutizeUrls(`<form action="/subscribe" method="post">`, "https://site.com/lp");
  assert.ok(out.includes('action="https://site.com/subscribe"'));
});
