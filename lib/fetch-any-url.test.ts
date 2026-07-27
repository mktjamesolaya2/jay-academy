import { test } from "node:test";
import assert from "node:assert/strict";
import { looksEmpty, isHtmlContentType } from "./fetch-any-url.ts";

test("casca de SPA é vazia", () => {
  assert.equal(looksEmpty(`<html><body><div id="root"></div></body></html>`), true);
  assert.equal(looksEmpty(`<body><div id="__next"></div><noscript>You need to enable JavaScript</noscript></body>`), true);
});

test("página com conteúdo real NÃO é vazia", () => {
  const html = `<body><h1>Oferta</h1>` + "<p>texto de verdade sobre o produto</p>".repeat(20) + `</body>`;
  assert.equal(looksEmpty(html), false);
});

test("emptyRoot dispara mesmo com texto longo (isola do tooShort)", () => {
  // Texto visível > 200 chars fora da div root. O marcador emptyRoot deve dispara
  // INDEPENDENTEMENTE de tooShort.
  const longText = "Este é um bloco de texto visível que passa de 200 caracteres para garantir que o teste NÃO está falhando por causa do ramo tooShort, mas sim pelo marcador emptyRoot. Nós precisamos de bastante conteúdo aqui para tornar isso real. Cookie notice ou rodapé longo funciona.";
  const html = `<body>${longText}<div id="root"></div></body>`;
  // Validação: longText > 200 chars
  assert.ok(longText.length > 200, "Texto deve ter > 200 caracteres");
  assert.equal(looksEmpty(html), true);
});

test("needsJs dispara mesmo com texto longo (isola do tooShort)", () => {
  // Parágrafo longo contendo "enable JavaScript", SEM div root/app/next vazia.
  // O marcador needsJs deve disparar INDEPENDENTEMENTE de tooShort.
  const longText = "Por favor, habilite JavaScript para visualizar o conteúdo. Este é um parágrafo longo que contém a frase enable JavaScript e também deve ter mais de 200 caracteres de texto visível para provar que o ramo needsJs está sendo acionado independentemente do ramo tooShort. Isso é importante para isolar.";
  const html = `<body><p>${longText}</p></body>`;
  // Validação: longText > 200 chars
  assert.ok(longText.length > 200, "Texto deve ter > 200 caracteres");
  assert.equal(looksEmpty(html), true);
});

test("id=\"app\" vazio detecta como casca de SPA", () => {
  // Cobre a variante id="app" (além de root e __next)
  const html = `<html><body><div id="app"></div></body></html>`;
  assert.equal(looksEmpty(html), true);
});

test("isHtmlContentType aceita HTML e desconhecido, rejeita binário", () => {
  assert.equal(isHtmlContentType("text/html; charset=utf-8"), true);
  assert.equal(isHtmlContentType("application/xhtml+xml"), true);
  assert.equal(isHtmlContentType(null), true);
  assert.equal(isHtmlContentType("application/pdf"), false);
  assert.equal(isHtmlContentType("image/png"), false);
  assert.equal(isHtmlContentType("application/octet-stream"), false);
});

// ─── F7: detectCharset ───
import { detectCharset } from "./fetch-any-url.ts";
test("detectCharset: header tem prioridade", () => {
  assert.equal(detectCharset("text/html; charset=ISO-8859-1", "<meta charset='utf-8'>"), "iso-8859-1");
});
test("detectCharset: cai no <meta charset> quando header nao diz", () => {
  assert.equal(detectCharset("text/html", '<meta charset="windows-1252">'), "windows-1252");
  assert.equal(detectCharset(null, '<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">'), "iso-8859-1");
});
test("detectCharset: default utf-8", () => {
  assert.equal(detectCharset("text/html", "<html><body>x"), "utf-8");
  assert.equal(detectCharset(null, ""), "utf-8");
});
