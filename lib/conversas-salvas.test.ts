import { test } from "node:test";
import assert from "node:assert/strict";
import { assuntoDaConversa, quando } from "./conversas-salvas.ts";

test("o assunto é o que ELA escreveu, não o que a IA respondeu", () => {
  // ⚠️ "não consigo acessar meu curso" diz muito mais do que "Boa noite! Aqui
  // é o suporte da Jay Academy" — e é o que ela reconhece na lista.
  const a = assuntoDaConversa([
    { de: "atendente", texto: "Boa noite! Aqui é o suporte da Jay Academy." },
    { de: "aluno", texto: "não consigo acessar meu curso" },
    { de: "atendente", texto: "Me passa o e-mail?" },
  ]);
  assert.equal(a, "não consigo acessar meu curso");
});

test("assunto comprido é cortado em palavra inteira", () => {
  const a = assuntoDaConversa([
    { de: "aluno", texto: "eu comprei o curso de nanofios em junho e não estou conseguindo entrar" },
  ]);
  assert.ok(a.length <= 45, a);
  assert.match(a, /…$/);
  assert.ok(!/\s…$/.test(a), "não pode sobrar espaço antes das reticências");
});

test("conversa sem fala dela ainda tem nome", () => {
  // Ela abriu e não escreveu nada — a lista não pode mostrar vazio.
  assert.equal(assuntoDaConversa([{ de: "atendente", texto: "Oi!" }]), "Conversa");
  assert.equal(assuntoDaConversa([]), "Conversa");
});

test("a data é do jeito que gente fala", () => {
  const agora = new Date("2026-08-19T15:00:00");
  assert.equal(quando("2026-08-19T09:00:00", agora), "hoje");
  assert.equal(quando("2026-08-18T23:00:00", agora), "ontem");
  assert.equal(quando("2026-08-16T10:00:00", agora), "há 3 dias");
  assert.match(quando("2026-07-02T10:00:00", agora), /02\/07/);
});

test("data quebrada não vira 'Invalid Date' na tela dela", () => {
  assert.equal(quando("nao-e-data"), "");
});
