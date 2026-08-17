import { test } from "node:test";
import assert from "node:assert/strict";
import { venceEm, acessoVencido, diasRestantes } from "./hotmart-acesso.ts";

/**
 * ⚠️ O caso mais comum do suporte: a aluna diz que não consegue acessar e quase
 * sempre é o acesso de 12 meses que venceu sem ela perceber. Estas contas são o
 * que vai permitir responder isso na hora, em vez de perguntar e esperar.
 */

test("o acesso vence exatamente um ano depois da compra", () => {
  assert.equal(venceEm("2026-03-12T00:00:00Z").toISOString().slice(0, 10), "2027-03-12");
});

test("comprou há 13 meses: vencido", () => {
  assert.equal(acessoVencido("2025-06-01T00:00:00Z", new Date("2026-07-01T00:00:00Z")), true);
});

test("comprou há 6 meses: no prazo", () => {
  assert.equal(acessoVencido("2026-01-10T00:00:00Z", new Date("2026-07-10T00:00:00Z")), false);
});

test("no dia exato do vencimento ainda não venceu", () => {
  // ⚠️ Na dúvida, a favor da aluna: dizer "venceu" pra quem ainda tem acesso é
  // pior do que o contrário — ela para de estudar achando que perdeu.
  assert.equal(acessoVencido("2026-03-12T10:00:00Z", new Date("2027-03-12T09:00:00Z")), false);
});

test("um dia depois, vencido", () => {
  assert.equal(acessoVencido("2026-03-12T10:00:00Z", new Date("2027-03-13T11:00:00Z")), true);
});

test("ano bissexto não quebra a conta", () => {
  assert.equal(venceEm("2028-02-29T00:00:00Z").toISOString().slice(0, 4), "2029");
});

test("dias restantes ajuda a avisar antes de vencer", () => {
  const d = diasRestantes("2026-03-12T00:00:00Z", new Date("2027-03-02T00:00:00Z"));
  assert.equal(d, 10);
});

test("dias restantes fica negativo depois do vencimento", () => {
  const d = diasRestantes("2025-01-01T00:00:00Z", new Date("2026-02-01T00:00:00Z"));
  assert.ok(d < 0);
});
