import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aceita,
  cabecalhos,
  corpoPara,
  urlSegura,
  montarPayload,
  type Destino,
} from "./lead-destinos-core.ts";
import { mapeamentoSugerido, type Lead } from "./lead-campos.ts";

const lead = (extra: Partial<Lead> = {}): Lead => ({
  id: "lead-1",
  nome: "Maria",
  email: "maria@exemplo.com",
  telefone: "11999999999",
  enviado_em: "2026-08-11T12:00:00.000Z",
  tags: ["nanofios"],
  campos: {},
  ...extra,
});

const destino = (extra: Partial<Destino> = {}): Destino => ({
  id: "d1",
  nome: "CRM",
  url: "https://crm.exemplo.com/webhook/abc",
  ativo: true,
  mapeamento: {},
  ...extra,
});

/* ── mapeamento e payload ───────────────────────────────────────────────── */

test("cada destino recebe o lead com os NOMES DELE", () => {
  const clint = corpoPara(destino({ mapeamento: { nome: "name", telefone: "phone" } }), lead());
  const crm = corpoPara(destino({ mapeamento: { nome: "nome_completo", telefone: "celular" } }), lead());
  assert.equal(clint.name, "Maria");
  assert.equal(clint.phone, "11999999999");
  assert.equal(crm.nome_completo, "Maria");
  assert.equal(crm.celular, "11999999999");
});

test("campo vazio não vai — CRM recusa o lead inteiro por um CPF em branco", () => {
  const corpo = corpoPara(destino(), lead({ campos: { documento: "", cidade: "Recife" } }));
  assert.ok(!("documento" in corpo));
  assert.equal(corpo.cidade, "Recife");
});

test("o id sempre viaja: é ele que evita lead duplicado no CRM", () => {
  assert.equal(corpoPara(destino(), lead()).id, "lead-1");
});

test("campo fora do catálogo não se perde", () => {
  // se o Lucas pedir um campo novo amanhã, ele passa sem mexer em código
  const corpo = corpoPara(destino(), lead({ campos: { campo_novo_do_lucas: "valor" } }));
  assert.equal(corpo.campo_novo_do_lucas, "valor");
});

test("mapeamento sugerido cobre o catálogo inteiro", () => {
  const m = mapeamentoSugerido();
  assert.equal(m.nome, "name");
  assert.equal(m.telefone, "phone");
  assert.equal(m.estilo_sobrancelha, "estilo_sobrancelha", "sem sugestão, mantém o nosso nome");
});

/* ── tags ───────────────────────────────────────────────────────────────── */

test("tags do destino somam com as do lead, sem repetir", () => {
  const corpo = corpoPara(
    destino({ tagsFixas: ["crm-novo", "nanofios"] }),
    lead({ tags: ["nanofios", "instagram"] })
  );
  assert.deepEqual(corpo.tags, ["nanofios", "instagram", "crm-novo"]);
});

/* ── extras (etapa, status) ─────────────────────────────────────────────── */

test("extras do destino mandam sobre o mapeamento", () => {
  const corpo = corpoPara(
    destino({ extras: { etapa: "Base", status: "Aberto" } }),
    lead()
  );
  assert.equal(corpo.etapa, "Base");
  assert.equal(corpo.status, "Aberto");
});

/* ── autenticação ───────────────────────────────────────────────────────── */

test("autenticação: bearer, header próprio e nenhuma", () => {
  assert.equal(cabecalhos(destino({ auth: { tipo: "bearer", valor: "abc" } })).Authorization, "Bearer abc");
  assert.equal(
    cabecalhos(destino({ auth: { tipo: "header", header: "x-api-key", valor: "k1" } }))["x-api-key"],
    "k1"
  );
  const semAuth = cabecalhos(destino());
  assert.equal(semAuth.Authorization, undefined);
  assert.equal(semAuth["Content-Type"], "application/json");
});

/* ── filtro por origem ──────────────────────────────────────────────────── */

test("destino sem filtro recebe de todo formulário", () => {
  assert.equal(aceita(destino(), "basic-nanofios"), true);
});

test("destino com filtro só recebe do que foi escolhido", () => {
  const d = destino({ somenteDe: ["basic-nanofios"] });
  assert.equal(aceita(d, "basic-nanofios"), true);
  assert.equal(aceita(d, "academy"), false);
});

test("destino desligado não recebe nada", () => {
  assert.equal(aceita(destino({ ativo: false }), "basic-nanofios"), false);
});

/* ── segredo ────────────────────────────────────────────────────────────── */

test("a url some do log — no Clint o link É a senha", () => {
  const s = urlSegura(
    "https://functions-api.clint.digital/endpoints/integration/webhook/d6d5963f-f0b5-4967-9417-25b644efa25e"
  );
  assert.ok(s.startsWith("functions-api.clint.digital/"));
  assert.ok(!s.includes("25b644efa25e"), "o identificador inteiro não pode aparecer");
  assert.ok(s.includes("d6d5") && s.includes("a25e"), "mostra as pontas pra dar pra reconhecer");
});

test("montarPayload não quebra com lead vazio", () => {
  const corpo = montarPayload(
    { id: "x", nome: "", email: "", telefone: "", enviado_em: "", tags: [], campos: {} },
    {}
  );
  assert.deepEqual(Object.keys(corpo), ["id"]);
});
