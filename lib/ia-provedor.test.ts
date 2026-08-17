import { test } from "node:test";
import assert from "node:assert/strict";
import { escolherProvedor, recadoDeLimite } from "./ia-provedor.ts";

const filasOR = {
  texto: ["a/b:free"],
  imagem: ["c/d:free"],
  audio: ["e/f:free"],
} as const;

const escolher = (env: Record<string, string | undefined>) =>
  escolherProvedor(env, filasOR);

/* ── quem responde ──────────────────────────────────────────────────────── */

test("com chave do Gemini, usa Gemini sem precisar configurar mais nada", () => {
  // ⚠️ É o que o James faz: cola a chave e pronto. Se precisasse mexer em
  // código junto, a troca dependeria de deploy.
  const p = escolher({ GEMINI_API_KEY: "g-123" });
  assert.equal(p?.nome, "gemini");
  assert.match(p!.endpoint, /generativelanguage\.googleapis\.com/);
  assert.equal(p!.chave, "g-123");
});

test("sem Gemini, continua na OpenRouter", () => {
  const p = escolher({ OPENROUTER_API_KEY: "or-123" });
  assert.equal(p?.nome, "openrouter");
  assert.match(p!.endpoint, /openrouter\.ai/);
});

test("com as duas chaves, Gemini ganha", () => {
  const p = escolher({ GEMINI_API_KEY: "g", OPENROUTER_API_KEY: "or" });
  assert.equal(p?.nome, "gemini");
});

test("dá pra forçar a OpenRouter mesmo tendo Gemini", () => {
  // Serve pra comparar os dois lado a lado sem apagar chave.
  const p = escolher({
    IA_PROVEDOR: "openrouter",
    GEMINI_API_KEY: "g",
    OPENROUTER_API_KEY: "or",
  });
  assert.equal(p?.nome, "openrouter");
});

test("sem chave nenhuma devolve null, pra virar erro claro na tela", () => {
  assert.equal(escolher({}), null);
});

test("chave em branco não conta como chave", () => {
  // Var vazia na Vercel é comum e enganava: parecia configurado e falhava.
  assert.equal(escolher({ GEMINI_API_KEY: "   " }), null);
  assert.equal(escolher({ GEMINI_API_KEY: "", OPENROUTER_API_KEY: "or" })?.nome, "openrouter");
});

test("forçar Gemini sem ter a chave dele cai na OpenRouter em vez de quebrar", () => {
  const p = escolher({ IA_PROVEDOR: "gemini", OPENROUTER_API_KEY: "or" });
  assert.equal(p?.nome, "openrouter");
});

/* ── o que cada um aceita no corpo ──────────────────────────────────────── */

test("`reasoning` só vai pra OpenRouter", () => {
  // ⚠️ É invenção da OpenRouter. Mandar pro Gemini derruba o pedido inteiro
  // por campo desconhecido — e o áudio/print da aluna sumiria junto.
  assert.deepEqual(escolher({ OPENROUTER_API_KEY: "or" })!.extras, {
    reasoning: { exclude: true },
  });
  assert.deepEqual(escolher({ GEMINI_API_KEY: "g" })!.extras, {});
});

test("cabeçalho X-Title é só da OpenRouter, e só ASCII", () => {
  const or = escolher({ OPENROUTER_API_KEY: "or" })!;
  assert.equal(or.cabecalhos["X-Title"], "Jay Academy Suporte");
  // eslint-disable-next-line no-control-regex
  assert.ok(/^[\x00-\x7F]*$/.test(or.cabecalhos["X-Title"]));
  assert.deepEqual(escolher({ GEMINI_API_KEY: "g" })!.cabecalhos, {});
});

/* ── as filas ───────────────────────────────────────────────────────────── */

test("no Gemini o mesmo modelo lê texto, print e áudio", () => {
  // Era o ponto mais frágil do desenho antigo: um único modelo gratuito ouvia
  // áudio na OpenRouter, sem nenhum fallback embaixo.
  const p = escolher({ GEMINI_API_KEY: "g" })!;
  assert.deepEqual(p.filas.texto, p.filas.imagem);
  assert.deepEqual(p.filas.texto, p.filas.audio);
  assert.ok(p.filas.audio.length > 1, "áudio precisa de rede de proteção");
});

test("a fila do Gemini não tem modelo aposentado", () => {
  // ⚠️ `gemini-2.5-flash` APARECIA em GET /models desta conta e mesmo assim
  // respondia 404 "no longer available to new users". Listar não é funcionar —
  // cada modelo daqui foi testado com chamada real.
  const p = escolher({ GEMINI_API_KEY: "g" })!;
  for (const m of p.filas.texto) {
    assert.ok(!m.startsWith("gemini-2."), `${m} é da geração aposentada`);
  }
});

test("a fila do Gemini termina num apelido que o Google reaponta sozinho", () => {
  // Sem isso, a lista envelhece calada: um dia todos os IDs fixos aposentam de
  // uma vez e o suporte para sem ninguém ter mexido em nada.
  const p = escolher({ GEMINI_API_KEY: "g" })!;
  assert.match(p.filas.texto.at(-1)!, /-latest$/);
});

test("a OpenRouter mantém as filas separadas que ela precisa", () => {
  const p = escolher({ OPENROUTER_API_KEY: "or" })!;
  assert.deepEqual(p.filas.imagem, filasOR.imagem);
  assert.deepEqual(p.filas.audio, filasOR.audio);
});

/* ── o recado de limite ─────────────────────────────────────────────────── */

test("o recado de limite diz o fornecedor certo", () => {
  assert.match(recadoDeLimite("gemini"), /Gemini/);
  assert.match(recadoDeLimite("openrouter"), /OpenRouter/);
});
