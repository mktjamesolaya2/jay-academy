import { test } from "node:test";
import assert from "node:assert/strict";
import { idadeDoHistorico, recadoDoHistorico, DIAS_ATE_AVISAR } from "./idade-do-historico.ts";

const AGORA = new Date("2026-08-19T12:00:00Z");
const diasAtras = (n: number) =>
  new Date(AGORA.getTime() - n * 86_400_000).toISOString();

test("nunca importado é um estado próprio, não 'muito velho'", () => {
  // ⚠️ São coisas diferentes pra quem lê: "nunca fizeram isso" pede uma
  // primeira vez; "está velho" pede uma repetição.
  assert.deepEqual(idadeDoHistorico(undefined, AGORA), { tipo: "nunca" });
  assert.deepEqual(idadeDoHistorico("", AGORA), { tipo: "nunca" });
  assert.deepEqual(idadeDoHistorico("data quebrada", AGORA), { tipo: "nunca" });
});

test("avisa a partir de 30 dias, não antes", () => {
  assert.equal(idadeDoHistorico(diasAtras(29), AGORA).tipo, "em-dia");
  assert.equal(idadeDoHistorico(diasAtras(DIAS_ATE_AVISAR), AGORA).tipo, "envelhecendo");
  assert.equal(idadeDoHistorico(diasAtras(90), AGORA).tipo, "envelhecendo");
});

test("data no futuro não vira 'há -3 dias'", () => {
  // ⚠️ Relógio errado ou fuso faria a conta dar negativo — e número negativo
  // numa tela faz quem lê desconfiar de tudo que está nela.
  const e = idadeDoHistorico(new Date(AGORA.getTime() + 3 * 86_400_000).toISOString(), AGORA);
  assert.equal(e.tipo, "em-dia");
  assert.equal((e as { dias: number }).dias, 0);
});

test("o recado diz a consequência, não só o número", () => {
  // "Importado há 45 dias" não move ninguém. "Quem comprou depois disso o
  // suporte não acha" move.
  const r = recadoDoHistorico(idadeDoHistorico(diasAtras(45), AGORA));
  assert.match(r, /45 dias/);
  assert.match(r, /não acha/);
  assert.match(recadoDoHistorico({ tipo: "nunca" }), /nunca foi importado/);
  assert.match(recadoDoHistorico(idadeDoHistorico(diasAtras(0), AGORA)), /hoje/);
  assert.match(recadoDoHistorico(idadeDoHistorico(diasAtras(1), AGORA)), /1 dia\b/);
});
