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

test("o caso real que passou batido e quebrou um atendimento", () => {
  // ⚠️ Frase EXATA de uma conversa de verdade. A versão antiga exigia a
  // construção "não consigo acessar" e deixou passar. Como não detectou, a
  // consulta na Hotmart nunca rodou: a aluna deu o e-mail, ninguém nunca olhou
  // se ela tinha acesso, e a conversa foi empurrada pra uma pessoa.
  assert.equal(
    ehProblemaDeAcesso("estou com problemas para acessar o meu curso online"),
    true
  );
});

test("os outros jeitos de dizer a mesma coisa", () => {
  for (const f of [
    "problema no acesso",
    "meu curso não abre",
    "não carrega a aula",
    "perdi o acesso",
    "não recebi o email de acesso",
    "não chegou o link do curso",
    "minha senha não funciona",
    "a plataforma está fora do ar",
    "esqueci minha senha de login",
    "o vídeo não roda",
  ]) {
    assert.equal(ehProblemaDeAcesso(f), true, f);
  }
});

test("não confunde com outras dúvidas", () => {
  // ⚠️ Falso positivo custa caro: a IA passa a pedir o e-mail da compra pra
  // quem só queria saber onde está a apostila.
  for (const f of [
    "onde fica a apostila?",
    "quantos módulos tem?",
    "o curso tem certificado?",
    "qual a duração do curso?",
    "bom dia",
    "me chamo Nelza",
    "quero saber sobre o curso de nanofios",
  ]) {
    assert.equal(ehProblemaDeAcesso(f), false, f);
  }
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

test("e-mail não encontrado: DIZ que não achou, e não empurra pra atendente", () => {
  // ⚠️ Caso real: a aluna deu um e-mail que não existia e a conversa foi
  // direto pra uma pessoa, sem nunca dizer a ela o que tinha acontecido. James:
  // *"o certo seria ele mandar assim, não encontrei nenhum cadastro com esse
  // e-mail. Você pode me enviar de novo?"*
  const f = fatosDoAcesso(avaliarAcesso("nelza123@hotmail.com", [], new Date()));
  assert.match(f, /N[ÃA]O achamos compra/i);
  assert.match(f, /conferir/i);
  assert.match(f, /N[ÃA]O chame uma pessoa/i);
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
