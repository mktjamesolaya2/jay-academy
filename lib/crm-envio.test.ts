import { test } from "node:test";
import assert from "node:assert/strict";
import { montarCorpoDoLead } from "./crm-envio.ts";

const base = {
  fields: { nome: "Maria", whatsapp: "11999998888" },
  name: "Maria",
  email: "maria@teste.com",
  whatsapp: "11999998888",
  slug: "ciafol-luz",
};

test("a TAG vai no corpo — foi ela que faltou em 13/08 e ninguém viu", () => {
  const c = montarCorpoDoLead({ ...base, tag: "INSTA CIAFOL LUZ" });
  assert.equal(c.tag, "INSTA CIAFOL LUZ");
});

test("sem tag configurada, o campo não aparece — não manda vazio", () => {
  assert.equal("tag" in montarCorpoDoLead({ ...base, tag: null }), false);
  assert.equal("tag" in montarCorpoDoLead({ ...base, tag: "   " }), false);
  assert.equal("tag" in montarCorpoDoLead(base), false);
});

test("espaço sobrando na tag é aparado", () => {
  // ⚠️ Grafia diferente cria etiqueta DIFERENTE no CRM, e ela nasce do envio:
  // um espaço a mais viraria tag permanente no catálogo.
  assert.equal(montarCorpoDoLead({ ...base, tag: "  ST BEAUTY  " }).tag, "ST BEAUTY");
});

test("os campos normalizados vencem os crus", () => {
  const c = montarCorpoDoLead({
    ...base,
    fields: { nome: "maria (digitado torto)", telefone: "11 9 9999-8888" },
  });
  assert.equal(c.nome, "Maria");
  assert.equal(c.telefone, "11999998888");
});

test("o corpo leva o que o CRM precisa pra anotação e o negócio", () => {
  const c = montarCorpoDoLead({ ...base, tag: "INSTA CIAFOL LUZ" });
  assert.deepEqual(Object.keys(c).sort(), [
    "email",
    "nome",
    "pagina",
    "tag",
    "telefone",
    "whatsapp",
  ]);
});
