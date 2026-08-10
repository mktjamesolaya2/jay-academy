import { test } from "node:test";
import assert from "node:assert/strict";
import { albunsDa, unirAlbuns, tirarAlbum, moverPara } from "./media-albuns.ts";
import type { MediaItem } from "./media-types.ts";

const foto = (extra: Partial<MediaItem> = {}): MediaItem => ({
  id: "abc",
  name: "logo.png",
  url: "/wpmirror/logo.png",
  category: "Importadas do WP",
  type: "image",
  uploadedAt: "2026-01-01T00:00:00.000Z",
  ...extra,
});

/* ── unirAlbuns: o bug das 76 páginas / 46 álbuns ───────────────────────── */

test("a mesma foto fica nos álbuns de TODAS as páginas que a usam", () => {
  // era isto: a página 3 sobrescrevia, e as páginas 1 e 2 ficavam vazias
  let m = foto({ pageId: "wp:main:pagina-1" });
  m = unirAlbuns(m, ["wp:main:pagina-2"]);
  m = unirAlbuns(m, ["wp:main:pagina-3"]);
  assert.deepEqual(albunsDa(m), [
    "wp:main:pagina-1",
    "wp:main:pagina-2",
    "wp:main:pagina-3",
  ]);
});

test("unirAlbuns não duplica e devolve a mesma mídia quando nada muda", () => {
  const m = foto({ pageId: "wp:a", albuns: ["wp:a", "wp:b"] });
  assert.equal(unirAlbuns(m, ["wp:b"]), m, "sem mudança tem que ser o MESMO objeto");
  assert.deepEqual(albunsDa(unirAlbuns(m, ["wp:a", "wp:b"])), ["wp:a", "wp:b"]);
});

test("mídia sem álbum nenhum ganha o primeiro como principal", () => {
  const m = unirAlbuns(foto(), ["wp:a"]);
  assert.equal(m.pageId, "wp:a");
  assert.deepEqual(m.albuns, ["wp:a"]);
});

test("unir NÃO troca o álbum principal de quem já tem um", () => {
  // o principal é a escolha do usuário no "Mover pra" — importar não mexe nele
  const m = unirAlbuns(foto({ pageId: "pg-escolhido" }), ["wp:novo"]);
  assert.equal(m.pageId, "pg-escolhido");
});

test("registro antigo (só pageId, sem albuns) é lido como um álbum", () => {
  assert.deepEqual(albunsDa(foto({ pageId: "wp:antigo" })), ["wp:antigo"]);
  assert.deepEqual(albunsDa(foto()), []);
});

/* ── tirarAlbum ─────────────────────────────────────────────────────────── */

test("excluir um álbum não tira a foto dos outros", () => {
  const m = tirarAlbum(foto({ pageId: "wp:a", albuns: ["wp:a", "wp:b"] }), "wp:a");
  assert.deepEqual(albunsDa(m), ["wp:b"]);
  assert.equal(m.pageId, "wp:b", "o principal cai pro que sobrou");
});

test("tirar o único álbum deixa a mídia sem álbum, não some com ela", () => {
  const m = tirarAlbum(foto({ pageId: "wp:a", albuns: ["wp:a"] }), "wp:a");
  assert.equal(m.pageId, undefined);
  assert.deepEqual(albunsDa(m), []);
});

test("tirar álbum que a mídia não tem devolve a mesma mídia", () => {
  const m = foto({ pageId: "wp:a" });
  assert.equal(tirarAlbum(m, "wp:z"), m);
});

/* ── moverPara ──────────────────────────────────────────────────────────── */

test("mover é escolha do usuário: fica só no álbum de destino", () => {
  const m = moverPara(foto({ pageId: "wp:a", albuns: ["wp:a", "wp:b", "wp:c"] }), "pg-1");
  assert.deepEqual(albunsDa(m), ["pg-1"]);
});

test("mover pra 'sem álbum' limpa tudo", () => {
  const m = moverPara(foto({ pageId: "wp:a", albuns: ["wp:a", "wp:b"] }), null);
  assert.equal(m.pageId, undefined);
  assert.deepEqual(albunsDa(m), []);
});
