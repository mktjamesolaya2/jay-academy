import { test } from "node:test";
import assert from "node:assert/strict";
import {
  minutosDesde,
  espera,
  previa,
  ordenarCaixa,
  quantosEsperando,
  montarLinha,
  type ConversaResumo,
} from "./caixa-conversas.ts";

const AGORA = new Date("2026-08-17T18:00:00Z");
const min = (n: number) => new Date(AGORA.getTime() - n * 60000).toISOString();

const conversa = (
  id: string,
  aguardandoPessoa: boolean,
  minutosAtras: number,
  quem = "Ana"
): ConversaResumo => ({
  id,
  quem,
  aguardandoPessoa,
  mensagens: [{ de: "aluno", texto: "não consigo acessar", em: min(minutosAtras) }],
  atualizadaEm: min(minutosAtras),
});

/* ── a ordem, que é o ponto da tela ─────────────────────────────────────── */

test("quem espera uma pessoa vem antes de quem a IA já resolveu", () => {
  const linhas = ordenarCaixa(
    [conversa("resolvida", false, 1), conversa("esperando", true, 90)],
    AGORA
  );
  assert.deepEqual(
    linhas.map((l) => l.id),
    ["esperando", "resolvida"]
  );
});

test("entre quem espera, o que espera HÁ MAIS TEMPO fica no topo", () => {
  // ⚠️ É o contrário da caixa de e-mail comum (mais recente primeiro). Quem
  // espera há mais tempo é quem está prestes a desistir — e desistir aqui vira
  // "alguém aí???" ou pedido de reembolso.
  const linhas = ordenarCaixa(
    [
      conversa("nova", true, 3),
      conversa("velha", true, 120),
      conversa("media", true, 40),
    ],
    AGORA
  );
  assert.deepEqual(
    linhas.map((l) => l.id),
    ["velha", "media", "nova"]
  );
});

test("entre as resolvidas, a mais recente primeiro", () => {
  const linhas = ordenarCaixa(
    [conversa("antiga", false, 300), conversa("recente", false, 5)],
    AGORA
  );
  assert.deepEqual(
    linhas.map((l) => l.id),
    ["recente", "antiga"]
  );
});

test("caixa vazia não quebra", () => {
  assert.deepEqual(ordenarCaixa([], AGORA), []);
});

/* ── o contador ─────────────────────────────────────────────────────────── */

test("conta só quem está esperando", () => {
  const linhas = ordenarCaixa(
    [conversa("a", true, 10), conversa("b", false, 10), conversa("c", true, 20)],
    AGORA
  );
  assert.equal(quantosEsperando(linhas), 2);
});

/* ── o tempo em português ───────────────────────────────────────────────── */

test("a espera é dita como gente fala", () => {
  assert.equal(espera(0), "agora");
  assert.equal(espera(7), "há 7 min");
  assert.equal(espera(60), "há 1 h");
  assert.equal(espera(200), "há 3 h");
  assert.equal(espera(1440), "há 1 dia");
  assert.equal(espera(4320), "há 3 dias");
});

test("data futura ou estragada não vira número negativo na tela", () => {
  assert.equal(minutosDesde(new Date(AGORA.getTime() + 60000).toISOString(), AGORA), 0);
  assert.equal(minutosDesde("não é data", AGORA), 0);
});

/* ── a prévia ───────────────────────────────────────────────────────────── */

test("prévia longa é cortada sem partir palavra no meio", () => {
  const p = previa("a".repeat(20) + " " + "palavra ".repeat(30));
  assert.ok(p.length <= 91, p.length.toString());
  assert.ok(p.endsWith("…"));
  assert.ok(!p.includes("  "));
});

test("quebra de linha não estoura a linha da lista", () => {
  assert.equal(previa("oi\n\nnão   consigo\tentrar"), "oi não consigo entrar");
});

test("prévia curta fica inteira, sem reticências", () => {
  assert.equal(previa("meu acesso venceu?"), "meu acesso venceu?");
});

/* ── a linha ────────────────────────────────────────────────────────────── */

test("a linha mostra quem falou por último — se foi a aluna, ninguém respondeu", () => {
  const l = montarLinha(
    {
      id: "x",
      quem: "Renata",
      emailAluna: "r@b.com",
      aguardandoPessoa: true,
      mensagens: [
        { de: "aluno", texto: "oi", em: min(30) },
        { de: "aluno", texto: "alguém aí?", em: min(10) },
      ],
      atualizadaEm: min(10),
    },
    AGORA
  );
  assert.equal(l.ultimaDe, "aluno");
  assert.equal(l.previa, "alguém aí?");
  assert.equal(l.minutos, 10);
  assert.equal(l.email, "r@b.com");
});

test("conversa sem mensagem nenhuma não quebra a lista", () => {
  const l = montarLinha(
    { id: "x", quem: "Ana", aguardandoPessoa: false, mensagens: [], atualizadaEm: min(5) },
    AGORA
  );
  assert.equal(l.previa, "(sem mensagens)");
  assert.equal(l.minutos, 5);
});
