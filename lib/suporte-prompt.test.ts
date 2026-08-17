import { test } from "node:test";
import assert from "node:assert/strict";
import {
  montarPrompt,
  lerResposta,
  pediuHumano,
  limparVazamento,
  resumoPraAtendente,
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

test("proíbe falar da própria base pro aluno", () => {
  // ⚠️ Na primeira bateria ela respondeu "não temos isso na base que eu
  // conheço". O aluno não tem nada a ver com como a gente guarda a informação.
  const p = montarPrompt("x");
  assert.ok(/Não fale da sua "base"/i.test(p));
  assert.ok(/não tenho na minha base/i.test(p), "traz o exemplo do que é errado");
});

/* ── o vazamento do "na base" ───────────────────────────────────────────── */

test("tira a menção à base — as frases que ela realmente falou", () => {
  // ⚠️ Estas duas saíram da bateria de teste, em produção do modelo grátis:
  // primeiro "na base que eu conheço"; depois de eu proibir no prompt, ela
  // trocou pra "na base atual". Por isso a limpeza é no código.
  assert.equal(
    limparVazamento("Não temos curso de cílios na base que eu conheço, vou chamar alguém"),
    "Não temos curso de cílios, vou chamar alguém"
  );
  assert.equal(
    limparVazamento("Não temos curso de cílios na base atual, vou chamar alguém"),
    "Não temos curso de cílios, vou chamar alguém"
  );
});

test("pega as outras formas de dizer a mesma coisa", () => {
  assert.ok(!/base/i.test(limparVazamento("Isso não está na minha base de conhecimento.")));
  assert.ok(!/base/i.test(limparVazamento("Não consta na nossa base de dados.")));
});

test("não mutila resposta boa", () => {
  const ok = "O Basic Nanofios tem 13 módulos e custa R$ 297.";
  assert.equal(limparVazamento(ok), ok);
});

test("a limpeza roda junto com a leitura da resposta", () => {
  const r = lerResposta(`Não temos isso na base atual ${MARCA_HUMANO}`);
  assert.ok(!/base/i.test(r.texto));
  assert.equal(r.precisaHumano, true);
});

/* ── o resumo pro atendente ─────────────────────────────────────────────── */

test("resumo com uma mensagem só é a própria mensagem", () => {
  const r = resumoPraAtendente([{ de: "aluno", texto: "não consigo entrar no curso" }]);
  assert.equal(r, "não consigo entrar no curso");
});

test("resumo com várias mostra do que começou ao que virou", () => {
  const r = resumoPraAtendente([
    { de: "aluno", texto: "comprei dois cursos" },
    { de: "ia", texto: "que bom!" },
    { de: "aluno", texto: "deu erro no cartão e quero reembolso" },
  ]);
  assert.ok(r.startsWith("comprei dois cursos"));
  assert.ok(r.includes("reembolso"));
  assert.ok(r.includes("→"));
});

test("resumo ignora o que a IA falou — só o aluno importa", () => {
  const r = resumoPraAtendente([
    { de: "ia", texto: "Oi! Como posso ajudar?" },
    { de: "aluno", texto: "quero falar com atendente" },
  ]);
  assert.equal(r, "quero falar com atendente");
});

test("resumo corta mensagem quilométrica", () => {
  const r = resumoPraAtendente([{ de: "aluno", texto: "a".repeat(300) }]);
  assert.ok(r.length < 100);
  assert.ok(r.endsWith("…"));
});
