import { test } from "node:test";
import assert from "node:assert/strict";
import { isReservedSlug } from "./reserved-slugs.ts";

test("rotas do sistema são reservadas", () => {
  assert.equal(isReservedSlug("dashboard"), true);
  assert.equal(isReservedSlug("login"), true);
  assert.equal(isReservedSlug("wp-pages"), true);
  assert.equal(isReservedSlug(""), true);
});
test("LP estática é reservada", () => {
  assert.equal(isReservedSlug("pmuclass"), true);
});
test("slug normal de cópia NÃO é reservado", () => {
  assert.equal(isReservedSlug("oferta-especial"), false);
  assert.equal(isReservedSlug("curso-sobrancelha"), false);
});
