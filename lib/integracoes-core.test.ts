import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aplicarMapeamento,
  corpoParaOCrm,
  identificaContato,
  type ConfigIntegracao,
} from "./integracoes-core.ts";
import type { Lead } from "./lead-campos.ts";

const cfg = (extra: Partial<ConfigIntegracao> = {}): ConfigIntegracao => ({
  nome: "LP NanoFios",
  tipo: "negocio",
  acao: "criar_ou_atualizar",
  mapeamento: [
    { doFormulario: "name", paraOCrm: "nome" },
    { doFormulario: "email", paraOCrm: "email" },
    { doFormulario: "phone", paraOCrm: "telefone" },
  ],
  tags: ["nanofios"],
  ...extra,
});

const lead: Lead = {
  id: "lead-1",
  nome: "Maria",
  email: "m@e.com",
  telefone: "11999998888",
  enviado_em: "2026-08-11T12:00:00.000Z",
  tags: ["site"],
  campos: {},
};

/* ── mapeamento ─────────────────────────────────────────────────────────── */

test("renomeia o campo do formulário pro campo do CRM", () => {
  const r = aplicarMapeamento(
    { name: "Maria", email: "m@e.com", phone: "11999998888" },
    cfg().mapeamento
  );
  assert.deepEqual(r, { nome: "Maria", email: "m@e.com", telefone: "11999998888" });
});

test("campo não mapeado passa direto — campo a mais não some", () => {
  const r = aplicarMapeamento({ name: "Maria", cidade: "Recife" }, cfg().mapeamento);
  assert.equal(r.nome, "Maria");
  assert.equal(r.cidade, "Recife");
});

test("não diferencia maiúscula nem sofre com form_fields[...] do Elementor", () => {
  const r = aplicarMapeamento(
    { "form_fields[Name]": "Ana", " EMAIL ": "a@e.com" },
    cfg().mapeamento
  );
  assert.equal(r.nome, "Ana");
  assert.equal(r.email, "a@e.com");
});

test("campo vazio não entra", () => {
  const r = aplicarMapeamento({ name: "Ana", email: "   ", cidade: "" }, cfg().mapeamento);
  assert.deepEqual(Object.keys(r), ["nome"]);
});

test("linha de mapeamento pela metade é ignorada, não quebra", () => {
  const r = aplicarMapeamento(
    { name: "Ana" },
    [{ doFormulario: "", paraOCrm: "nome" }, { doFormulario: "name", paraOCrm: "  " }]
  );
  assert.equal(r.name, "Ana", "sem regra válida, mantém o nome original");
});

/* ── corpo pro CRM ──────────────────────────────────────────────────────── */

test("o corpo leva tipo, ação, etapa e status — não só a pessoa", () => {
  const corpo = corpoParaOCrm(
    cfg({ etapaCriacao: "Base", status: "Aberto" }),
    lead,
    { nome: "Maria", email: "m@e.com" }
  );
  assert.equal(corpo.tipo, "negocio");
  assert.equal(corpo.acao, "criar_ou_atualizar");
  assert.equal(corpo.etapa_criacao, "Base");
  assert.equal(corpo.status, "Aberto");
  assert.equal(corpo.nome, "Maria");
  assert.equal(corpo.id, "lead-1", "o id evita lead duplicado no CRM");
});

test("tags da integração somam com as do lead, sem repetir", () => {
  const corpo = corpoParaOCrm(cfg({ tags: ["site", "nanofios"] }), lead, {});
  assert.deepEqual(corpo.tags, ["site", "nanofios"]);
});

test("etapa e status em branco não viajam", () => {
  const corpo = corpoParaOCrm(cfg(), lead, {});
  assert.ok(!("etapa_criacao" in corpo));
  assert.ok(!("status" in corpo));
});

/* ── identificação ──────────────────────────────────────────────────────── */

test("sem e-mail nem telefone mapeado, o CRM não sabe quem é a pessoa", () => {
  assert.equal(identificaContato(cfg().mapeamento), true);
  assert.equal(
    identificaContato([{ doFormulario: "name", paraOCrm: "nome" }]),
    false
  );
  assert.equal(
    identificaContato([{ doFormulario: "tel", paraOCrm: "Telefone" }]),
    true,
    "maiúscula não pode mudar a resposta"
  );
});
