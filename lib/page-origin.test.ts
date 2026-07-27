import { test } from "node:test";
import assert from "node:assert/strict";
import { pageOriginLabel } from "./page-origin.ts";

test("WP mostra o dominio jayacademy correto", () => {
  assert.equal(pageOriginLabel({ sourceKind: "wp", domain: "main" }), "Migrada do WP · jayacademy.com.br");
  assert.equal(pageOriginLabel({ sourceKind: "lp" as never, domain: "lp" }), "Migrada do WP · lp.jayacademy.com.br");
});

test("web mostra o host da origem, nunca jayacademy", () => {
  const label = pageOriginLabel({ sourceKind: "web", domain: "site.com", sourceUrl: "https://site.com/oferta" });
  assert.equal(label, "Copiada da web · site.com");
  assert.ok(!label.includes("jayacademy"));
});

test("registro antigo sem sourceKind cai como WP (default)", () => {
  assert.equal(pageOriginLabel({ domain: "main" }), "Migrada do WP · jayacademy.com.br");
});
