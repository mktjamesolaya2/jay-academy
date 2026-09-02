import test from "node:test";
import assert from "node:assert/strict";
import { normalizarTelefone, mensagemDeErro } from "./telefone.ts";

function ok(bruto: string) {
  const r = normalizarTelefone(bruto);
  assert.equal(r.ok, true, `esperava aceitar ${JSON.stringify(bruto)}`);
  return r as { ok: true; digitos: string; e164: string; pais: "BR" | "outro" };
}

function erro(bruto: string) {
  const r = normalizarTelefone(bruto);
  assert.equal(r.ok, false, `esperava recusar ${JSON.stringify(bruto)}`);
  return r as { ok: false; motivo: string };
}

test("o número que a máscara da LP produz passa e vira só dígitos", () => {
  const r = ok("+55 (11) 99999-8888");
  assert.equal(r.digitos, "5511999998888");
  assert.equal(r.pais, "BR");
});

test("celular brasileiro digitado sem DDI é reconhecido", () => {
  assert.equal(ok("11999998888").digitos, "5511999998888");
});

test("DDD 55 sobrevive — era o número que a máscara antiga destruía", () => {
  // "55 99999-8888" é Santa Maria/RS, não DDI. A versão anterior comia o 55.
  assert.equal(ok("55 99999-8888").digitos, "5555999998888");
  // E com o DDI junto continua sendo o mesmo telefone.
  assert.equal(ok("+55 55 99999-8888").digitos, "5555999998888");
});

test("fixo de 8 dígitos continua valendo", () => {
  assert.equal(ok("(11) 3333-4444").digitos, "551133334444");
});

test("celular sem o nono é recusado com motivo próprio", () => {
  assert.equal(erro("+55 (11) 89999-8888").motivo, "nono");
});

test("DDD impossível é recusado", () => {
  assert.equal(erro("+55 (01) 99999-8888").motivo, "ddd");
  assert.equal(erro("+55 (10) 99999-8888").motivo, "ddd");
});

test("brasileiro que esquece o DDD é avisado, não mandado como estrangeiro", () => {
  assert.equal(erro("99999-8888").motivo, "curto");
});

test("telefone de fora do Brasil passa sem palpite de formato", () => {
  const pt = ok("+351 912 345 678");
  assert.equal(pt.digitos, "351912345678");
  assert.equal(pt.pais, "outro");

  const us = ok("+1 (415) 555-0132");
  assert.equal(us.digitos, "14155550132");
  assert.equal(us.pais, "outro");

  assert.equal(ok("+44 20 7946 0958").pais, "outro");
});

test("faixa da E.164: curto demais e longo demais são recusados", () => {
  assert.equal(erro("+44 20").motivo, "curto");
  assert.equal(erro("+1 2345678901234567").motivo, "longo");
});

test("vazio e lixo sem dígito nenhum", () => {
  assert.equal(erro("").motivo, "vazio");
  assert.equal(erro("   ").motivo, "vazio");
  assert.equal(erro("meu whats").motivo, "vazio");
  assert.equal(erro("+55 ").motivo, "vazio");
});

test("o e164 é o que sai pro CRM — sem o + ele vira número brasileiro errado", () => {
  assert.equal(ok("+351 912 345 678").e164, "+351912345678");
  assert.equal(ok("11999998888").e164, "+5511999998888");
});

test("todo motivo tem uma mensagem em português pra mostrar na tela", () => {
  for (const motivo of ["vazio", "curto", "longo", "ddd", "nono"] as const) {
    const msg = mensagemDeErro(motivo);
    assert.ok(msg.length > 10, `mensagem fraca pra ${motivo}`);
    assert.ok(!/undefined/.test(msg));
  }
});
