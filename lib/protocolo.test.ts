import { test } from "node:test";
import assert from "node:assert/strict";
import { protocoloDe, combinaBusca, limparBusca } from "./protocolo.ts";

const CONVERSA = {
  id: "b4b39d37-d35d-458b-8cf6-eaa96b33d809",
  quem: "Renata Lima",
  emailAluna: "renata@exemplo.com",
};

test("o protocolo sai do id — igual em todo lugar, sem guardar nada", () => {
  assert.equal(protocoloDe(CONVERSA.id), "B4B39D");
  // ⚠️ Tem que ser o MESMO que vai na mensagem do WhatsApp. Se um dia os dois
  // se separarem, ela dita um número que não acha nada.
  assert.equal(protocoloDe("15f16216-2434-4ef0-989a-3539fabcc0ac"), "15F162");
  assert.equal(protocoloDe(""), "");
});

test("acha pelo protocolo, do jeito que ela vai mandar", () => {
  assert.ok(combinaBusca(CONVERSA, "B4B39D"));
  assert.ok(combinaBusca(CONVERSA, "b4b39d"));
  assert.ok(combinaBusca(CONVERSA, " #B4B39D "), "colado do WhatsApp com # e espaço");
  assert.ok(combinaBusca(CONVERSA, "B4B"), "começou a digitar");
  assert.ok(!combinaBusca(CONVERSA, "ZZZZZZ"));
});

test("acha pelo nome e pelo e-mail", () => {
  assert.ok(combinaBusca(CONVERSA, "renata"));
  assert.ok(combinaBusca(CONVERSA, "Lima"));
  assert.ok(combinaBusca(CONVERSA, "renata@exemplo.com"));
  assert.ok(combinaBusca(CONVERSA, "@exemplo"));
  assert.ok(!combinaBusca(CONVERSA, "joana"));
});

test("busca vazia mostra tudo — a lista não some enquanto ele pensa", () => {
  assert.ok(combinaBusca(CONVERSA, ""));
  assert.ok(combinaBusca(CONVERSA, "   "));
  assert.equal(limparBusca("  ABC  "), "abc");
});

test("conversa sem nome e sem e-mail não quebra a busca", () => {
  const crua = { id: "abc12345-0000-0000-0000-000000000000" };
  assert.ok(combinaBusca(crua, "ABC123"));
  assert.ok(!combinaBusca(crua, "renata"));
});

/* ── o nome antes do encaminhamento ──────────────────────────────────────── */

import { passoDoEncaminhamento, recadoDeEncaminhamento, perguntaDoNome } from "./protocolo.ts";

test("sem nome, ela pergunta antes de transferir", () => {
  assert.equal(
    passoDoEncaminhamento({ precisaHumano: true, temNome: false, jaPediuNome: false }),
    "pedir-nome"
  );
});

test("com nome, transfere direto — não enche o saco de novo", () => {
  assert.equal(
    passoDoEncaminhamento({ precisaHumano: true, temNome: true, jaPediuNome: false }),
    "encaminhar"
  );
});

test("se ela não quis dizer o nome, transfere assim mesmo", () => {
  // ⚠️ Insistir prenderia numa conversa em que ela já pediu uma pessoa. Melhor
  // encaminhar sem nome do que virar um formulário.
  assert.equal(
    passoDoEncaminhamento({ precisaHumano: true, temNome: false, jaPediuNome: true }),
    "encaminhar"
  );
});

test("conversa normal segue sem nada disso", () => {
  assert.equal(
    passoDoEncaminhamento({ precisaHumano: false, temNome: false, jaPediuNome: false }),
    "seguir"
  );
});

test("o recado entrega o protocolo escrito pra ela", () => {
  // ⚠️ Na tela também, não só no botão: se ela fechar a página antes de
  // clicar, o número ainda está com ela.
  const r = recadoDeEncaminhamento("b4b39d37-d35d-458b");
  assert.match(r, /B4B39D/);
  assert.match(perguntaDoNome(), /nome/i);
});

test("o encaminhamento parado no nome não se perde", () => {
  // ⚠️ O caso que quebra tudo: ela pediu uma pessoa, a IA perguntou o nome,
  // ela respondeu "Renata". Nessa volta o modelo NÃO vai pedir pessoa de novo
  // (a mensagem só tem um nome). Quem segura o encaminhamento é o `jaPediuNome`
  // entrando como "precisa humano" — senão ela fica conversando com a IA
  // achando que já foi passada pra alguém.
  const precisaHumano = true; // é o que o cérebro monta com pediuNome ligado
  assert.equal(
    passoDoEncaminhamento({ precisaHumano, temNome: true, jaPediuNome: true }),
    "encaminhar"
  );
});
