import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mimeDeAudio,
  paraGeminiNativo,
  urlNativa,
  lerRespostaNativa,
  erroNativo,
} from "./gemini-nativo.ts";

const opcoes = { temperature: 0.4, maxOutputTokens: 900 };

/* ── o tipo do áudio ────────────────────────────────────────────────────── */

test("ogg do WhatsApp vira audio/ogg — o motivo deste arquivo existir", () => {
  // ⚠️ A camada de compatibilidade recusa ogg com 400. O nativo aceita. Sem
  // isto, toda mensagem de voz de aluna cairia pra atendente.
  assert.equal(mimeDeAudio("ogg"), "audio/ogg");
  assert.equal(mimeDeAudio("opus"), "audio/ogg");
});

test("mp3 vira audio/mpeg, não audio/mp3", () => {
  // "audio/mp3" não é tipo MIME de verdade e o Gemini recusa.
  assert.equal(mimeDeAudio("mp3"), "audio/mpeg");
  assert.equal(mimeDeAudio("mpeg"), "audio/mpeg");
});

test("os outros formatos que a aluna pode mandar", () => {
  assert.equal(mimeDeAudio("wav"), "audio/wav");
  assert.equal(mimeDeAudio("m4a"), "audio/mp4"); // áudio de iPhone
  assert.equal(mimeDeAudio("x-m4a"), "audio/mp4");
  assert.equal(mimeDeAudio("WAV"), "audio/wav");
});

/* ── a tradução da conversa ─────────────────────────────────────────────── */

test("as regras saem da conversa e viram instrução de sistema", () => {
  // ⚠️ Se ficassem como fala, o modelo trataria as regras como pedido da aluna
  // — e aí inventa preço, promete coisa e ignora o "chame uma pessoa". Não dá
  // erro nenhum: só passa a se comportar errado.
  const p = paraGeminiNativo(
    [
      { role: "system", content: "Nunca fale de preço." },
      { role: "user", content: "oi" },
    ],
    opcoes
  );
  assert.deepEqual(p.systemInstruction, {
    parts: [{ text: "Nunca fale de preço." }],
  });
  assert.equal(p.contents.length, 1);
  assert.equal(p.contents[0].role, "user");
});

test("no Gemini o assistente chama `model`, não `assistant`", () => {
  const p = paraGeminiNativo(
    [
      { role: "user", content: "oi" },
      { role: "assistant", content: "Oi! Como posso ajudar?" },
      { role: "user", content: "meu acesso sumiu" },
    ],
    opcoes
  );
  assert.deepEqual(
    p.contents.map((c) => c.role),
    ["user", "model", "user"]
  );
});

test("áudio vira inline_data com o tipo certo", () => {
  const p = paraGeminiNativo(
    [
      {
        role: "user",
        content: [
          { type: "text", text: "escuta isso" },
          { type: "input_audio", input_audio: { data: "QUJD", format: "ogg" } },
        ],
      },
    ],
    opcoes
  );
  assert.deepEqual(p.contents[0].parts, [
    { text: "escuta isso" },
    { inline_data: { mime_type: "audio/ogg", data: "QUJD" } },
  ]);
});

test("print junto do áudio também é traduzido", () => {
  const p = paraGeminiNativo(
    [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: "data:image/png;base64,QUJD" } },
        ],
      },
    ],
    opcoes
  );
  assert.deepEqual(p.contents[0].parts, [
    { inline_data: { mime_type: "image/png", data: "QUJD" } },
  ]);
});

test("link de imagem é descartado em vez de virar pedido quebrado", () => {
  // O Gemini não busca URL externa. Mandar o link faria ele responder sobre uma
  // imagem que nunca viu — pior que não responder.
  const p = paraGeminiNativo(
    [
      {
        role: "user",
        content: [
          { type: "text", text: "olha" },
          { type: "image_url", image_url: { url: "https://exemplo.com/a.png" } },
        ],
      },
    ],
    opcoes
  );
  assert.deepEqual(p.contents[0].parts, [{ text: "olha" }]);
});

test("mensagem que ficaria vazia não entra na conversa", () => {
  // ⚠️ O Gemini recusa `parts: []` com 400 — e aí o áudio da aluna se perderia
  // por causa de uma linha em branco no histórico.
  const p = paraGeminiNativo(
    [
      { role: "user", content: "  " },
      { role: "user", content: [] },
      { role: "user", content: "oi" },
    ],
    opcoes
  );
  assert.equal(p.contents.length, 1);
  assert.deepEqual(p.contents[0].parts, [{ text: "oi" }]);
});

test("sem regras, não manda o campo de sistema vazio", () => {
  const p = paraGeminiNativo([{ role: "user", content: "oi" }], opcoes);
  assert.equal(p.systemInstruction, undefined);
});

test("temperatura e teto vão pro lugar que o Gemini lê", () => {
  const p = paraGeminiNativo([{ role: "user", content: "oi" }], opcoes);
  assert.deepEqual(p.generationConfig, {
    temperature: 0.4,
    maxOutputTokens: 900,
  });
});

/* ── o endereço ─────────────────────────────────────────────────────────── */

test("o endereço aponta pro modelo e pede generateContent", () => {
  assert.equal(
    urlNativa("gemini-3.6-flash"),
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"
  );
});

/* ── a leitura da resposta ──────────────────────────────────────────────── */

test("junta as partes de texto da resposta", () => {
  const r = lerRespostaNativa({
    candidates: [{ content: { parts: [{ text: "Oi, " }, { text: "Renata!" }] } }],
  });
  assert.equal(r, "Oi, Renata!");
});

test("descarta a parte de raciocínio", () => {
  // ⚠️ Rascunho do modelo NUNCA chega na aluna. Já aconteceu antes, no outro
  // fornecedor: veio "We need to follow instructions..." em inglês.
  const r = lerRespostaNativa({
    candidates: [
      {
        content: {
          parts: [
            { text: "O usuário quer saber do acesso...", thought: true },
            { text: "Me passa o e-mail da compra?" },
          ],
        },
      },
    ],
  });
  assert.equal(r, "Me passa o e-mail da compra?");
});

test("resposta vazia ou estranha devolve null, pra tentar o próximo modelo", () => {
  assert.equal(lerRespostaNativa({}), null);
  assert.equal(lerRespostaNativa({ candidates: [] }), null);
  assert.equal(lerRespostaNativa({ candidates: [{ content: { parts: [] } }] }), null);
  assert.equal(
    lerRespostaNativa({ candidates: [{ content: { parts: [{ text: "   " }] } }] }),
    null
  );
  assert.equal(lerRespostaNativa(null), null);
});

/* ── o erro ─────────────────────────────────────────────────────────────── */

test("tira a mensagem do erro do Google pro log dizer o que houve", () => {
  assert.equal(
    erroNativo('{"error":{"code":400,"message":"Invalid audio format"}}'),
    "Invalid audio format"
  );
});

test("erro sem mensagem não quebra o log", () => {
  assert.equal(erroNativo("indisponível"), "indisponível");
});
