import { test } from "node:test";
import assert from "node:assert/strict";
import {
  destinoDaEscolha,
  resolverDestino,
  REDIRECT_POR_ESCOLHA,
  REGRAS_POR_LP,
  regrasDaLp,
} from "./lp-funil.ts";

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

// ── A invariante que faltava ─────────────────────────────────────────────────

test("toda página com checkout tem regras de funil", () => {
  // ESTE é o teste que faltava. A /jaytransforma-start foi ao ar com os dois
  // checkouts funcionando e SEM entrada em REGRAS_POR_LP, e nada apitou: o
  // telefone seguia pro CRM com a máscara do formulário em vez de E.164, e uma
  // recusa do CRM virava "Recebido com sucesso!" na tela. Página que termina em
  // pagamento é página onde um lead perdido é dinheiro perdido.
  for (const slug of Object.keys(REDIRECT_POR_ESCOLHA)) {
    assert.notEqual(
      regrasDaLp(slug),
      null,
      `${slug} tem checkout mas não tem regras — o telefone iria sem normalizar e a recusa do CRM viraria sucesso`
    );
  }
});

test("as ofertas de fechamento não pedem e-mail", () => {
  // Quem chega nelas já deu o e-mail na inscrição do evento. Exigir de novo é
  // perder venda na última tela.
  for (const slug of ["jaytransforma-beauty", "jaytransforma-remove", "jaytransforma-start"]) {
    const regras = regrasDaLp(slug);
    assert.notEqual(regras, null, `${slug} sem regras`);
    assert.equal(regras?.exigeEmail, false, slug);
  }
});

test("a mensagem de sucesso da página combina com o que ela faz", () => {
  // A /transforma manda pro grupo do evento; as ofertas mandam pro checkout.
  // Trocar as mensagens não quebra nada — só mente pra pessoa.
  assert.match(regrasDaLp("transforma")!.mensagemOk, /grupo do evento/);
  for (const slug of ["jaytransforma-beauty", "jaytransforma-remove", "jaytransforma-start"]) {
    assert.match(regrasDaLp(slug)!.mensagemOk, /garantir sua vaga/, slug);
  }
});

test("slug de fora não alcança o Object.prototype nas regras", () => {
  assert.equal(regrasDaLp("constructor"), null);
  assert.equal(regrasDaLp("toString"), null);
  assert.equal(regrasDaLp("pagina-qualquer"), null);
});

test("REGRAS_POR_LP não tem entrada órfã sem uso", () => {
  // Toda página aqui ou tem checkout próprio (REDIRECT_POR_ESCOLHA) ou é a
  // /transforma, que manda pro grupo do WhatsApp.
  for (const slug of Object.keys(REGRAS_POR_LP)) {
    const temCheckout = Object.hasOwn(REDIRECT_POR_ESCOLHA, slug);
    assert.equal(
      temCheckout || slug === "transforma" || slug === "jaytransforma-beauty",
      true,
      `${slug} tem regras mas nenhum funil conhecido`
    );
  }
});
