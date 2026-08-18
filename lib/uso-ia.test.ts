import { test } from "node:test";
import assert from "node:assert/strict";
import { limiteDoDia, chaveDoDia, percentual, nivel, recado } from "./uso-ia.ts";

test("sem IA_LIMITE_DIA não existe teto — e a tela não inventa um", () => {
  // ⚠️ Antes isto devolvia 250, um chute meu, e a tela mostrava "5 de 250"
  // como se fosse fato. O Google não tem endpoint de "quanto sobrou".
  assert.equal(limiteDoDia({}), null);
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "  " }), null);
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "zero" }), null);
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "0" }), null);
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "-5" }), null);
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "1000" }), 1000);
});

test("o dia é o de São Paulo, não o do servidor", () => {
  // 2h UTC do dia 18 ainda é 23h do dia 17 aqui — e o servidor roda em UTC.
  assert.equal(chaveDoDia(new Date("2026-08-18T02:00:00Z")), "suporte:uso:2026-08-17");
  assert.equal(chaveDoDia(new Date("2026-08-18T12:00:00Z")), "suporte:uso:2026-08-18");
});

test("sem teto, não há barra pra desenhar", () => {
  assert.equal(percentual(5, null), null);
  assert.equal(percentual(125, 250), 50);
  assert.equal(percentual(900, 250), 100);
  assert.equal(percentual(-3, 250), 0);
});

test('"parada" quer dizer que a IA não responde AGORA, não que passou de um número', () => {
  // ⚠️ O caso que o James viu: 5 respostas no dia e a tela gritando que a cota
  // acabou. Vermelho só quando o fornecedor recusou a fila inteira.
  assert.equal(nivel(5, null), "tranquilo");
  assert.equal(nivel(5, null, true), "parada");
  assert.equal(nivel(180, 250), "chegando");
  assert.equal(nivel(250, 250), "parada");
});

test("o recado não promete o que não sabe", () => {
  assert.match(recado(5, null), /de pé/);
  assert.ok(!recado(5, null).includes("250"));
  assert.match(recado(5, null, true), /acabou/);
  assert.match(recado(200, 250), /Faltam 50/);
});
