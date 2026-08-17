import { test } from "node:test";
import assert from "node:assert/strict";
import {
  montarConteudo,
  formatoDoAudio,
  soBase64,
  anexoValido,
  tipoDeConversa,
  MAX_BYTES_ANEXO,
  type Anexo,
} from "./suporte-anexo.ts";

const img: Anexo = { tipo: "imagem", dataUrl: "data:image/png;base64,AAAA" };
const aud: Anexo = { tipo: "audio", dataUrl: "data:audio/ogg;base64,BBBB" };

/* ── o corpo que vai pro modelo ─────────────────────────────────────────── */

test("sem anexo o texto continua texto — não muda o formato à toa", () => {
  assert.equal(montarConteudo("oi", []), "oi");
});

test("print vira image_url, no formato da OpenRouter", () => {
  const c = montarConteudo("não consigo entrar, olha o print", [img]) as any[];
  assert.equal(c[0].type, "text");
  assert.equal(c[1].type, "image_url");
  assert.equal(c[1].image_url.url, img.dataUrl);
});

test("o texto vem ANTES da imagem — é ele que diz o que olhar", () => {
  const c = montarConteudo("olha o erro", [img]) as any[];
  assert.equal(c[0].type, "text");
});

test("áudio vira input_audio com base64 puro, sem o prefixo data:", () => {
  const c = montarConteudo("", [aud]) as any[];
  assert.equal(c[0].type, "input_audio");
  assert.equal(c[0].input_audio.data, "BBBB");
  assert.ok(!c[0].input_audio.data.includes("data:"));
});

test("print sem legenda funciona — muita gente só manda a imagem", () => {
  const c = montarConteudo("", [img]) as any[];
  assert.equal(c.length, 1);
  assert.equal(c[0].type, "image_url");
});

/* ── formato do áudio ───────────────────────────────────────────────────── */

test("audio/mpeg é mp3 (é o que a OpenRouter entende)", () => {
  assert.equal(formatoDoAudio("data:audio/mpeg;base64,x"), "mp3");
});

test("o ogg do WhatsApp passa como ogg", () => {
  // ⚠️ áudio de WhatsApp chega em ogg/opus — é o caso mais provável aqui
  assert.equal(formatoDoAudio("data:audio/ogg;base64,x"), "ogg");
});

test("x-m4a vira m4a", () => {
  assert.equal(formatoDoAudio("data:audio/x-m4a;base64,x"), "m4a");
});

/* ── validação ──────────────────────────────────────────────────────────── */

test("recusa o que não é imagem nem áudio", () => {
  const r = anexoValido({ tipo: "imagem", dataUrl: "data:application/pdf;base64,x" });
  assert.equal(r.ok, false);
});

test("recusa arquivo grande demais", () => {
  const gigante = "data:image/png;base64," + "A".repeat(MAX_BYTES_ANEXO * 2);
  assert.equal(anexoValido({ tipo: "imagem", dataUrl: gigante }).ok, false);
});

test("aceita print normal", () => {
  assert.equal(anexoValido(img).ok, true);
});

/* ── escolha da fila de modelos ─────────────────────────────────────────── */

test("áudio tem prioridade — só um modelo grátis ouve", () => {
  assert.equal(tipoDeConversa([img, aud]), "audio");
  assert.equal(tipoDeConversa([img]), "imagem");
  assert.equal(tipoDeConversa([]), "texto");
});

test("soBase64 tira o prefixo e aguenta string sem ele", () => {
  assert.equal(soBase64("data:image/png;base64,XYZ"), "XYZ");
  assert.equal(soBase64("XYZ"), "XYZ");
});
