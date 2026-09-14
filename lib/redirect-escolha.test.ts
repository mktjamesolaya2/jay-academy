import { test } from "node:test";
import assert from "node:assert/strict";
import {
  destinoDaEscolha,
  resolverDestino,
  REDIRECT_POR_ESCOLHA,
} from "./redirect-escolha.ts";

// ── Um campo de decisão: o JAY Remove (Pix ou cartão) ────────────────────────

test("Remove: cada forma de pagamento vai pro checkout dela", () => {
  const pix = destinoDaEscolha("jaytransforma-remove", { pagamento: "pix" });
  const cartao = destinoDaEscolha("jaytransforma-remove", { pagamento: "cartao" });
  assert.equal(pix, "https://cielolink.com.br/4iXIpI8");
  assert.equal(cartao, "https://cielolink.com.br/4cGaboO");
  // O erro que este arquivo existe pra pegar: os dois apontando pro mesmo lugar.
  assert.notEqual(pix, cartao);
});

test("Remove: espaço e maiúscula na escolha não perdem o destino", () => {
  // O `value` do rádio é ASCII e minúsculo, mas um envio fora do navegador
  // (integração, teste manual) pode chegar de outro jeito.
  assert.equal(
    destinoDaEscolha("jaytransforma-remove", { pagamento: "  Cartao  " }),
    "https://cielolink.com.br/4cGaboO"
  );
});

// ── O JAY Start: duas formações, mas um par de links ────────────────────────

test("Start: cada forma de pagamento vai pro checkout dela", () => {
  const pix = destinoDaEscolha("jaytransforma-start", { pagamento: "pix" });
  const cartao = destinoDaEscolha("jaytransforma-start", { pagamento: "cartao" });
  assert.equal(pix, "https://cielolink.com.br/4ipEfbT");
  assert.equal(cartao, "https://cielolink.com.br/4AixO0M");
  assert.notEqual(pix, cartao);
});

test("Start: a turma escolhida não muda o checkout", () => {
  // As duas formações custam o mesmo, então há um par de links só. A turma vai
  // pro CRM (é ela que diz qual formação a pessoa quis), mas não decide preço.
  const comBrows = destinoDaEscolha("jaytransforma-start", {
    turma: "brows-out",
    pagamento: "pix",
  });
  const comLips = destinoDaEscolha("jaytransforma-start", {
    turma: "lips-nov",
    pagamento: "pix",
  });
  assert.equal(comBrows, comLips);
  assert.equal(comBrows, "https://cielolink.com.br/4ipEfbT");
});

test("Start e Remove não compartilham checkout", () => {
  // Preços diferentes (R$ 2.997 x R$ 3.497). Um link repetido entre as duas
  // páginas cobraria o valor errado sem nenhum sintoma visível.
  const start = REDIRECT_POR_ESCOLHA["jaytransforma-start"].destinos;
  const remove = REDIRECT_POR_ESCOLHA["jaytransforma-remove"].destinos;
  assert.notEqual(start.pix, remove.pix);
  assert.notEqual(start.cartao, remove.cartao);
});

// ── A chave composta (mais de um campo de decisão) ───────────────────────────

test("chave composta: junta os campos na ordem declarada", () => {
  // Hoje as duas páginas do mapa decidem por um campo só. Este caminho existe
  // pro dia em que uma delas precisar de dois (por exemplo, se as formações do
  // Start passarem a ter preços diferentes), e é testado com uma regra própria
  // pra não precisar inventar uma página falsa no mapa de verdade.
  const regra = {
    campos: ["turma", "pagamento"],
    destinos: {
      "brows|pix": "https://exemplo.test/brows-pix",
      "lips|cartao": "https://exemplo.test/lips-cartao",
    },
  } as const;
  assert.equal(
    resolverDestino(regra, { turma: "brows", pagamento: "pix" }),
    "https://exemplo.test/brows-pix"
  );
  assert.equal(
    resolverDestino(regra, { turma: "lips", pagamento: "cartao" }),
    "https://exemplo.test/lips-cartao"
  );
  // A ordem é a de `campos`, não a de quem chamou.
  assert.equal(resolverDestino(regra, { pagamento: "pix", turma: "brows" }),
    "https://exemplo.test/brows-pix");
  // Combinação que existe nos campos mas não no mapa.
  assert.equal(resolverDestino(regra, { turma: "brows", pagamento: "cartao" }), null);
});

test("chave composta: um campo em branco invalida a combinação inteira", () => {
  // Meia resposta não é uma escolha: sem os dois não dá pra saber o destino.
  const regra = {
    campos: ["turma", "pagamento"],
    destinos: { "brows|pix": "https://exemplo.test/brows-pix" },
  } as const;
  assert.equal(resolverDestino(regra, { turma: "brows" }), null);
  assert.equal(resolverDestino(regra, { pagamento: "pix" }), null);
  assert.equal(resolverDestino(regra, { turma: "  ", pagamento: "pix" }), null);
});

test("destino vazio é 'ainda não configurado', não um redirect quebrado", () => {
  const regra = { campos: ["pagamento"], destinos: { pix: "" } } as const;
  assert.equal(resolverDestino(regra, { pagamento: "pix" }), null);
});

// ── Bordas ───────────────────────────────────────────────────────────────────

test("combinação que não existe no mapa não vira redirect", () => {
  assert.equal(destinoDaEscolha("jaytransforma-remove", { pagamento: "boleto" }), null);
  assert.equal(destinoDaEscolha("jaytransforma-start", { pagamento: "boleto" }), null);
});

test("página sem regra não é afetada", () => {
  assert.equal(destinoDaEscolha("jaytransforma-beauty", { pagamento: "pix" }), null);
  assert.equal(destinoDaEscolha("transforma", { pagamento: "pix" }), null);
});

test("slug e escolha não alcançam o Object.prototype", () => {
  // Os dois vêm de fora: o slug da URL, a escolha do formulário. Sem hasOwn,
  // "constructor" devolveria uma função e o `||` da rota se comportaria de um
  // jeito que ninguém consegue depurar.
  assert.equal(destinoDaEscolha("constructor", { pagamento: "pix" }), null);
  assert.equal(destinoDaEscolha("toString", { pagamento: "pix" }), null);
  assert.equal(
    destinoDaEscolha("jaytransforma-remove", { pagamento: "constructor" }),
    null
  );
});

test("todo destino configurado é uma URL https de verdade", () => {
  // Uma string qualquer viraria um redirect quebrado sem ninguém notar.
  for (const [slug, regra] of Object.entries(REDIRECT_POR_ESCOLHA)) {
    for (const [chave, url] of Object.entries(regra.destinos)) {
      if (!url) continue; // ainda não configurado — coberto por outro teste
      assert.match(url, /^https:\/\/\S+$/, `${slug} → ${chave}`);
    }
  }
});

test("toda chave de destino tem tantas partes quantos campos de decisão", () => {
  // Uma chave "pix" num mapa de dois campos nunca casaria, e o sintoma seria
  // um checkout que simplesmente não abre.
  for (const [slug, regra] of Object.entries(REDIRECT_POR_ESCOLHA)) {
    for (const chave of Object.keys(regra.destinos)) {
      assert.equal(
        chave.split("|").length,
        regra.campos.length,
        `${slug} → chave "${chave}" não bate com os campos ${regra.campos.join(", ")}`
      );
    }
  }
});
