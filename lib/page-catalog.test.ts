// Testes do catálogo de páginas. Rodar com:
//   node --experimental-strip-types --test lib/page-catalog.test.ts
// (mesmo padrão de lib/wp-localize-core.test.ts)

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  mergeCatalog,
  catalogCounts,
  sourceLabel,
  sourceColors,
  type CatalogEntry,
} from "./page-catalog-core.ts";
import { lpHtmlPages, lpHtmlRedirects } from "./lp-html-registry.ts";

function entry(partial: Partial<CatalogEntry> & { url: string }): CatalogEntry {
  return {
    slug: partial.url.replace(/^\//, ""),
    title: partial.url,
    source: "builder",
    category: "venda",
    status: "published",
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// mergeCatalog: precedência e colisão
// ---------------------------------------------------------------------------

test("primeira camada vence e entrada sombreada marca colisão", () => {
  const dedicated = entry({ url: "/laser", source: "embedded-kv" });
  const wpShadowed = entry({ url: "/laser", source: "wp-mirror" });
  const merged = mergeCatalog([[dedicated], [wpShadowed]]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].source, "embedded-kv");
  assert.equal(merged[0].collision, true);
});

test("URLs distintas não colidem", () => {
  const merged = mergeCatalog([
    [entry({ url: "/a", source: "lp-html" })],
    [entry({ url: "/b", source: "wp-mirror" })],
  ]);
  assert.equal(merged.length, 2);
  assert.ok(merged.every((e) => !e.collision));
});

test("mesma página em duas camadas (mesmo slug e fonte) não é colisão", () => {
  const merged = mergeCatalog([
    [entry({ url: "/pmuclass", slug: "pmuclass", source: "lp-html" })],
    [entry({ url: "/pmuclass", slug: "pmuclass", source: "lp-html" })],
  ]);
  assert.equal(merged.length, 1);
  assert.ok(!merged[0].collision);
});

test("merge não muta as entradas originais", () => {
  const original = entry({ url: "/x", source: "lp-html" });
  const merged = mergeCatalog([[original], [entry({ url: "/x" })]]);
  assert.equal(original.collision, undefined);
  assert.equal(merged[0].collision, true);
});

// ---------------------------------------------------------------------------
// catalogCounts
// ---------------------------------------------------------------------------

test("catalogCounts agrega por fonte, categoria, status e colisões", () => {
  const entries = [
    entry({ url: "/a", source: "lp-html", category: "venda" }),
    entry({ url: "/b", source: "lp-html", category: "website" }),
    entry({ url: "/c", source: "wp-mirror", status: "draft" }),
    { ...entry({ url: "/d", source: "wp-mirror" }), collision: true },
  ];
  const counts = catalogCounts(entries);
  assert.equal(counts.total, 4);
  assert.equal(counts.bySource["lp-html"], 2);
  assert.equal(counts.bySource["wp-mirror"], 2);
  assert.equal(counts.byCategory.venda, 3);
  assert.equal(counts.byCategory.website, 1);
  assert.equal(counts.byStatus.published, 3);
  assert.equal(counts.byStatus.draft, 1);
  assert.equal(counts.collisions, 1);
});

test("toda fonte tem label e cores", () => {
  for (const source of Object.keys(sourceLabel) as (keyof typeof sourceColors)[]) {
    assert.ok(sourceLabel[source].length > 0);
    assert.ok(sourceColors[source].dot.startsWith("bg-"));
  }
});

// ---------------------------------------------------------------------------
// Sanidade do registro estático × arquivos reais do repo
// (pega dessincronização quando alguém cria/remove LP sem atualizar o registro)
// ---------------------------------------------------------------------------

const ROOT = path.resolve(import.meta.dirname, "..");

test("registro lp-html: todo htmlFile existe no repo", () => {
  for (const p of lpHtmlPages) {
    assert.ok(
      existsSync(path.join(ROOT, p.htmlFile)),
      `htmlFile não existe: ${p.htmlFile} (slug ${p.slug})`
    );
  }
});

test("registro lp-html: todo slug tem route handler dedicado", () => {
  for (const p of lpHtmlPages) {
    const route = path.join(ROOT, "app", p.slug, "route.ts");
    assert.ok(existsSync(route), `route handler não existe: app/${p.slug}/route.ts`);
  }
});

test("registro lp-html: todo assetsDir declarado existe", () => {
  for (const p of lpHtmlPages) {
    if (!p.assetsDir) continue;
    assert.ok(
      existsSync(path.join(ROOT, p.assetsDir)),
      `assetsDir não existe: ${p.assetsDir} (slug ${p.slug})`
    );
  }
});

test("todo lp-html/<slug>.html público está no registro", () => {
  // Parciais começam com _ e não são páginas; o resto precisa estar registrado
  const registered = new Set(lpHtmlPages.map((p) => p.htmlFile));
  const files = readdirSync(path.join(ROOT, "lp-html")).filter(
    (f: string) => f.endsWith(".html") && !f.startsWith("_")
  );
  for (const f of files) {
    assert.ok(
      registered.has(`lp-html/${f}`),
      `lp-html/${f} não está em lib/lp-html-registry.ts`
    );
  }
});

test("redirects apontam pra slugs registrados", () => {
  const slugs = new Set(lpHtmlPages.map((p) => p.slug));
  for (const r of lpHtmlRedirects) {
    assert.ok(slugs.has(r.to), `redirect ${r.from} → ${r.to}: destino não registrado`);
    const route = path.join(ROOT, "app", r.from, "route.ts");
    assert.ok(existsSync(route), `redirect sem handler: app/${r.from}/route.ts`);
  }
});
