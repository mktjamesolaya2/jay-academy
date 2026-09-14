import { test } from "node:test";
import assert from "node:assert/strict";
import { destinoDaEscolha, REDIRECT_POR_ESCOLHA } from "./redirect-escolha.ts";

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

// ── Dois campos de decisão: o JAY Start (turma × pagamento) ───────────────────

test("Start: a chave é a combinação dos dois campos, na ordem declarada", () => {
  // Os links ainda não foram configurados, então o destino é vazio — mas a
  // combinação TEM que ser reconhecida, senão o dia em que os links chegarem
  // nada vai funcionar e ninguém vai saber por quê.
  const regra = REDIRECT_POR_ESCOLHA["jaytransforma-start"];
  assert.deepEqual(regra.campos, ["turma", "pagamento"]);
  for (const turma of ["brows-out", "brows-dez", "lips-nov"]) {
    for (const pagamento of ["pix", "cartao"]) {
      assert.equal(
        Object.hasOwn(regra.destinos, `${turma}|${pagamento}`),
        true,
        `falta a combinação ${turma}|${pagamento}`
      );
    }
  }
});

test("Start: as duas turmas do Brows compartilham o par de links", () => {
  // É a mesma formação e o mesmo preço; turmas diferentes não são produtos
  // diferentes. Se um dia divergirem, este teste avisa.
  const d = REDIRECT_POR_ESCOLHA["jaytransforma-start"].destinos;
  assert.equal(d["brows-out|pix"], d["brows-dez|pix"]);
  assert.equal(d["brows-out|cartao"], d["brows-dez|cartao"]);
});

test("Start: destino ainda não configurado não vira redirect", () => {
  // Enquanto os links não chegam, é melhor não redirecionar do que mandar a
  // pessoa pro checkout de outra formação. O lead continua sendo capturado.
  assert.equal(
    destinoDaEscolha("jaytransforma-start", { turma: "brows-out", pagamento: "pix" }),
    null
  );
});

test("Start: um campo em branco invalida a combinação inteira", () => {
  // Sem a turma não dá pra saber a formação; sem o pagamento não dá pra saber
  // o preço. Meia resposta não é uma escolha.
  assert.equal(destinoDaEscolha("jaytransforma-start", { pagamento: "pix" }), null);
  assert.equal(destinoDaEscolha("jaytransforma-start", { turma: "lips-nov" }), null);
  assert.equal(
    destinoDaEscolha("jaytransforma-start", { turma: "   ", pagamento: "pix" }),
    null
  );
});

// ── Bordas ───────────────────────────────────────────────────────────────────

test("combinação que não existe no mapa não vira redirect", () => {
  assert.equal(destinoDaEscolha("jaytransforma-remove", { pagamento: "boleto" }), null);
  assert.equal(
    destinoDaEscolha("jaytransforma-start", { turma: "brows-out", pagamento: "boleto" }),
    null
  );
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
