import { test } from "node:test";
import assert from "node:assert/strict";
import { conversaPraAluna } from "./ajuda-visitante.ts";

/* ── o que a aluna vê ───────────────────────────────────────────────────── */

test("IA e pessoa do time aparecem como um atendimento só", () => {
  // ⚠️ Marcar "isto foi um robô" faria a aluna desconfiar da resposta certa e
  // pedir humano por reflexo, mesmo quando a resposta já resolvia.
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

test("conversa vazia não quebra", () => {
  const v = conversaPraAluna({ mensagens: [], aguardandoPessoa: false });
  assert.deepEqual(v, { mensagens: [], comPessoa: false });
});
