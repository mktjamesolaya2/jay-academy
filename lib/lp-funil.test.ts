import { test } from "node:test";
import assert from "node:assert/strict";

// Os dois endereços do C6: o Pix e o cartão chegam por domínios diferentes.
// É isso que torna detectável um link colado no campo errado — o erro fácil,
// já que os seis links vieram em duas listas separadas.
const C6_PIX = "https://api-gateway.c6bank.info/v1/payment/";
const C6_CARTAO = "https://checkout2.c6pay.com.br/payment/";
const OFERTAS = ["jaytransforma-beauty", "jaytransforma-remove", "jaytransforma-start"];
import {
  destinoDaEscolha,
  resolverDestino,
  REDIRECT_POR_ESCOLHA,
  REGRAS_POR_LP,
  GRUPO_WHATSAPP_POR_LP,
  regrasDaLp,
} from "./lp-funil.ts";

// ── Um campo de decisão: o JAY Remove (Pix ou cartão) ────────────────────────

test("Remove: cada forma de pagamento vai pro checkout dela", () => {
  const pix = destinoDaEscolha("jaytransforma-remove", { pagamento: "pix" });
  const cartao = destinoDaEscolha("jaytransforma-remove", { pagamento: "cartao" });
  assert.equal(pix, C6_PIX + "64dda652-b9b8-49af-9c99-39a5f1da13b7");
  assert.equal(cartao, C6_CARTAO + "ca1a7f3a-c975-44f6-abf3-83e3e9c42be0");
  // O erro que este arquivo existe pra pegar: os dois apontando pro mesmo lugar.
  assert.notEqual(pix, cartao);
});

test("Remove: espaço e maiúscula na escolha não perdem o destino", () => {
  // O `value` do rádio é ASCII e minúsculo, mas um envio fora do navegador
  // (integração, teste manual) pode chegar de outro jeito.
  assert.equal(
    destinoDaEscolha("jaytransforma-remove", { pagamento: "  Cartao  " }),
    C6_CARTAO + "ca1a7f3a-c975-44f6-abf3-83e3e9c42be0"
  );
});

// ── O JAY Start: duas formações, mas um par de links ────────────────────────

test("Start: cada forma de pagamento vai pro checkout dela", () => {
  const pix = destinoDaEscolha("jaytransforma-start", { pagamento: "pix" });
  const cartao = destinoDaEscolha("jaytransforma-start", { pagamento: "cartao" });
  assert.equal(pix, C6_PIX + "92923a19-2df9-4dae-9112-869dfc151156");
  assert.equal(cartao, C6_CARTAO + "7ccd7058-3b5d-429b-bd2b-cf840d42add9");
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
  assert.equal(comBrows, C6_PIX + "92923a19-2df9-4dae-9112-869dfc151156");
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
  // A /transforma é a inscrição no evento: manda pro grupo do WhatsApp, não
  // pra checkout. Página fora do mapa não ganha destino por acidente.
  // (A /jaytransforma-beauty estava aqui até 15/09, quando ganhou os dois
  // checkouts dela — por isso saiu deste teste e entrou nos de cima.)
  assert.equal(destinoDaEscolha("transforma", { pagamento: "pix" }), null);
  assert.equal(destinoDaEscolha("academy", { pagamento: "pix" }), null);
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
  // Toda página aqui ou termina num checkout próprio (REDIRECT_POR_ESCOLHA) ou
  // termina num grupo de WhatsApp (GRUPO_WHATSAPP_POR_LP). Antes isto estava
  // escrito como `slug === "transforma"`, o que obrigava a editar o teste toda
  // vez que uma página de captação nova entrava.
  for (const slug of Object.keys(REGRAS_POR_LP)) {
    const temCheckout = Object.hasOwn(REDIRECT_POR_ESCOLHA, slug);
    const temGrupo = Object.hasOwn(GRUPO_WHATSAPP_POR_LP, slug);
    assert.equal(
      temCheckout || temGrupo,
      true,
      `${slug} tem regras mas nenhum funil conhecido`
    );
  }
});

// ── O Beauty ganhou escolha em 15/09, com o Pix ──────────────────────────────

test("Beauty: cada forma de pagamento vai pro checkout dela", () => {
  const pix = destinoDaEscolha("jaytransforma-beauty", { pagamento: "pix" });
  const cartao = destinoDaEscolha("jaytransforma-beauty", { pagamento: "cartao" });
  assert.equal(pix, C6_PIX + "6c8f923a-9ec2-4c8a-857a-7eddaf9ada54");
  assert.equal(cartao, C6_CARTAO + "378ed588-2128-4d1b-ba53-74ea8d95f85a");
  assert.notEqual(pix, cartao);
});

test("Beauty: a turma escolhida não muda o checkout", () => {
  // As duas turmas custam o mesmo. A turma vai pro CRM, não pro preço.
  const out = destinoDaEscolha("jaytransforma-beauty", {
    turma: "05 a 08/10/2026",
    pagamento: "pix",
  });
  const dez = destinoDaEscolha("jaytransforma-beauty", {
    turma: "07 a 10/12/2026",
    pagamento: "pix",
  });
  assert.equal(out, dez);
});

// ── As invariantes dos seis links ────────────────────────────────────────────

test("nenhum checkout se repete entre as três ofertas", () => {
  // O erro provável ao colar SEIS UUIDs à mão é repetir um. E ele cobraria o
  // valor de outra formação sem nenhum sintoma: o botão funciona, o checkout
  // abre, só o valor está errado. Antes disto, só Start x Remove era conferido.
  const todos = OFERTAS.flatMap((slug) =>
    Object.values(REDIRECT_POR_ESCOLHA[slug].destinos)
  );
  assert.equal(new Set(todos).size, todos.length, `link repetido em: ${todos.join("\n")}`);
  assert.equal(todos.length, 6);
});

test("o link do Pix e o do cartão não estão trocados de lugar", () => {
  // No C6 o Pix e o cartão chegam por domínios diferentes, então um link no
  // campo errado é detectável — e é o engano mais fácil, já que os seis vieram
  // em duas listas separadas. Se o C6 um dia unificar os domínios, este teste
  // falha sem haver bug: aí é só atualizar as duas constantes do topo.
  for (const slug of OFERTAS) {
    const d = REDIRECT_POR_ESCOLHA[slug].destinos;
    assert.ok(d.pix.startsWith(C6_PIX), `${slug}: o destino do Pix é ${d.pix}`);
    assert.ok(d.cartao.startsWith(C6_CARTAO), `${slug}: o destino do cartão é ${d.cartao}`);
  }
});

test("as três ofertas resolvem os dois destinos", () => {
  for (const slug of OFERTAS) {
    for (const forma of ["pix", "cartao"]) {
      assert.notEqual(destinoDaEscolha(slug, { pagamento: forma }), null, `${slug} / ${forma}`);
    }
  }
});

test("nenhum checkout da Cielo sobrou", () => {
  // A migração foi em 15/09. Um link antigo esquecido continuaria cobrando
  // pela adquirente que saiu, e o pagamento cairia no lugar errado.
  for (const regra of Object.values(REDIRECT_POR_ESCOLHA)) {
    for (const url of Object.values(regra.destinos)) {
      assert.ok(!url.includes("cielo"), `ainda aponta pra Cielo: ${url}`);
    }
  }
});

// ── Os grupos de WhatsApp ────────────────────────────────────────────────────

test("todo grupo configurado é um convite de grupo do WhatsApp", () => {
  // O destino é colado à mão do celular do James. Um link de conversa
  // individual (wa.me) no lugar do convite manda a lead pro privado dele em vez
  // do grupo, e ninguém percebe até o telefone tocar.
  for (const [slug, url] of Object.entries(GRUPO_WHATSAPP_POR_LP)) {
    if (!url) continue; // vazio = grupo ainda não criado, testado abaixo
    assert.ok(
      url.startsWith("https://chat.whatsapp.com/"),
      `${slug} não aponta pra um convite de grupo: ${url}`
    );
  }
});

test("grupo ainda não criado não vira redirect quebrado", () => {
  // A cascata da rota faz `GRUPO_WHATSAPP_POR_LP[slug] || null`: string vazia
  // some e a pessoa fica na página com a confirmação. O que não pode é a chave
  // existir com um espaço em branco dentro, que passaria pelo `||`.
  for (const [slug, url] of Object.entries(GRUPO_WHATSAPP_POR_LP)) {
    assert.equal(url, url.trim(), `${slug}: destino com espaço nas pontas`);
  }
});

test("cada página cai no seu grupo, sem repetir link", () => {
  const usados = Object.values(GRUPO_WHATSAPP_POR_LP).filter(Boolean);
  assert.equal(new Set(usados).size, usados.length, "duas páginas no mesmo grupo");
});
