import { test } from "node:test";
import assert from "node:assert/strict";
import { faltaEsperar, MIN_MS, MAX_MS } from "./ritmo-resposta.ts";

test("resposta instantânea espera até o mínimo", () => {
  // ⚠️ 400ms de resposta entrega que é robô. O piso segura.
  assert.equal(faltaEsperar(0, 0), MIN_MS);
  assert.equal(faltaEsperar(500, 0), MIN_MS - 500);
});

test("o sorteio fica entre 3 e 5 segundos", () => {
  assert.equal(faltaEsperar(0, 0), MIN_MS);
  assert.equal(faltaEsperar(0, 1), MAX_MS);
  assert.equal(faltaEsperar(0, 0.5), (MIN_MS + MAX_MS) / 2);
});

test("é PISO, não soma: quem já esperou não espera de novo", () => {
  // ⚠️ Somar puniria justamente quem já ficou olhando a tela.
  assert.equal(faltaEsperar(6000, 1), 0);
  assert.equal(faltaEsperar(99999, 0.5), 0);
});

test("tempo estranho não vira espera negativa nem eterna", () => {
  assert.equal(faltaEsperar(-500, 0), MIN_MS);
  assert.ok(faltaEsperar(0, 5) <= MAX_MS);
  assert.ok(faltaEsperar(0, -3) >= MIN_MS);
});
