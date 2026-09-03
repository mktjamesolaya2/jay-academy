import test from "node:test";
import assert from "node:assert/strict";
import { MONTAR_URL_JS } from "./utm-checkout.ts";

// Exercita exatamente o mesmo texto de função que é injetado no browser — sem cópia
// pra sair de sincronia. Ver o comentário em lib/utm-checkout.ts.
const montarUrlCheckout = new Function(
  `return (${MONTAR_URL_JS});`
)() as (href: string, origem: Record<string, string>) => string;

/** Link real da Shadow PRO (lp-html/metodo-shadow-pro.html:935). */
const SHADOW = "https://pay.hotmart.com/E98531587I?checkoutMode=10&off=k2warcrt";

const CAMPANHA = {
  utm_source: "facebook",
  utm_medium: "cpc",
  utm_campaign: "shadow-set",
  utm_content: "video01",
  utm_term: "micropigmentacao",
};

function params(url: string) {
  return new URL(url).searchParams;
}

test("sem origem, o link sai intacto", () => {
  assert.equal(montarUrlCheckout(SHADOW, {}), SHADOW);
});

test("campanha completa: leva os 5 utm_*, src e sck, sem perder off/checkoutMode", () => {
  const p = params(montarUrlCheckout(SHADOW, CAMPANHA));
  assert.equal(p.get("off"), "k2warcrt");
  assert.equal(p.get("checkoutMode"), "10");
  assert.equal(p.get("utm_source"), "facebook");
  assert.equal(p.get("utm_medium"), "cpc");
  assert.equal(p.get("utm_campaign"), "shadow-set");
  assert.equal(p.get("utm_content"), "video01");
  assert.equal(p.get("utm_term"), "micropigmentacao");
  assert.equal(p.get("src"), "facebook");
  assert.equal(p.get("sck"), "facebook-shadow-set-video01");
});

test("link da Shadow PRO com campanha: resultado literal esperado", () => {
  assert.equal(
    montarUrlCheckout(SHADOW, CAMPANHA),
    "https://pay.hotmart.com/E98531587I?checkoutMode=10&off=k2warcrt" +
      "&utm_source=facebook&utm_medium=cpc&utm_campaign=shadow-set" +
      "&utm_content=video01&utm_term=micropigmentacao" +
      "&src=facebook&sck=facebook-shadow-set-video01"
  );
});

test("src já escrito no link não é sobrescrito", () => {
  const p = params(
    montarUrlCheckout(SHADOW + "&src=parceiro-antigo", CAMPANHA)
  );
  assert.equal(p.get("src"), "parceiro-antigo");
  // e o sck continua sendo montado
  assert.equal(p.get("sck"), "facebook-shadow-set-video01");
});

test("sck já escrito no link não é sobrescrito", () => {
  const p = params(montarUrlCheckout(SHADOW + "&sck=fixo", CAMPANHA));
  assert.equal(p.get("sck"), "fixo");
});

test("utm_source já escrito no link não é sobrescrito", () => {
  const p = params(
    montarUrlCheckout(SHADOW + "&utm_source=organico", CAMPANHA)
  );
  assert.equal(p.get("utm_source"), "organico");
  assert.equal(p.get("utm_medium"), "cpc");
  // src deriva da origem, não do que estava no link
  assert.equal(p.get("src"), "facebook");
});

test("sanitiza espaço, acento e macro do Facebook em src/sck", () => {
  const p = params(
    montarUrlCheckout(SHADOW, {
      utm_source: "facebook",
      utm_campaign: "Shadow Set — Verão 2026",
      utm_content: "{{ad.name}}",
    })
  );
  assert.equal(p.get("src"), "facebook");
  assert.equal(p.get("sck"), "facebook-Shadow-Set-Ver-o-2026-ad.name");
  // o utm_* original vai cru (a Hotmart lê como veio); só src/sck são higienizados
  assert.equal(p.get("utm_campaign"), "Shadow Set — Verão 2026");
});

test("valores gigantes são truncados em 100 caracteres", () => {
  const p = params(
    montarUrlCheckout(SHADOW, {
      utm_source: "a".repeat(150),
      utm_campaign: "b".repeat(150),
    })
  );
  assert.equal(p.get("src")!.length, 100);
  assert.equal(p.get("sck")!.length, 100);
});

test("só utm_source: sck é apenas a fonte", () => {
  const p = params(montarUrlCheckout(SHADOW, { utm_source: "instagram" }));
  assert.equal(p.get("sck"), "instagram");
  assert.equal(p.get("src"), "instagram");
  assert.equal(p.get("utm_medium"), null);
});

test("utm_source que vira vazio depois de sanitizar não cria src nem sck", () => {
  const p = params(montarUrlCheckout(SHADOW, { utm_source: "---" }));
  assert.equal(p.get("src"), null);
  assert.equal(p.get("sck"), null);
  // o utm_source original ainda vai, cru
  assert.equal(p.get("utm_source"), "---");
});

test("link que não é da Hotmart fica intacto", () => {
  const wa = "https://wa.me/5519971634567?text=Oi";
  assert.equal(montarUrlCheckout(wa, CAMPANHA), wa);
  // e nada de domínio que só termina parecido
  const falso = "https://hotmart.com.br/checkout";
  assert.equal(montarUrlCheckout(falso, CAMPANHA), falso);
});

test("subdomínios da hotmart.com são atendidos", () => {
  const p = params(montarUrlCheckout("https://hotmart.com/x", CAMPANHA));
  assert.equal(p.get("src"), "facebook");
  const q = params(montarUrlCheckout("https://go.hotmart.com/A123", CAMPANHA));
  assert.equal(q.get("src"), "facebook");
});

test("href relativo ou inválido volta como está, sem lançar", () => {
  assert.equal(montarUrlCheckout("#oferta", CAMPANHA), "#oferta");
  assert.equal(montarUrlCheckout("", CAMPANHA), "");
  assert.equal(montarUrlCheckout("/lps/x", CAMPANHA), "/lps/x");
});
