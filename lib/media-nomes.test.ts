import { test } from "node:test";
import assert from "node:assert/strict";
import { limparNome, escolherCapa } from "./media-nomes.ts";

/* ── limparNome ────────────────────────────────────────────────────────── */

test("limparNome decodifica entidade numérica (o caso que aparecia na tela)", () => {
  assert.equal(
    limparNome("[ACAO] JAYREMOVE Campanha &#8211; REMOVE_2025"),
    "[ACAO] JAYREMOVE Campanha – REMOVE_2025"
  );
});

test("limparNome decodifica entidade nomeada e hexadecimal", () => {
  assert.equal(limparNome("Shadow &amp; Nano"), "Shadow & Nano");
  assert.equal(limparNome("caf&#xe9;"), "café");
});

test("limparNome tira tags e normaliza espaço", () => {
  assert.equal(limparNome("<b>Basic</b>   Magic  Shadow "), "Basic Magic Shadow");
});

test("limparNome não estraga entidade desconhecida", () => {
  assert.equal(limparNome("a &naoexiste; b"), "a &naoexiste; b");
});

/* ── escolherCapa ──────────────────────────────────────────────────────── */

const img = (url: string, size?: number, name?: string) =>
  ({ url, type: "image", size, name }) as const;

test("escolherCapa pega a maior imagem, não a primeira", () => {
  // era isto que dava capa de despertador borrado: vencia a primeira da lista
  const capa = escolherCapa([
    img("/a/pequena.jpg", 20_000),
    img("/a/grande.jpg", 900_000),
  ]);
  assert.equal(capa, "/a/grande.jpg");
});

test("escolherCapa descarta ícone, logo e arquivo minúsculo", () => {
  const capa = escolherCapa([
    img("/a/favicon.png", 5_000),
    img("/a/logo-oficial.png", 800_000),
    img("/a/foto.jpg", 300_000),
  ]);
  assert.equal(capa, "/a/foto.jpg", "logo grande não pode virar capa");
});

test("escolherCapa cai pro melhor disponível quando só há enfeite", () => {
  const capa = escolherCapa([img("/a/icon-1.svg", 900), img("/a/icon-2.svg", 4_000)]);
  assert.equal(capa, "/a/icon-2.svg");
});

test("escolherCapa ignora o que não é imagem e devolve nada se não houver", () => {
  assert.equal(
    escolherCapa([{ url: "/a/v.mp4", type: "video", size: 9_000_000 }]),
    undefined
  );
  assert.equal(escolherCapa([]), undefined);
});
