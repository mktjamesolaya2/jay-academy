import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIMITE_PADRAO,
  limiteDoDia,
  chaveDoDia,
  percentual,
  nivel,
  recado,
} from "./uso-ia.ts";

test("o limite vem da variável, e cai no padrão quando ela não presta", () => {
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "1000" }), 1000);
  assert.equal(limiteDoDia({}), LIMITE_PADRAO);
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "  " }), LIMITE_PADRAO);
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "zero" }), LIMITE_PADRAO);
  // ⚠️ Zero e negativo viram padrão: limite 0 faria a barra nascer estourada
  // todo dia, e barra que grita sempre ninguém mais olha.
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "0" }), LIMITE_PADRAO);
  assert.equal(limiteDoDia({ IA_LIMITE_DIA: "-5" }), LIMITE_PADRAO);
});

test("o dia é o de São Paulo, não o do servidor", () => {
  // 2h UTC do dia 18 ainda é 23h do dia 17 aqui — e o servidor roda em UTC.
  // (São Paulo é UTC-3, então 3h UTC já é a virada; 2h ainda é ontem.)
  assert.equal(chaveDoDia(new Date("2026-08-18T02:00:00Z")), "suporte:uso:2026-08-17");
  assert.equal(chaveDoDia(new Date("2026-08-18T12:00:00Z")), "suporte:uso:2026-08-18");
});

test("a barra nunca vaza nem fica negativa", () => {
  assert.equal(percentual(0, 250), 0);
  assert.equal(percentual(125, 250), 50);
  assert.equal(percentual(900, 250), 100);
  assert.equal(percentual(-3, 250), 0);
  assert.equal(percentual(10, 0), 0);
});

test("o 429 do fornecedor ganha do palpite do limite", () => {
  // ⚠️ Mostrar "tranquilo" enquanto a IA não responde ninguém seria o pior
  // erro possível desta tela — é justamente a hora de olhar pra ela.
  assert.equal(nivel(3, 250, true), "estourou");
  assert.equal(nivel(3, 250), "tranquilo");
  assert.equal(nivel(180, 250), "chegando");
  assert.equal(nivel(250, 250), "estourou");
});

test("o recado fala do que sobrou quando está apertando", () => {
  assert.match(recado(10, 250), /10 de 250/);
  assert.match(recado(200, 250), /Faltam 50/);
  assert.match(recado(5, 250, true), /acabou/);
});
