import { test } from "node:test";
import assert from "node:assert/strict";
import {
  limparNome,
  limparEmail,
  lerVisitante,
  conversaPraAluna,
} from "./ajuda-visitante.ts";

/* ── o nome ─────────────────────────────────────────────────────────────── */

test("aceita o nome do jeito que a pessoa digita", () => {
  assert.equal(limparNome("  Ana  Paula  "), "Ana Paula");
  assert.equal(limparNome("Renata"), "Renata");
});

test("nome com quebra de linha não bagunça a lista nem o resumo do sino", () => {
  assert.equal(limparNome("Ana\nPaula"), "Ana Paula");
  assert.equal(limparNome("Ana\tPaula\r"), "Ana Paula");
});

test("nome gigante é cortado — senão quebra a caixa de entrada", () => {
  assert.equal(limparNome("a".repeat(500))!.length, 60);
});

test("nome vazio ou de uma letra não passa", () => {
  assert.equal(limparNome("  "), null);
  assert.equal(limparNome("A"), null);
  assert.equal(limparNome(123), null);
  assert.equal(limparNome(undefined), null);
});

/* ── o e-mail ───────────────────────────────────────────────────────────── */

test("e-mail vira minúsculo — é assim que a compra é procurada na Hotmart", () => {
  // "Maria@" e "maria@" têm que achar a mesma pessoa.
  assert.equal(limparEmail("  Maria.Silva@Gmail.COM "), "maria.silva@gmail.com");
});

test("e-mail sem cara de e-mail não passa", () => {
  assert.equal(limparEmail("maria"), null);
  assert.equal(limparEmail("maria@"), null);
  assert.equal(limparEmail("maria@gmail"), null);
  assert.equal(limparEmail(""), null);
  assert.equal(limparEmail(null), null);
});

/* ── a entrada ──────────────────────────────────────────────────────────── */

test("entrada completa passa", () => {
  const r = lerVisitante({ nome: "Ana Paula", email: "ANA@teste.com" });
  assert.deepEqual(r, {
    ok: true,
    visitante: { nome: "Ana Paula", email: "ana@teste.com" },
  });
});

test("o que falta é dito em português, porque vai direto pra tela da aluna", () => {
  const semNome = lerVisitante({ email: "a@b.com" });
  assert.equal(semNome.ok, false);
  assert.match((semNome as { erro: string }).erro, /nome/i);
  assert.ok(!/invalid|error|null/i.test((semNome as { erro: string }).erro));

  const semEmail = lerVisitante({ nome: "Ana" });
  assert.equal(semEmail.ok, false);
  assert.match((semEmail as { erro: string }).erro, /e-mail/i);
});

test("corpo vazio ou lixo não derruba a rota", () => {
  assert.equal(lerVisitante(null).ok, false);
  assert.equal(lerVisitante("texto solto").ok, false);
  assert.equal(lerVisitante({ nome: [], email: {} }).ok, false);
});

/* ── o que a aluna vê ───────────────────────────────────────────────────── */

test("IA e pessoa do time aparecem como um atendimento só", () => {
  // ⚠️ Marcar "isto foi um robô" faria a aluna desconfiar da resposta certa.
  const v = conversaPraAluna({
    mensagens: [
      { de: "aluno", texto: "oi", em: "1" },
      { de: "ia", texto: "Oi! Como posso ajudar?", em: "2" },
      { de: "pessoa", texto: "Aqui é a Bia", em: "3" },
    ],
    aguardandoPessoa: true,
  });
  assert.deepEqual(
    v.mensagens.map((m) => m.de),
    ["aluno", "atendente", "atendente"]
  );
  assert.equal(v.comPessoa, true);
});

test("só sai o que foi escolhido — campo interno não vaza pro navegador", () => {
  // ⚠️ Lista branca: devolver a conversa inteira faria qualquer campo novo que
  // a gente criar amanhã aparecer no navegador sem ninguém decidir isso.
  const v = conversaPraAluna({
    mensagens: [{ de: "aluno", texto: "oi", em: "1" }],
    aguardandoPessoa: false,
    // campos internos que NÃO podem sair
    emailAluna: "a@b.com",
    assuntoAcesso: true,
    quem: "Ana",
  } as never);
  assert.deepEqual(Object.keys(v).sort(), ["comPessoa", "mensagens"]);
  assert.deepEqual(Object.keys(v.mensagens[0]).sort(), ["de", "em", "texto"]);
});
