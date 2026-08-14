import { test } from "node:test";
import assert from "node:assert/strict";
import { comFormMobileCss } from "./form-mobile-css.ts";

test("entra antes do </head>", () => {
  const r = comFormMobileCss("<html><head><title>x</title></head><body>oi</body></html>");
  assert.ok(r.includes("data-jayo-form-mobile"));
  assert.ok(r.indexOf("data-jayo-form-mobile") < r.indexOf("</head>"));
});

test("sem <head>, entra logo depois do <body>", () => {
  const r = comFormMobileCss("<body class='x'>oi</body>");
  assert.ok(r.includes("data-jayo-form-mobile"));
  assert.ok(r.indexOf("<body") < r.indexOf("data-jayo-form-mobile"));
});

test("não duplica se rodar duas vezes", () => {
  const uma = comFormMobileCss("<html><head></head><body></body></html>");
  const duas = comFormMobileCss(uma);
  assert.equal(uma, duas);
  assert.equal((duas.match(/data-jayo-form-mobile/g) ?? []).length, 1);
});

test("só mexe no celular — o desktop fica intocado", () => {
  const r = comFormMobileCss("<html><head></head><body></body></html>");
  const dentro = r.slice(r.indexOf("<style"), r.indexOf("</style>"));
  assert.ok(dentro.includes("@media (max-width: 767px)"));
  // toda regra tem que estar dentro do @media
  const antesDoMedia = dentro.slice(0, dentro.indexOf("@media"));
  assert.ok(!antesDoMedia.includes("{"), "nenhuma regra solta fora do @media");
});

test("da respiro aos campos — de 10px pra 22px da borda", () => {
  const r = comFormMobileCss("<head></head>");
  assert.ok(r.includes("padding-left: 12px"));
});

test("usa !important de proposito", () => {
  // sem isso o CSS do Elementor vence e a regra e ignorada -- medido no
  // navegador: o campo continuava em 10px
  const r = comFormMobileCss("<head></head>");
  assert.ok(r.includes("!important"));
});
