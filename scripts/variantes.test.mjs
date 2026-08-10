import { test } from "node:test";
import assert from "node:assert/strict";
import { semVariantes } from "./variantes.mjs";

const f = (url) => ({ url, nome: url.split("/").pop() });
const nomes = (lista) => semVariantes(lista).map((a) => a.nome).sort();

test("fica só a maior das miniaturas do WordPress", () => {
  assert.deepEqual(
    nomes([f("/lp/x/foto.jpg"), f("/lp/x/foto-300x200.jpg"), f("/lp/x/foto-1024x683.jpg")]),
    ["foto.jpg"]
  );
  assert.deepEqual(
    nomes([f("/lp/x/foto-300x200.jpg"), f("/lp/x/foto-1024x683.jpg")]),
    ["foto-1024x683.jpg"],
    "sem o original, sobra a variante maior"
  );
});

test("proporção de tela NÃO é miniatura", () => {
  // foi este o bug: -9x16 é enquadramento vertical, uma foto diferente
  assert.deepEqual(
    nomes([f("/lp/lips-sense/garantia-rosa.webp"), f("/lp/lips-sense/garantia-rosa-9x16.webp")]),
    ["garantia-rosa-9x16.webp", "garantia-rosa.webp"]
  );
});

test("arquivo único com medida no nome sobrevive", () => {
  assert.deepEqual(nomes([f("/lp/x/banner-1080x1920.jpg")]), ["banner-1080x1920.jpg"]);
});

test("espelho: mesmo hash e sufixos diferentes é o mesmo arquivo reimportado", () => {
  const r = semVariantes([
    f("/wpmirror/006295bf875e-kithenna-e50e88e745.mp4"),
    f("/wpmirror/006295bf875e-kithenna-eba40ab364.mp4"),
    f("/wpmirror/006295bf875e-kithenna-ec1b51831e.mp4"),
  ]);
  assert.equal(r.length, 1);
});

test("espelho: hashes diferentes com o mesmo nome são fotos diferentes", () => {
  // sem o hash na chave, o modulo-07 de duas páginas virava um só
  const r = semVariantes([
    f("/wpmirror/0f425242fff3-modulo-07-54346c11d6.jpg"),
    f("/wpmirror/1f8165036282-modulo-07-708e7d70fd.jpg"),
  ]);
  assert.equal(r.length, 2);
});

test("mesmo nome em pastas diferentes não colide", () => {
  const r = semVariantes([
    f("/lp/a/uploads/2023/capa-300x200.jpg"),
    f("/lp/a/uploads/2024/capa-300x200.jpg"),
  ]);
  assert.equal(r.length, 2);
});
