import { test } from "node:test";
import assert from "node:assert/strict";
import {
  acharEmail,
  ehProblemaDeAcesso,
  avaliarAcesso,
  fatosDoAcesso,
  saudacao,
  primeiroNome,
} from "./suporte-acesso.ts";

const compra = (compradaEm: string, situacao = "approved") => [
  { produto: "Basic Nanofios", compradaEm, situacao },
];

/* ── achar o e-mail no meio da conversa ─────────────────────────────────── */

test("acha o e-mail solto na frase", () => {
  assert.equal(
    acharEmail("meu email é Maria.Silva@Gmail.com, obrigada"),
    "maria.silva@gmail.com"
  );
});

test("sem e-mail devolve null", () => {
  assert.equal(acharEmail("não consigo entrar no curso"), null);
});

/* ── reconhecer o problema de acesso ────────────────────────────────────── */

test("reconhece as formas que a aluna escreve de verdade", () => {
  assert.equal(ehProblemaDeAcesso("não estou conseguindo acessar meu curso"), true);
  assert.equal(ehProblemaDeAcesso("nao consigo entrar na plataforma"), true);
  assert.equal(ehProblemaDeAcesso("meu curso sumiu da plataforma"), true);
  assert.equal(ehProblemaDeAcesso("meu acesso expirou?"), true);
});

test("não confunde com outras dúvidas", () => {
  assert.equal(ehProblemaDeAcesso("onde fica a apostila?"), false);
  assert.equal(ehProblemaDeAcesso("quantos módulos tem?"), false);
});

/* ── a decisão, que NÃO passa pelo modelo ───────────────────────────────── */

test("sem e-mail: o passo é pedir o e-mail", () => {
  assert.equal(avaliarAcesso(null, [], new Date()).tipo, "sem-email");
});

test("dentro dos 12 meses: reenviar acesso", () => {
  const s = avaliarAcesso(
    "a@b.com",
    compra("2026-03-12T00:00:00Z"),
    new Date("2026-08-17T00:00:00Z")
  );
  assert.equal(s.tipo, "no-prazo");
});

test("passou dos 12 meses: acesso encerrado", () => {
  const s = avaliarAcesso(
    "a@b.com",
    compra("2024-01-10T00:00:00Z"),
    new Date("2026-08-17T00:00:00Z")
  );
  assert.equal(s.tipo, "vencido");
});

test("quem comprou de novo ganha o prazo da compra mais nova", () => {
  // ⚠️ Aluna que recomprou não pode ouvir "seu acesso venceu" por causa da
  // compra velha.
  const s = avaliarAcesso(
    "a@b.com",
    [
      { produto: "Basic Nanofios", compradaEm: "2023-01-01T00:00:00Z", situacao: "approved" },
      { produto: "Basic Nanofios", compradaEm: "2026-05-01T00:00:00Z", situacao: "approved" },
    ],
    new Date("2026-08-17T00:00:00Z")
  );
  assert.equal(s.tipo, "no-prazo");
});

test("compra cancelada não vira acesso ativo", () => {
  const s = avaliarAcesso(
    "a@b.com",
    compra("2026-05-01T00:00:00Z", "cancelled"),
    new Date("2026-08-17T00:00:00Z")
  );
  assert.equal(s.tipo, "cancelado");
});

test("e-mail que não comprou nada", () => {
  assert.equal(avaliarAcesso("a@b.com", [], new Date()).tipo, "nao-encontrado");
});

/* ── o que o modelo recebe ──────────────────────────────────────────────── */

test("no prazo: manda reenviar, e NÃO diz que venceu", () => {
  const f = fatosDoAcesso(
    avaliarAcesso("a@b.com", compra("2026-03-12T00:00:00Z"), new Date("2026-08-17T00:00:00Z"))
  );
  assert.match(f, /reenviar o acesso/i);
  assert.match(f, /NÃO é acesso vencido/i);
});

test("vencido: proíbe citar preço e oferecer plano", () => {
  // James: a IA é só suporte. Quem oferece qualquer coisa é a pessoa.
  const f = fatosDoAcesso(
    avaliarAcesso("a@b.com", compra("2024-01-10T00:00:00Z"), new Date("2026-08-17T00:00:00Z"))
  );
  assert.match(f, /NÃO cite\s+preço/i);
  assert.match(f, /NÃO ofereça plano/i);
});

test("cancelada: proíbe falar de reembolso", () => {
  const f = fatosDoAcesso(
    avaliarAcesso("a@b.com", compra("2026-05-01T00:00:00Z", "cancelled"), new Date("2026-08-17T00:00:00Z"))
  );
  assert.match(f, /NÃO fale de reembolso/i);
});

test("sem e-mail: manda pedir só o e-mail, sem chamar ninguém ainda", () => {
  const f = fatosDoAcesso({ tipo: "sem-email" });
  assert.match(f, /Peça o e-mail/i);
  assert.match(f, /não chame ninguém do time ainda/i);
});

/* ── saudação ───────────────────────────────────────────────────────────── */

test("saudação segue o horário de Brasília", () => {
  assert.equal(saudacao(new Date("2026-08-17T12:00:00Z")), "Bom dia"); // 9h BRT
  assert.equal(saudacao(new Date("2026-08-17T18:00:00Z")), "Boa tarde"); // 15h BRT
  assert.equal(saudacao(new Date("2026-08-18T01:00:00Z")), "Boa noite"); // 22h BRT
});

/* ── o nome da aluna ────────────────────────────────────────────────────── */

test("só o primeiro nome, e sem gritar", () => {
  // ⚠️ A Hotmart devolve em caixa alta. "Oi, RENATA!" parece grito; o nome
  // completo parece cadastro.
  assert.equal(primeiroNome("RENATA LIMA DE SOUZA"), "Renata");
  assert.equal(primeiroNome("ana paula"), "Ana");
  assert.equal(primeiroNome(""), null);
  assert.equal(primeiroNome(undefined), null);
});

test("o nome entra nos fatos, pra ela chamar pelo nome", () => {
  const f = fatosDoAcesso(
    avaliarAcesso(
      "a@b.com",
      [{ produto: "Basic Nanofios", compradaEm: "2026-03-12T00:00:00Z", situacao: "approved", nome: "MARIA SILVA" }],
      new Date("2026-08-17T00:00:00Z")
    )
  );
  assert.match(f, /se chama Maria/);
});
