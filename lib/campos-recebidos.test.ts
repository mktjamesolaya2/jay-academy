import { test } from "node:test";
import assert from "node:assert/strict";
import { achatar, acharCampo } from "./campos-recebidos.ts";

const acha = (obj: unknown) => {
  const c = achatar(obj);
  return {
    nome: acharCampo(c, "nome"),
    email: acharCampo(c, "email"),
    telefone: acharCampo(c, "telefone"),
  };
};

test("JSON simples em português e em inglês", () => {
  assert.deepEqual(acha({ nome: "Maria", email: "m@e.com", telefone: "11999998888" }), {
    nome: "Maria",
    email: "m@e.com",
    telefone: "11999998888",
  });
  assert.deepEqual(acha({ name: "Ana", email: "a@e.com", phone: "11977776666" }), {
    nome: "Ana",
    email: "a@e.com",
    telefone: "11977776666",
  });
});

test("campo do Elementor (form_fields[...]) é reconhecido", () => {
  const r = acha({
    "form_fields[your-name]": "Bia",
    "form_fields[email]": "b@e.com",
    "form_fields[whatsapp]": "11966665555",
  });
  assert.equal(r.nome, "Bia");
  assert.equal(r.email, "b@e.com");
  assert.equal(r.telefone, "11966665555");
});

test("payload aninhado (ferramenta que manda { lead: {...} })", () => {
  const r = acha({ lead: { contato: { nome: "Carla", email: "c@e.com" } } });
  assert.equal(r.nome, "Carla");
  assert.equal(r.email, "c@e.com");
});

test("lista de {name, value} — formato de vários formulários", () => {
  const r = acha({
    fields: [
      { name: "nome", value: "Dani" },
      { name: "email", value: "d@e.com" },
      { name: "celular", value: "11955554444" },
    ],
  });
  assert.equal(r.nome, "Dani");
  assert.equal(r.email, "d@e.com");
  assert.equal(r.telefone, "11955554444");
});

test("nome de campo esquisito: acha pelo FORMATO do valor", () => {
  // melhor um lead com contato do que um lead vazio
  const r = acha({ campo_1: "Eva", campo_2: "e@e.com", campo_3: "+55 11 94444-3333" });
  assert.equal(r.email, "e@e.com");
  assert.equal(r.telefone, "+55 11 94444-3333");
});

test("não confunde e-mail com telefone nem inventa nome", () => {
  const r = acha({ observacao: "sem contato aqui" });
  assert.equal(r.email, "");
  assert.equal(r.telefone, "");
  assert.equal(r.nome, "");
});

test("campo vazio não vence campo preenchido", () => {
  const r = acha({ name: "", nome: "Fabi", email: "  ", "e-mail": "f@e.com" });
  assert.equal(r.nome, "Fabi");
  assert.equal(r.email, "f@e.com");
});

test("achatar não entra em recursão infinita nem estoura profundidade", () => {
  const fundo = { a: { b: { c: { d: { e: { f: "muito fundo" } } } } } };
  const c = achatar(fundo);
  assert.ok(Object.keys(c).length < 10);
});
