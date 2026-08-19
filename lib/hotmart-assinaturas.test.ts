import { test } from "node:test";
import assert from "node:assert/strict";
import { lerAssinaturas } from "./hotmart-assinaturas.ts";

/**
 * ⚠️ Este é o formato REAL, copiado de uma chamada de verdade a
 * `/subscriptions/transactions?subscriber_email=` (19/08/2026), com os campos
 * de pessoa trocados. Duas parcelas da MESMA compra em 12x — que foi
 * exatamente o que a resposta trouxe.
 */
const RESPOSTA = {
  items: [
    {
      subscriber_code: "XXXX",
      status: "ACTIVE",
      adoption_date: 1782254183000,
      product: { id: 5193669, name: "BASIC MAGIC SHADOW" },
      plan: {
        recurrency_period: 30,
        recurrency_type: "MONTHLY",
        offer: {
          key: "k2warcrt",
          description: "CURSO BASIC MAGIC SHADOW COM PREÇO PROMOCIONAL POR TEMPO LIMITADO!",
        },
      },
      subscription_id: 44601576,
      recurrency: { status: "PAID", number: 1 },
      purchase: {
        transaction: "HP2561203159",
        order_date: 1782254178000,
        approved_date: 1782254183000,
        status: "COMPLETE",
      },
    },
    {
      subscriber_code: "XXXX",
      status: "ACTIVE",
      adoption_date: 1782254183000,
      product: { id: 5193669, name: "BASIC MAGIC SHADOW" },
      plan: { offer: { key: "k2warcrt" } },
      subscription_id: 44601576,
      recurrency: { status: "PAID", number: 2 },
      purchase: {
        transaction: "HP0159290450",
        order_date: 1784815590000,
        status: "DELAYED",
      },
    },
  ],
};

test("12 parcelas viram UMA compra", () => {
  // ⚠️ Sem juntar, quem comprou em 12x apareceria como 12 compras do mesmo
  // curso — e a conversa começaria por "você comprou 12 vezes?".
  const c = lerAssinaturas(RESPOSTA);
  assert.equal(c.length, 1);
  assert.equal(c[0]!.produto, "BASIC MAGIC SHADOW");
});

test("a data é a da ADESÃO, não a da parcela", () => {
  // ⚠️ Usar a data da parcela faria a 6ª parecer compra nova, e o acesso de
  // 12 meses passaria a contar do mês passado pra quem comprou ano passado.
  const c = lerAssinaturas(RESPOSTA);
  assert.match(c[0]!.compradaEm, /^2026-06/);
});

test("milissegundos, não segundos", () => {
  // ⚠️ Tratar como segundos jogaria a compra pra 1970 — e TODA aluna
  // apareceria com acesso vencido há 50 anos.
  const c = lerAssinaturas(RESPOSTA);
  assert.ok(new Date(c[0]!.compradaEm).getFullYear() > 2020, c[0]!.compradaEm);
  assert.ok(new Date(c[0]!.compradaEm).getFullYear() < 2100);
});

test("parcela atrasada não vira compra cancelada", () => {
  // ⚠️ Vale a situação da ASSINATURA. "DELAYED" numa parcela quer dizer que o
  // cartão não passou este mês, não que ela perdeu o curso.
  const c = lerAssinaturas(RESPOSTA);
  assert.equal(c[0]!.situacao, "active");
});

test("assinatura cancelada aparece como cancelada", () => {
  const c = lerAssinaturas({
    items: [
      {
        status: "CANCELLED",
        adoption_date: 1700000000000,
        subscription_id: 1,
        product: { name: "X" },
      },
    ],
  });
  // A lista de canceladas de `suporte-acesso` casa com "cancelled".
  assert.equal(c[0]!.situacao, "cancelled");
});

test("sem nome de produto, usa a descrição da oferta", () => {
  const c = lerAssinaturas({
    items: [
      {
        status: "ACTIVE",
        adoption_date: 1700000000000,
        subscription_id: 2,
        plan: { offer: { description: "CURSO FIO A FIO" } },
      },
    ],
  });
  assert.equal(c[0]!.produto, "CURSO FIO A FIO");
});

test("item sem data nenhuma é descartado", () => {
  // ⚠️ Sem data não dá pra calcular os 12 meses, e uma compra sem prazo faria
  // a IA dizer "está tudo certo" pra quem já venceu.
  assert.deepEqual(lerAssinaturas({ items: [{ status: "ACTIVE", product: { name: "X" } }] }), []);
});

test("resposta vazia ou estranha não quebra", () => {
  assert.deepEqual(lerAssinaturas({ items: [] }), []);
  assert.deepEqual(lerAssinaturas({}), []);
  assert.deepEqual(lerAssinaturas(null), []);
  assert.deepEqual(lerAssinaturas("nada disso"), []);
});

test("mais de um curso continua sendo mais de uma compra", () => {
  const c = lerAssinaturas({
    items: [
      { status: "ACTIVE", adoption_date: 1700000000000, subscription_id: 1, product: { name: "A" } },
      { status: "ACTIVE", adoption_date: 1750000000000, subscription_id: 2, product: { name: "B" } },
    ],
  });
  assert.equal(c.length, 2);
  // Mais recente primeiro — é ela que dá o prazo maior.
  assert.equal(c[0]!.produto, "B");
});
