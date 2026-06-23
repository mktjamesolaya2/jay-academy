import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isWpHost,
  classifyAsset,
  resolveUrl,
  isWpAssetUrl,
  extractWpAssetUrls,
  delazyHtml,
  rewriteUrls,
  localizeHtml,
  rewriteCssUrls,
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
