import { test } from "node:test";
import assert from "node:assert/strict";
import {
  montarPrompt,
  lerResposta,
  pediuHumano,
  MARCA_HUMANO,
} from "./suporte-prompt.ts";

/* ── o prompt ───────────────────────────────────────────────────────────── */

test("a base de conhecimento entra no prompt", () => {
  const p = montarPrompt("Basic Nanofios custa R$ 297.");
  assert.ok(p.includes("Basic Nanofios custa R$ 297."));
});

test("base vazia manda chamar uma pessoa — não deixa ela inventar", () => {
  const p = montarPrompt("   ");
  assert.ok(/você ainda não sabe nada/i.test(p));
});

test("proíbe inventar preço e prometer em nome da escola", () => {
  const p = montarPrompt("x");
  assert.ok(/Não invente preço/i.test(p));
  assert.ok(/Não promete nada em nome da escola/i.test(p));
});

test("deixa claro que ela nunca inicia conversa", () => {
  assert.ok(/não inicia conversa/i.test(montarPrompt("x")));
});

/* ── a leitura da resposta ──────────────────────────────────────────────── */

test("o marcador aciona o humano e some do texto do aluno", () => {
  const r = lerResposta(`Vou chamar alguém do time pra te ajudar. ${MARCA_HUMANO}`);
  assert.equal(r.precisaHumano, true);
  assert.equal(r.texto, "Vou chamar alguém do time pra te ajudar.");
  assert.ok(!r.texto.includes("["), "o aluno nunca pode ver o marcador");
});

test("resposta normal não aciona nada", () => {
  const r = lerResposta("O Basic Nanofios tem 13 módulos.");
  assert.equal(r.precisaHumano, false);
  assert.equal(r.texto, "O Basic Nanofios tem 13 módulos.");
});

test("variação do marcador também é limpa", () => {
  // o modelo às vezes escreve [humano] em vez de [HUMANO]
  const r = lerResposta("Já te transfiro [humano]");
  assert.ok(!r.texto.toLowerCase().includes("humano]"));
});

/* ── o atalho antes da IA ───────────────────────────────────────────────── */

test("pedido explícito de pessoa é pego antes de gastar a IA", () => {
  assert.equal(pediuHumano("quero falar com alguém"), true);
  assert.equal(pediuHumano("ME PASSA UM ATENDENTE"), true);
  assert.equal(pediuHumano("tem como falar com uma pessoa?"), true);
  assert.equal(pediuHumano("chama alguem ai"), true);
});

test("pergunta comum não é confundida com pedido de humano", () => {
  assert.equal(pediuHumano("quanto custa o Lips Sense?"), false);
  assert.equal(pediuHumano("não consigo assistir a aula 3"), false);
  assert.equal(pediuHumano("o acesso é vitalício?"), false);
});
