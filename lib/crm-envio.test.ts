import { test } from "node:test";
import assert from "node:assert/strict";
import {
  montarCorpoDoLead,
  montarCorpoTransforma,
  montarCorpoBeauty,
  montarCorpoRemove,
  montarCorpoStart,
  TAG_BEAUTY,
  TAG_REMOVE,
  TAG_START,
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

test("JAY Beauty manda o mesmo corpo do formulário oficial do CRM", () => {
  const c = montarCorpoBeauty({
    fields: {
      pagina: "https://www.jayacademy.com.br/jaytransforma-beauty?utm_source=instagram",
      utm_source: "instagram",
      utm_campaign: "transforma-set",
      campo_que_nao_deve_ir: "não enviar",
    },
    name: "Maria",
    email: "maria@teste.com",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-beauty",
  });
  assert.equal(c.nome, "Maria");
  assert.equal(c.telefone, "+5511999998888");
  assert.equal(c.email, "maria@teste.com");
  assert.equal(c.tag, TAG_BEAUTY);
  // `pagina` é a URL inteira que o formulário preencheu, não o slug.
  assert.equal(c.pagina, "https://www.jayacademy.com.br/jaytransforma-beauty?utm_source=instagram");
  assert.equal(c.utm_source, "instagram");
  assert.equal(c.utm_campaign, "transforma-set");
  // Campo cru que não é utm_ não viaja: o CRM transformaria em observação.
  assert.equal("campo_que_nao_deve_ir" in c, false);
});

test("JAY Beauty: e-mail vazio não vira chave (não apaga o que o CRM já tem)", () => {
  // O e-mail é opcional no formulário. Mandar `email: ""` faria o CRM apagar o
  // e-mail que o contato já tinha da inscrição no evento.
  const c = montarCorpoBeauty({
    fields: {},
    name: "Maria",
    email: "   ",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-beauty",
  });
  assert.equal("email" in c, false);
  assert.equal(c.tag, TAG_BEAUTY);
  // Sem o campo `pagina` preenchido, cai no slug — nunca fica vazio.
  assert.equal(c.pagina, "jaytransforma-beauty");
});

test("JAY Beauty: a turma escolhida chega ao CRM", () => {
  const c = montarCorpoBeauty({
    fields: { turma: "07 a 10/12/2026" },
    name: "Maria",
    email: "",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-beauty",
  });
  assert.equal(c.turma, "07 a 10/12/2026");
});

test("JAY Beauty: turma em branco não vira chave vazia", () => {
  // O campo é opcional. Chave vazia no corpo faria o CRM gravar uma observação
  // sem conteúdo — e o comercial acharia que ela respondeu.
  const c = montarCorpoBeauty({
    fields: { turma: "   " },
    name: "Maria",
    email: "",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-beauty",
  });
  assert.equal("turma" in c, false);
});

test("JAY Beauty: utm vazio não vira chave vazia", () => {
  const c = montarCorpoBeauty({
    fields: { utm_source: "  ", utm_medium: "cpc" },
    name: "Maria",
    email: "",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-beauty",
  });
  assert.equal("utm_source" in c, false);
  assert.equal(c.utm_medium, "cpc");
});

test("corpoParaOCrm despacha a /jaytransforma-beauty pelo montador dela", () => {
  const c = corpoParaOCrm({ ...base, slug: "jaytransforma-beauty" });
  assert.equal(c.tag, TAG_BEAUTY);
});

test("JAY Remove manda o mesmo corpo do Beauty, com a etiqueta dele", () => {
  const c = montarCorpoRemove({
    fields: {
      pagina: "https://www.jayacademy.com.br/jaytransforma-remove?utm_source=instagram",
      utm_source: "instagram",
      campo_que_nao_deve_ir: "não enviar",
    },
    name: "Maria",
    email: "maria@teste.com",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-remove",
  });
  assert.equal(c.nome, "Maria");
  assert.equal(c.telefone, "+5511999998888");
  assert.equal(c.email, "maria@teste.com");
  assert.equal(c.tag, TAG_REMOVE);
  assert.equal(c.pagina, "https://www.jayacademy.com.br/jaytransforma-remove?utm_source=instagram");
  assert.equal(c.utm_source, "instagram");
  assert.equal("campo_que_nao_deve_ir" in c, false);
});

test("JAY Remove: as duas ofertas de fechamento NÃO compartilham etiqueta", () => {
  // Uma etiqueta só mandaria os dois funis pra mesma etapa do CRM, e o
  // comercial não saberia qual formação a pessoa quis.
  assert.notEqual(TAG_BEAUTY, TAG_REMOVE);
});

test("JAY Remove: a forma de pagamento escolhida chega ao CRM", () => {
  // ⚠️ Este campo não é só informação: é ele que decide para qual dos dois
  // checkouts a pessoa vai (REDIRECT_POR_ESCOLHA em /api/elementor-form).
  const c = montarCorpoRemove({
    fields: { pagamento: "cartao" },
    name: "Maria",
    email: "",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-remove",
  });
  assert.equal(c.pagamento, "cartao");
});

test("JAY Remove: pagamento em branco não vira chave vazia", () => {
  const c = montarCorpoRemove({
    fields: { pagamento: "   " },
    name: "Maria",
    email: "",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-remove",
  });
  assert.equal("pagamento" in c, false);
});

test("JAY Remove: o campo do Beauty não vaza pro corpo dele", () => {
  // Os dois montadores saem da mesma fábrica; o que os separa é a lista de
  // campos extras. Se ela fosse compartilhada por engano, `turma` passaria.
  const c = montarCorpoRemove({
    fields: { turma: "05 a 08/10/2026" },
    name: "Maria",
    email: "",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-remove",
  });
  assert.equal("turma" in c, false);
});

test("corpoParaOCrm despacha a /jaytransforma-remove pelo montador dela", () => {
  const c = corpoParaOCrm({ ...base, slug: "jaytransforma-remove" });
  assert.equal(c.tag, TAG_REMOVE);
});

test("JAY Start: a turma e a forma de pagamento chegam ao CRM", () => {
  // ⚠️ Estes dois campos não são só informação. A turma diz QUAL das duas
  // formações a pessoa quis (a página vende duas), e juntos eles escolhem para
  // qual dos quatro checkouts ela é mandada (lib/redirect-escolha.ts).
  const c = montarCorpoStart({
    fields: { turma: "brows-dez", pagamento: "pix" },
    name: "Maria",
    email: "",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-start",
  });
  assert.equal(c.turma, "brows-dez");
  assert.equal(c.pagamento, "pix");
  assert.equal(c.tag, TAG_START);
});

test("JAY Start: campo em branco não vira chave vazia", () => {
  const c = montarCorpoStart({
    fields: { turma: "   ", pagamento: "" },
    name: "Maria",
    email: "",
    whatsapp: "+5511999998888",
    slug: "jaytransforma-start",
  });
  assert.equal("turma" in c, false);
  assert.equal("pagamento" in c, false);
});

test("as três ofertas de fechamento têm etiquetas distintas", () => {
  // Etiqueta repetida mandaria funis diferentes pra mesma etapa do CRM, e o
  // comercial não saberia qual formação a pessoa quis.
  const tags = [TAG_BEAUTY, TAG_REMOVE, TAG_START];
  assert.equal(new Set(tags).size, tags.length);
});

test("corpoParaOCrm despacha a /jaytransforma-start pelo montador dela", () => {
  const c = corpoParaOCrm({ ...base, slug: "jaytransforma-start" });
  assert.equal(c.tag, TAG_START);
});
