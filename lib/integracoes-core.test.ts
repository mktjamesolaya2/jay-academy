import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aplicarMapeamento,
  corpoParaOCrm,
  urlDoCrm,
  chaveSegura,
  temTelefone,
  explicarResposta,
  BASE_CRM,
  type ConfigIntegracao,
} from "./integracoes-core.ts";
import type { Lead } from "./lead-campos.ts";

const cfg = (extra: Partial<ConfigIntegracao> = {}): ConfigIntegracao => ({
  nome: "LP NanoFios",
  mapeamento: [
    { doFormulario: "name", paraOCrm: "nome" },
    { doFormulario: "email", paraOCrm: "email" },
    { doFormulario: "whatsapp", paraOCrm: "telefone" },
  ],
  tags: [],
  ...extra,
});

const lead: Lead = {
  id: "lead-1",
  nome: "Maria",
  email: "m@e.com",
  telefone: "11999998888",
  enviado_em: "2026-08-11T12:00:00.000Z",
  tags: [],
  campos: {},
};

/* ── mapeamento ─────────────────────────────────────────────────────────── */

test("renomeia o campo do formulário pro campo do CRM", () => {
  const r = aplicarMapeamento(
    { name: "Maria", email: "m@e.com", whatsapp: "11999998888" },
    cfg().mapeamento
  );
  assert.deepEqual(r, { nome: "Maria", email: "m@e.com", telefone: "11999998888" });
});

test("campo não mapeado passa direto — no CRM ele vira nota", () => {
  const r = aplicarMapeamento({ name: "Maria", curso_de_interesse: "NanoFios" }, cfg().mapeamento);
  assert.equal(r.nome, "Maria");
  assert.equal(r.curso_de_interesse, "NanoFios");
});

test("a isca de robô nunca viaja pro CRM", () => {
  const r = aplicarMapeamento({ name: "Maria", _gotcha: "" , "form_fields[_gotcha]": "x" }, cfg().mapeamento);
  assert.ok(!("_gotcha" in r));
  assert.equal(Object.keys(r).length, 1);
});

test("não diferencia maiúscula nem sofre com form_fields[...] do Elementor", () => {
  const r = aplicarMapeamento({ "form_fields[Name]": "Ana", " WHATSAPP ": "11955554444" }, cfg().mapeamento);
  assert.equal(r.nome, "Ana");
  assert.equal(r.telefone, "11955554444");
});

/* ── corpo pro CRM ──────────────────────────────────────────────────────── */

test("o corpo sai no formato do endpoint do Lucas", () => {
  const corpo = corpoParaOCrm(cfg(), lead, {
    nome: "Maria",
    telefone: "11999998888",
    email: "m@e.com",
    utm_source: "meta",
  });
  assert.equal(corpo.nome, "Maria");
  assert.equal(corpo.telefone, "11999998888");
  assert.equal(corpo.utm_source, "meta", "utm_source vira a origem do negócio no CRM");
  assert.equal(corpo.origem_formulario, "LP NanoFios");
});

test("etapa e status NÃO viajam — eles moram na chave, lá no CRM", () => {
  const corpo = corpoParaOCrm(cfg(), lead, { nome: "Maria", telefone: "11999998888" });
  assert.ok(!("etapa" in corpo));
  assert.ok(!("status" in corpo));
  assert.ok(!("responsavel" in corpo));
});

test("campo vazio não vai", () => {
  const corpo = corpoParaOCrm(cfg(), { ...lead, email: "" }, { nome: "Maria", telefone: "11" });
  assert.ok(!("email" in corpo));
});

/* ── telefone: é o que identifica a pessoa ──────────────────────────────── */

test("telefone sem DDD não passa — o CRM devolveria 422", () => {
  assert.equal(temTelefone({ telefone: "11999998888" }), true);
  assert.equal(temTelefone({ telefone: "+55 (11) 99999-8888" }), true);
  assert.equal(temTelefone({ telefone: "99998888" }), false);
  assert.equal(temTelefone({}), false);
});

/* ── chave ──────────────────────────────────────────────────────────────── */

test("aceita colar a chave sozinha ou a URL inteira", () => {
  assert.equal(urlDoCrm("pk_abc123"), BASE_CRM + "pk_abc123");
  assert.equal(
    urlDoCrm("https://www.sistemajayo.com/api/integrations/site/lead/pk_abc123"),
    "https://www.sistemajayo.com/api/integrations/site/lead/pk_abc123"
  );
  assert.equal(urlDoCrm("  pk_abc123  "), BASE_CRM + "pk_abc123");
  assert.equal(urlDoCrm("qualquer coisa"), null);
  assert.equal(urlDoCrm(""), null);
});

test("a chave nunca aparece inteira", () => {
  const s = chaveSegura("https://www.sistemajayo.com/api/integrations/site/lead/pk_abc123def456ghi");
  assert.ok(!s.includes("abc123def456ghi"));
  assert.ok(s.startsWith("pk_abc"));
});

/* ── erros do CRM ───────────────────────────────────────────────────────── */

test("cada erro do CRM vira uma instrução do que fazer", () => {
  assert.match(explicarResposta(422), /telefone/i);
  assert.match(explicarResposta(404), /chave/i);
  assert.match(explicarResposta(403), /dom[ií]nios/i);
  assert.match(explicarResposta(429), /limite/i);
  assert.match(explicarResposta(500, "boom"), /boom/);
});
