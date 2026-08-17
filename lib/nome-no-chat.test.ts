import { test } from "node:test";
import assert from "node:assert/strict";
import { nomeDaMensagem, SEM_NOME } from "./nome-no-chat.ts";

/* ── o jeito que a pessoa responde de verdade ───────────────────────────── */

test("nome sozinho", () => {
  assert.equal(nomeDaMensagem("Ana"), "Ana");
  assert.equal(nomeDaMensagem("Ana Paula"), "Ana Paula");
  assert.equal(nomeDaMensagem("  renata  "), "Renata");
});

test("nome no meio da frase de gente", () => {
  assert.equal(nomeDaMensagem("oi, sou a Ana"), "Ana");
  assert.equal(nomeDaMensagem("meu nome é Renata Lima"), "Renata Lima");
  assert.equal(nomeDaMensagem("me chamo Bia"), "Bia");
  assert.equal(nomeDaMensagem("Bom dia, aqui é a Carla"), "Carla");
  assert.equal(nomeDaMensagem("oi! Ana Paula."), "Ana Paula");
});

test("caixa alta e baixa viram nome de gente", () => {
  // A Hotmart devolve em caixa alta, e tem quem escreva tudo minúsculo.
  assert.equal(nomeDaMensagem("MARIA SILVA"), "Maria Silva");
  assert.equal(nomeDaMensagem("maria silva"), "Maria Silva");
});

test("partícula fica minúscula, como se escreve", () => {
  assert.equal(nomeDaMensagem("Ana de Souza"), "Ana de");
  assert.equal(nomeDaMensagem("sou a Maria da Silva"), "Maria da");
});

test("nome com acento, hífen e apóstrofo sobrevive inteiro", () => {
  // ⚠️ A primeira versão limpava apóstrofo junto da pontuação e transformava
  // "D'Ávila" em "Ávila" — cortava o nome da pessoa pela metade.
  assert.equal(nomeDaMensagem("Thaís"), "Thaís");
  assert.equal(nomeDaMensagem("Ana-Clara"), "Ana-Clara");
  assert.equal(nomeDaMensagem("sou a D'Ávila"), "D'Ávila");
});

/* ── na dúvida, null ────────────────────────────────────────────────────── */

test("saudação sozinha não é nome", () => {
  // ⚠️ Sem isso a caixa do time encheria de conversas chamadas "Oi".
  for (const s of ["oi", "Olá", "bom dia", "Boa tarde", "opa", "tudo bem", "ajuda", "socorro"]) {
    assert.equal(nomeDaMensagem(s), null, s);
  }
});

test("dúvida não vira nome", () => {
  // ⚠️ Quem já chega contando o problema não está se apresentando. Sem esta
  // regra, "onde fica a apostila do primeiro módulo?" virava a aluna
  // **"Onde Fica"** — na conversa e na caixa do time.
  assert.equal(
    nomeDaMensagem("não estou conseguindo entrar no curso que comprei semana passada"),
    null
  );
  assert.equal(nomeDaMensagem("onde fica a apostila do primeiro módulo?"), null);
  assert.equal(nomeDaMensagem("onde fica a apostila"), null);
  assert.equal(nomeDaMensagem("quanto tempo dura o acesso"), null);
  assert.equal(nomeDaMensagem("perdi minha senha"), null);
  assert.equal(nomeDaMensagem("quero meu certificado"), null);
});

test("pergunta curta não vira nome, mesmo sem palavra de dúvida", () => {
  assert.equal(nomeDaMensagem("Ana?"), null);
});

test("e-mail e telefone não viram nome", () => {
  assert.equal(nomeDaMensagem("ana@gmail.com"), null);
  assert.equal(nomeDaMensagem("11 98765-4321"), null);
  assert.equal(nomeDaMensagem("sou a Ana, ana@gmail.com"), null);
});

test("vazio e lixo não quebram", () => {
  assert.equal(nomeDaMensagem(""), null);
  assert.equal(nomeDaMensagem("   "), null);
  assert.equal(nomeDaMensagem("!!!"), null);
  assert.equal(nomeDaMensagem("???"), null);
  assert.equal(nomeDaMensagem(123 as never), null);
});

test("texto longo é dúvida, não apresentação", () => {
  assert.equal(nomeDaMensagem("a".repeat(80)), null);
});

/* ── o rótulo de quem não deu o nome ────────────────────────────────────── */

test("quem não deu o nome não vira 'Teste'", () => {
  // ⚠️ "Teste" era o rótulo de quando só o James conversava. Numa caixa com
  // aluna de verdade, ele faria o time ignorar a conversa.
  assert.notEqual(SEM_NOME.toLowerCase(), "teste");
  assert.match(SEM_NOME, /nome/i);
});
