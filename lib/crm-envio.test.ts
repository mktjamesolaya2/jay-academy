import { test } from "node:test";
import assert from "node:assert/strict";
import { montarCorpoDoLead, montarPerfilTransforma } from "./crm-envio.ts";

const base = {
  fields: { nome: "Maria", whatsapp: "11999998888" },
  name: "Maria",
  email: "maria@teste.com",
  whatsapp: "11999998888",
  slug: "ciafol-luz",
};

test("o corpo leva o que o CRM precisa pro negócio e pra anotação", () => {
  const c = montarCorpoDoLead(base);
  assert.equal(c.nome, "Maria");
  assert.equal(c.email, "maria@teste.com");
  assert.equal(c.telefone, "11999998888");
  assert.equal(c.pagina, "ciafol-luz");
});

test("o portal NÃO manda etiqueta — quem etiqueta é o CRM", () => {
  // James: "aqui no portal a gente não vai etiquetar nada". As tags fixas da
  // integração resolvem isso do lado de lá.
  const c = montarCorpoDoLead(base);
  assert.equal("tag" in c, false);
  assert.equal("tags" in c, false);
  assert.equal("utm_source" in c, false);
});

test("os campos normalizados vencem os crus", () => {
  const c = montarCorpoDoLead({
    ...base,
    fields: { nome: "maria (digitado torto)", telefone: "11 9 9999-8888" },
  });
  assert.equal(c.nome, "Maria");
  assert.equal(c.telefone, "11999998888");
});

test("campo extra do formulário viaja junto", () => {
  const c = montarCorpoDoLead({
    ...base,
    fields: { ...base.fields, cidade: "Campinas" },
  });
  assert.equal(c.cidade, "Campinas");
});

test("JAY Transforma preenche os campos de perfil e o resumo do CRM", () => {
  const c = montarPerfilTransforma({
    prontidao_proximo_passo: "Estou pronta para avançar",
    barreira_proximo_passo: "Investimento",
  });
  assert.equal(c.perfil_do_lead, "Estou pronta para avançar");
  assert.equal(c.interesse_tecnico, "JAY Transforma");
  assert.equal(c.curso_de_interesse, "JAY Transforma");
  assert.equal(c.modalidade_e_momento, "Online e gratuito — Estou pronta para avançar");
  assert.match(c.resumo_completo, /Barreira: Investimento/);
  assert.equal(c.mensagem, c.resumo_completo);
});
