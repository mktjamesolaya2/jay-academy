import { test } from "node:test";
import assert from "node:assert/strict";
import {
  montarCorpoDoLead,
  montarCorpoTransforma,
  montarCorpoBeauty,
  corpoParaOCrm,
} from "./crm-envio.ts";

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

test("JAY Transforma envia só contato, etiqueta e respostas para observações", () => {
  const c = montarCorpoTransforma({
    ...base,
    fields: {
      incomodo_atual: "Continuar ganhando menos do que gostaria",
      quando_comecar: "O quanto antes",
      adiar_decisao: "Entender como viabilizar o investimento",
      proximo_passo: "Quero falar com alguém e tirar minhas dúvidas",
      campo_que_nao_deve_ir: "não enviar",
    },
  });
  assert.equal(c.nome, "Maria");
  assert.equal(c.telefone, "11999998888");
  assert.equal(c.tag, "JAY Transforma");
  assert.equal(c.incomodo_atual, "Continuar ganhando menos do que gostaria");
  assert.equal(c.quando_comecar, "O quanto antes");
  assert.equal(c.adiar_decisao, "Entender como viabilizar o investimento");
  assert.equal(c.proximo_passo, "Quero falar com alguém e tirar minhas dúvidas");
  assert.equal("perfil_do_lead" in c, false);
  assert.equal("resumo_completo" in c, false);
  assert.equal("campo_que_nao_deve_ir" in c, false);
});

test("pergunta sem resposta não vira chave vazia no CRM", () => {
  const c = montarCorpoTransforma({
    ...base,
    fields: { incomodo_atual: "Ver meus planos continuarem só no papel", quando_comecar: "   " },
  });
  assert.equal(c.incomodo_atual, "Ver meus planos continuarem só no papel");
  assert.equal("quando_comecar" in c, false);
  assert.equal("adiar_decisao" in c, false);
});

test("lead antigo, com as perguntas que saíram do formulário, ainda chega ao CRM", () => {
  // Os leads captados antes de 10/09 têm prontidao/barreira gravados — reenvio
  // ou reprocessamento não pode perder essas respostas.
  const c = montarCorpoTransforma({
    ...base,
    fields: {
      prontidao_proximo_passo: "Estou pronta para avançar",
      barreira_proximo_passo: "Investimento",
    },
  });
  assert.equal(c.prontidao_proximo_passo, "Estou pronta para avançar");
  assert.equal(c.barreira_proximo_passo, "Investimento");
});

test("corpoParaOCrm manda a /transforma pelo caminho do Transforma", () => {
  const c = corpoParaOCrm({
    ...base,
    slug: "transforma",
    fields: { incomodo_atual: "Ver meus planos continuarem só no papel" },
  });
  assert.equal(c.tag, "JAY Transforma");
  assert.equal(c.incomodo_atual, "Ver meus planos continuarem só no papel");
  // O Transforma não manda `pagina` — a etiqueta já diz de onde veio.
  assert.equal("pagina" in c, false);
});

test("corpoParaOCrm manda as outras páginas pelo caminho comum", () => {
  const c = corpoParaOCrm({ ...base, fields: { ...base.fields, cidade: "Campinas" } });
  assert.equal(c.pagina, "ciafol-luz");
  assert.equal(c.cidade, "Campinas");
  assert.equal("tag" in c, false);
});

test("reenvio: lead remontado das respostas guardadas chega inteiro no CRM", () => {
  // O reenvio manual do painel monta o corpo a partir de `lead.respostas`. Ele
  // já mandou só nome/email/telefone por quase um mês — este teste é pra isso
  // não voltar a acontecer em silêncio.
  const respostasGuardadas = {
    nome: "Maria",
    email: "maria@teste.com",
    whatsapp: "+5511999998888",
    incomodo_atual: "Continuar ganhando menos do que gostaria",
    quando_comecar: "O quanto antes",
    adiar_decisao: "Precisar conciliar com minha rotina",
    proximo_passo: "Quero ver valores e condições para decidir",
  };
  const c = corpoParaOCrm({
    fields: respostasGuardadas,
    name: "Maria",
    email: "maria@teste.com",
    whatsapp: "+5511999998888",
    slug: "transforma",
  });
  assert.equal(c.tag, "JAY Transforma");
  for (const campo of [
    "incomodo_atual",
    "quando_comecar",
    "adiar_decisao",
    "proximo_passo",
  ]) {
    assert.equal(c[campo], respostasGuardadas[campo as keyof typeof respostasGuardadas]);
  }
});

test("JAY Beauty manda só contato e etiqueta — e nunca e-mail vazio", () => {
  // O formulário da oferta pede nome e telefone. Mandar `email: ""` faria o CRM
  // apagar o e-mail que o contato já tinha da inscrição no evento.
  const c = montarCorpoBeauty({ name: "Maria", whatsapp: "+5511999998888" });
  assert.equal(c.nome, "Maria");
  assert.equal(c.telefone, "+5511999998888");
  assert.equal(c.tag, "Check BEAUTY");
  assert.equal("email" in c, false);
  assert.equal("pagina" in c, false);
});

test("corpoParaOCrm despacha a /jaytransforma-beauty pelo montador dela", () => {
  const c = corpoParaOCrm({
    ...base,
    slug: "jaytransforma-beauty",
    // Campos crus da página não podem vazar pro CRM: a etiqueta é o que conta.
    fields: { ...base.fields, utm_source: "instagram" },
  });
  assert.equal(c.tag, "Check BEAUTY");
  assert.equal("utm_source" in c, false);
  assert.equal("email" in c, false);
});
