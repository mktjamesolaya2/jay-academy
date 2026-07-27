import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveWebSlug, ensureScheme } from "./web-slug.ts";

test("caminho inteiro vira slug (sem colisão a/oferta vs b/oferta)", () => {
  assert.equal(deriveWebSlug("https://site.com/planos/anual/oferta"), "planos-anual-oferta");
  assert.notEqual(
    deriveWebSlug("https://site.com/a/oferta"),
    deriveWebSlug("https://site.com/b/oferta")
  );
});

test("homepage usa o HOST (não colide 'home' entre sites)", () => {
  assert.equal(deriveWebSlug("https://vercel.com/"), "vercel-com");
  assert.equal(deriveWebSlug("https://www.wikipedia.org/"), "wikipedia-org");
  // dois sites diferentes → slugs diferentes (era o bug do "home" duplicado)
  assert.notEqual(
    deriveWebSlug("https://vercel.com/"),
    deriveWebSlug("https://wikipedia.org/")
  );
});

test("normaliza acentos, espaços e maiúsculas; ignora query/hash", () => {
  assert.equal(deriveWebSlug("https://site.com/Promoção Especial?x=1#z"), "promocao-especial");
});

test("% solto não quebra a função", () => {
  // Garante que malformed URI (50%off) não lança exceção
  const result = deriveWebSlug("https://site.com/50%off");
  assert.equal(typeof result, "string");
  assert(result.length > 0, "slug não pode estar vazio");
});

test("ensureScheme completa https:// em domínio nu", () => {
  assert.equal(ensureScheme("qualquersite.com/x"), "https://qualquersite.com/x");
});

test("ensureScheme mantém http:// existente", () => {
  assert.equal(ensureScheme("http://x.com"), "http://x.com");
});

test("ensureScheme mantém https:// existente", () => {
  assert.equal(ensureScheme("https://x.com"), "https://x.com");
});

// ─── C1: slug de caminho não-latino não colapsa em "home" ───
test("caminho não-latino vira hash (não colide em 'home')", () => {
  const a = deriveWebSlug("https://site.ru/курс");
  const b = deriveWebSlug("https://site.ru/страница");
  assert.notEqual(a, "home");
  assert.notEqual(a, b); // dois caminhos diferentes → slugs diferentes
  assert.ok(a.startsWith("p-"));
});
test("homepage sem host derivável cai em 'home'", () => {
  assert.equal(deriveWebSlug("/"), "home");
});
