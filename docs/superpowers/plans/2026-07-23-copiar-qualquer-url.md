# Copiar de uma URL (qualquer página, não só WP) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Destravar o "Copiar de uma URL" pra aceitar qualquer endereço (não só o WordPress da Jay), reusando o pipeline de localização de assets que já existe, sem misturar cópias não-WP com o rótulo "WP".

**Architecture:** Um buscador híbrido (`fetch` simples → navegador robô quando a página vem vazia) alimenta o mesmo `saveContent` + localização de assets do fluxo WP. O identificador de página (`domain`) é ampliado de `"main"|"lp"` pra qualquer host, e cada página guarda sua origem (`sourceKind: 'wp'|'web'`), que passa a controlar TODA a exibição (fim do rótulo "WP" hardcoded).

**Tech Stack:** Next.js 16 (App Router, Server Actions), TypeScript, `puppeteer-core` + `@sparticuz/chromium` (navegador robô), KV (Vercel KV), testes com `node --experimental-strip-types --test`.

## Global Constraints

- **Testes:** `node --experimental-strip-types --test lib/<arquivo>.test.ts` (NÃO há script `test` no package.json). Typecheck: `npx tsc --noEmit`.
- **Dev:** `npm run dev` roda na **porta 4000** (não 3000).
- **Localhost-first:** construir e validar tudo local; push pra produção só quando o James autorizar (feito como o dono `James Olaya <suporte@jamesolaya.com.br>` + PAT `token_mktjamesolaya2`).
- **Nada de "não-WP virando WP":** toda exibição decide pela `sourceKind`, nunca por `domain === "main" ? ... : "lp.jayacademy.com.br"`.
- **KV:** depois de mexer no `SavedSummary`, rodar `/api/wp-localize?rebuildindex=1` (logado admin).
- **Comentários/docs em PT-BR** (padrão do projeto).
- **Rota `/wp-pages` NÃO é renomeada** (só o rótulo visível) — evita tocar ~12 arquivos.

---

## File Structure

**Novos:**
- `lib/web-slug.ts` — `deriveWebSlug(url)` puro/testável.
- `lib/fetch-any-url.ts` — `fetchAnyUrl(url, opts)` + `looksEmpty(html)`; orquestra fetch simples ↔ headless.
- `lib/headless-fetch.ts` — `renderHeadless(url)` (server-only; Chrome local / `@sparticuz/chromium` na Vercel).
- `lib/page-origin.ts` — `pageOriginLabel(p)` puro/testável (rótulo por origem).
- `components/import-by-link.tsx` — formulário "Copiar de uma URL" (recriado).
- `lib/web-slug.test.ts`, `lib/fetch-any-url.test.ts`, `lib/page-origin.test.ts`.

**Modificados:**
- `lib/wp-localize-core.ts` — extrator genérico `extractAssetUrls`; `extractWpAssetUrls` vira caso particular.
- `lib/wp-localize.ts` — `localizePage`/`relocatePage` aceitam `domain: string`; usa extrator genérico p/ `sourceKind==='web'`.
- `lib/wp-content-storage.ts` — `domain: string`, `sourceKind`, `sourceUrl`; assinaturas `WpDomain`→`string`; `SavedSummary` ganha `sourceKind`+`sourceUrl`.
- `lib/page-summary.ts` — assinatura `WpDomain`→`string`.
- `lib/page-catalog-core.ts` / `lib/page-catalog.ts` — `PageSource` `web-mirror` + label "Copiada da web".
- `app/wp-pages/import-actions.ts` — `importByLinksAction` com branch web.
- `app/wp-pages/page.tsx` — heading "Páginas copiadas" + botão + etiqueta de origem.
- `components/sidebar-shell.tsx:34` — rótulo → "Páginas copiadas".
- `components/wp-page-card.tsx:41`, `components/search-modal.tsx:78`, `app/lixeira/page.tsx:100`, `app/wp-pages/[domain]/[slug]/page.tsx:68` — usar `pageOriginLabel`.
- `package.json` — `puppeteer-core`, `@sparticuz/chromium`.

---

## Task 1: Slug robusto (`deriveWebSlug`)

**Files:**
- Create: `lib/web-slug.ts`
- Test: `lib/web-slug.test.ts`

**Interfaces:**
- Produces: `deriveWebSlug(rawUrl: string): string` — slug do caminho inteiro, `home` na raiz.

- [ ] **Step 1: Write the failing test**

```ts
// lib/web-slug.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveWebSlug } from "./web-slug.ts";

test("caminho inteiro vira slug (sem colisão a/oferta vs b/oferta)", () => {
  assert.equal(deriveWebSlug("https://site.com/planos/anual/oferta"), "planos-anual-oferta");
  assert.notEqual(
    deriveWebSlug("https://site.com/a/oferta"),
    deriveWebSlug("https://site.com/b/oferta")
  );
});

test("homepage sem caminho vira 'home'", () => {
  assert.equal(deriveWebSlug("https://site.com/"), "home");
  assert.equal(deriveWebSlug("https://site.com"), "home");
});

test("normaliza acentos, espaços e maiúsculas; ignora query/hash", () => {
  assert.equal(deriveWebSlug("https://site.com/Promoção Especial?x=1#z"), "promocao-especial");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test lib/web-slug.test.ts`
Expected: FAIL (`Cannot find module './web-slug.ts'`).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/web-slug.ts
// Deriva um slug estável do caminho INTEIRO da URL (não só o último pedaço),
// pra site.com/a/oferta e site.com/b/oferta não colidirem. Homepage → "home".
export function deriveWebSlug(rawUrl: string): string {
  let path = "";
  try {
    path = new URL(rawUrl).pathname;
  } catch {
    path = rawUrl;
  }
  const slug = decodeURIComponent(path)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tira acentos
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "") // tira extensão tipo .html
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "home";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test lib/web-slug.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/web-slug.ts lib/web-slug.test.ts
git commit -m "feat(copiar-url): deriveWebSlug robusto (caminho inteiro + fallback home)"
```

---

## Task 2: Extrator de assets genérico

**Files:**
- Modify: `lib/wp-localize-core.ts`
- Test: `lib/wp-localize-core.test.ts` (adiciona casos)

**Interfaces:**
- Produces: `isAssetUrl(url: string): boolean`; `extractAssetUrls(html: string, baseUrl?: string, accept?: (u: string) => boolean): string[]`.
- Mantém: `extractWpAssetUrls(html, baseUrl)` (agora = `extractAssetUrls(html, baseUrl, isWpAssetUrl)`).

- [ ] **Step 1: Write the failing test**

```ts
// adicionar em lib/wp-localize-core.test.ts
import { extractAssetUrls, isAssetUrl } from "./wp-localize-core.ts";

test("extractAssetUrls pega assets de QUALQUER host, resolvendo relativo", () => {
  const html = `
    <img src="/img/hero.png">
    <link rel="stylesheet" href="https://cdn.outro.com/app.css">
    <div style="background:url('bg.jpg')"></div>
    <script src="https://site.com/bundle.js"></script>`;
  const urls = extractAssetUrls(html, "https://site.com/pagina");
  assert.ok(urls.includes("https://site.com/img/hero.png"));
  assert.ok(urls.includes("https://cdn.outro.com/app.css"));
  assert.ok(urls.includes("https://site.com/bg.jpg"));
  assert.ok(urls.includes("https://site.com/bundle.js"));
});

test("isAssetUrl aceita por extensão, ignora não-asset", () => {
  assert.ok(isAssetUrl("https://x.com/a.woff2"));
  assert.equal(isAssetUrl("https://x.com/pagina-sem-ext"), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test lib/wp-localize-core.test.ts`
Expected: FAIL (`extractAssetUrls`/`isAssetUrl` não exportados).

- [ ] **Step 3: Write minimal implementation**

Em `lib/wp-localize-core.ts`, adicionar após `isWpAssetUrl` (~linha 62):

```ts
/** Verdadeiro se a URL absoluta aponta pra um asset (por extensão), de qualquer host. */
export function isAssetUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ASSET_EXT_RE.test(u.pathname + u.search);
  } catch {
    return false;
  }
}

/**
 * Versão genérica do extractWpAssetUrls: mesma varredura (src/href/srcset/url()),
 * mas o filtro de aceitação é injetável. `accept` default = qualquer asset por
 * extensão, de qualquer host. O catch-all de URLs escapadas em JSON também é geral.
 */
export function extractAssetUrls(
  html: string,
  baseUrl?: string,
  accept: (u: string) => boolean = isAssetUrl
): string[] {
  const found = new Set<string>();
  const add = (raw: string | undefined | null) => {
    if (!raw) return;
    const abs = resolveUrl(raw, baseUrl);
    if (abs && accept(abs)) found.add(abs);
  };

  const attrR = /\b(?:src|href|poster|data-src|data-lazy-src|data-bg|data-background)\s*=\s*["']([^"']+)["']/gi;
  for (const m of html.matchAll(attrR)) add(m[1]);

  const srcsetR = /\b(?:srcset|data-lazy-srcset|imagesrcset)\s*=\s*["']([^"']+)["']/gi;
  for (const m of html.matchAll(srcsetR)) for (const part of m[1].split(",")) add(part.trim().split(/\s+/)[0]);

  const urlR = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  for (const m of html.matchAll(urlR)) add(m[2]);

  // catch-all de URLs soltas (inclui JSON com barras escapadas `https:\/\/`)
  const flat = html.replace(/\\\//g, "/");
  const rawR = new RegExp(`https?://[^\\s"'()\\\\<>]+?\\.(?:${ASSET_EXT})(?:\\?[^\\s"'()\\\\<>]*)?`, "gi");
  for (const m of flat.matchAll(rawR)) add(m[0]);

  return [...found];
}
```

E trocar o corpo de `extractWpAssetUrls` (linha ~73) por um delegador:

```ts
export function extractWpAssetUrls(html: string, baseUrl?: string): string[] {
  return extractAssetUrls(html, baseUrl, isWpAssetUrl);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test lib/wp-localize-core.test.ts`
Expected: PASS (novos casos + os antigos do WP sem regressão).

- [ ] **Step 5: Commit**

```bash
git add lib/wp-localize-core.ts lib/wp-localize-core.test.ts
git commit -m "feat(copiar-url): extractAssetUrls generico (qualquer host)"
```

---

## Task 3: Detecção de página vazia (`looksEmpty`)

**Files:**
- Create: `lib/fetch-any-url.ts` (só `looksEmpty` nesta task)
- Test: `lib/fetch-any-url.test.ts`

**Interfaces:**
- Produces: `looksEmpty(html: string): boolean` — true quando o HTML é casca de SPA / sem conteúdo visível.

- [ ] **Step 1: Write the failing test**

```ts
// lib/fetch-any-url.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { looksEmpty } from "./fetch-any-url.ts";

test("casca de SPA é vazia", () => {
  assert.equal(looksEmpty(`<html><body><div id="root"></div></body></html>`), true);
  assert.equal(looksEmpty(`<body><div id="__next"></div><noscript>You need to enable JavaScript</noscript></body>`), true);
});

test("página com conteúdo real NÃO é vazia", () => {
  const html = `<body><h1>Oferta</h1>` + "<p>texto de verdade sobre o produto</p>".repeat(20) + `</body>`;
  assert.equal(looksEmpty(html), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test lib/fetch-any-url.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/fetch-any-url.ts  (parte 1 — pura, testável)
// Heurística: depois de tirar script/style/tags, sobra texto visível suficiente?
// Casca de SPA (#root/#__next vazios) ou "enable JavaScript" => vazia.
export function looksEmpty(html: string): boolean {
  const emptyRoot = /<div[^>]+id=["'](root|__next|app)["'][^>]*>\s*<\/div>/i.test(html);
  const needsJs = /enable JavaScript|habilite o JavaScript/i.test(html);
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tooShort = text.length < 200;
  // Vazia se: é casca de SPA, OU pede JS explicitamente, OU quase não tem texto.
  return emptyRoot || needsJs || tooShort;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test lib/fetch-any-url.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/fetch-any-url.ts lib/fetch-any-url.test.ts
git commit -m "feat(copiar-url): looksEmpty (detecta casca de SPA)"
```

---

## Task 4: Navegador robô + `fetchAnyUrl`

**Files:**
- Create: `lib/headless-fetch.ts`
- Modify: `lib/fetch-any-url.ts` (adiciona `fetchAnyUrl`)
- Modify: `package.json` (deps)

**Interfaces:**
- Consumes: `looksEmpty` (Task 3).
- Produces: `renderHeadless(url: string): Promise<string>`; `fetchAnyUrl(url: string, opts?: { forceHeadless?: boolean }): Promise<{ html: string; finalUrl: string; usedHeadless: boolean }>`.

- [ ] **Step 1: Instalar dependências**

Run:
```bash
npm i puppeteer-core @sparticuz/chromium
```
Expected: instala sem erro; aparecem em `package.json`.

- [ ] **Step 2: Implementar `renderHeadless` (server-only)**

```ts
// lib/headless-fetch.ts
import "server-only";

// Renderiza a página num Chrome de verdade e devolve o HTML já com JS aplicado.
// Local (PC): usa o Chrome instalado. Vercel: @sparticuz/chromium.
export async function renderHeadless(url: string): Promise<string> {
  const puppeteer = (await import("puppeteer-core")).default;
  const onVercel = !!process.env.VERCEL;

  let launchOpts: Record<string, unknown>;
  if (onVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    launchOpts = {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    };
  } else {
    launchOpts = {
      executablePath:
        process.env.CHROME_PATH ||
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
      headless: true,
    };
  }

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45_000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 3: Adicionar `fetchAnyUrl` em `lib/fetch-any-url.ts`**

```ts
// lib/fetch-any-url.ts (parte 2 — orquestra; NÃO importa headless-fetch no topo
// pra manter looksEmpty testável sem "server-only")
const UA = "Mozilla/5.0 (compatible; jayacademy-portal-copy/1.0)";

export async function fetchAnyUrl(
  url: string,
  opts: { forceHeadless?: boolean } = {}
): Promise<{ html: string; finalUrl: string; usedHeadless: boolean }> {
  const runHeadless = async () => {
    const { renderHeadless } = await import("./headless-fetch.ts");
    return { html: await renderHeadless(url), finalUrl: url, usedHeadless: true };
  };

  if (opts.forceHeadless) return runHeadless();

  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) throw new Error(`O site respondeu ${res.status}`);
  const html = await res.text();
  if (looksEmpty(html)) return runHeadless();
  return { html, finalUrl: res.url || url, usedHeadless: false };
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Smoke local do headless (manual)**

Criar `scripts/_smoke-headless.mjs` temporário que chame `renderHeadless("https://example.com")` via `node --experimental-strip-types` OU testar por uma rota; confirmar que volta HTML com `<h1>Example Domain`. (Remover o script depois.)
Expected: imprime HTML não-vazio.

- [ ] **Step 6: Commit**

```bash
git add lib/headless-fetch.ts lib/fetch-any-url.ts package.json package-lock.json
git commit -m "feat(copiar-url): fetchAnyUrl hibrido (fetch simples + navegador robo)"
```

---

## Task 5: Ampliar o store (`domain: string` + origem)

**Files:**
- Modify: `lib/wp-content-storage.ts`, `lib/wp-localize.ts`, `lib/page-summary.ts`

**Interfaces:**
- Produces: `WpPageContent.domain: string`, `WpPageContent.sourceKind?: 'wp' | 'web'`, `WpPageContent.sourceUrl?: string`; `SavedSummary.sourceKind?: 'wp' | 'web'`, `SavedSummary.sourceUrl?: string`. Assinaturas de `keyFor/summaryKey/loadContent/saveContent/setPublished/unsetPublished/getPublishedBySlug` e `localizePage/relocatePage/ensurePageSummary` com `domain: string`.

- [ ] **Step 1: Ampliar tipos e assinaturas**

Em `lib/wp-content-storage.ts`:
- No tipo `WpPageContent`, trocar `domain: WpDomain` → `domain: string`; adicionar `sourceKind?: "wp" | "web";` e `sourceUrl?: string;`.
- No tipo `SavedSummary`, adicionar `sourceKind?: "wp" | "web";` e `sourceUrl?: string;`.
- Trocar `WpDomain` → `string` nas assinaturas: `PublishedIndex.domain`, `keyFor`, `summaryKey`, `loadContent`, `saveContent`, `setPublished`, `unsetPublished`, `getPublishedBySlug` e o retorno `{ domain: string; slug: string }`.
- Na função `summarize` (a que monta `SavedSummary`), copiar `sourceKind: c.sourceKind ?? "wp"` e `sourceUrl: c.sourceUrl`.

Em `lib/wp-localize.ts`: `localizePage(domain: WpDomain,…)` e `relocatePage(domain: WpDomain,…)` → `domain: string`.

Em `lib/page-summary.ts`: `ensurePageSummary(domain: WpDomain,…)` → `domain: string`.

- [ ] **Step 2: Usar extrator certo por origem em `localizePage`**

Em `lib/wp-localize.ts`, onde monta `urls` (linha ~301), trocar por:

```ts
const isWeb = content.sourceKind === "web";
const urls = isWeb
  ? extractAssetUrls(`${normFull}\n${normContent}`, content.link || content.sourceUrl)
  : extractWpAssetUrls(`${normFull}\n${normContent}`, content.link);
```

E, no caminho web, pular o de-lazy/anchor do WP: quando `isWeb`, usar `normFull = content.fullHtml ?? ""` (sem `delazyHtml`/`stripResponsiveImg`) e `apply = (h) => rewriteUrls(h, map)` (sem `rewriteWpAnchors`). Importar `extractAssetUrls` no topo.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (se algum caller reclamar de `WpDomain`, ampliar pra `string` — esperado nos actions).

- [ ] **Step 4: Rodar a suíte**

Run: `node --experimental-strip-types --test lib/*.test.ts`
Expected: tudo verde (page-catalog, rate-limit, wp-localize-core, web-slug, fetch-any-url).

- [ ] **Step 5: Commit**

```bash
git add lib/wp-content-storage.ts lib/wp-localize.ts lib/page-summary.ts
git commit -m "feat(copiar-url): store aceita qualquer host + sourceKind/sourceUrl"
```

---

## Task 6: Rótulo por origem (fim do "não-WP virando WP")

**Files:**
- Create: `lib/page-origin.ts`
- Test: `lib/page-origin.test.ts`
- Modify: `components/wp-page-card.tsx:41`, `components/search-modal.tsx:78`, `app/lixeira/page.tsx:100`, `app/wp-pages/[domain]/[slug]/page.tsx:68`

**Interfaces:**
- Consumes: `WpPageContent`/`SavedSummary` (campos `sourceKind`, `sourceUrl`, `domain`).
- Produces: `pageOriginLabel(p: { sourceKind?: "wp"|"web"; domain: string; sourceUrl?: string }): string`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/page-origin.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { pageOriginLabel } from "./page-origin.ts";

test("WP mostra o dominio jayacademy correto", () => {
  assert.equal(pageOriginLabel({ sourceKind: "wp", domain: "main" }), "Migrada do WP · jayacademy.com.br");
  assert.equal(pageOriginLabel({ sourceKind: "lp" as never, domain: "lp" }), "Migrada do WP · lp.jayacademy.com.br");
});

test("web mostra o host da origem, nunca jayacademy", () => {
  const label = pageOriginLabel({ sourceKind: "web", domain: "site.com", sourceUrl: "https://site.com/oferta" });
  assert.equal(label, "Copiada da web · site.com");
  assert.ok(!label.includes("jayacademy"));
});

test("registro antigo sem sourceKind cai como WP (default)", () => {
  assert.equal(pageOriginLabel({ domain: "main" }), "Migrada do WP · jayacademy.com.br");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --test lib/page-origin.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/page-origin.ts
// Fonte ÚNICA do rótulo de origem. Decide pela sourceKind — NUNCA pelo ternário
// domain==="main" hardcoded (que fazia cópia da web aparecer como WP).
export function pageOriginLabel(p: {
  sourceKind?: "wp" | "web";
  domain: string;
  sourceUrl?: string;
}): string {
  if (p.sourceKind === "web") {
    let host = p.domain;
    try {
      if (p.sourceUrl) host = new URL(p.sourceUrl).host.replace(/^www\./, "");
    } catch {}
    return `Copiada da web · ${host}`;
  }
  const wpHost = p.domain === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br";
  return `Migrada do WP · ${wpHost}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --test lib/page-origin.test.ts`
Expected: PASS.

- [ ] **Step 5: Trocar os 4 pontos hardcoded**

Em cada arquivo, substituir o ternário `domain === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br"` (e o texto "Migrada do WordPress"/"WP ·") por `pageOriginLabel(...)`:
- `components/wp-page-card.tsx:41` → `{pageOriginLabel(page)}`
- `components/search-modal.tsx:78` → `subtitle: pageOriginLabel(wp)`
- `app/lixeira/page.tsx:100` → `sub={pageOriginLabel(wp)}`
- `app/wp-pages/[domain]/[slug]/page.tsx:68` → usar `pageOriginLabel(content)` no lugar da const.
Importar `pageOriginLabel` em cada um. **Verificação:** `grep -rn "lp.jayacademy.com.br" components app` não deve sobrar nenhum ternário de exibição.

- [ ] **Step 6: Typecheck + commit**

Run: `npx tsc --noEmit` (sem erros).
```bash
git add lib/page-origin.ts lib/page-origin.test.ts components/wp-page-card.tsx components/search-modal.tsx app/lixeira/page.tsx "app/wp-pages/[domain]/[slug]/page.tsx"
git commit -m "fix(copiar-url): exibicao por origem (fim do nao-WP virando WP)"
```

---

## Task 7: Catálogo — origem `web-mirror`

**Files:**
- Modify: `lib/page-catalog-core.ts`, `lib/page-catalog.ts`

**Interfaces:**
- Produces: `PageSource` inclui `"web-mirror"`; `sourceLabel("web-mirror") === "Copiada da web"`; cor própria em `sourceColors`.

- [ ] **Step 1: Adicionar a fonte**

Em `lib/page-catalog-core.ts`: adicionar `"web-mirror"` ao union `PageSource`; em `sourceLabel` mapear `"web-mirror" → "Copiada da web"`; em `sourceColors` dar uma cor (ex: verde) distinta de `wp-mirror`; incluir em `sourceOrder`.
Em `lib/page-catalog.ts`: onde monta entradas das páginas salvas, usar `source: s.sourceKind === "web" ? "web-mirror" : "wp-mirror"`.

- [ ] **Step 2: Atualizar/!rodar o teste do catálogo**

Run: `node --experimental-strip-types --test lib/page-catalog.test.ts`
Expected: PASS (ajustar o teste se ele enumerar as fontes esperadas — incluir `web-mirror`).

- [ ] **Step 3: Commit**

```bash
git add lib/page-catalog-core.ts lib/page-catalog.ts lib/page-catalog.test.ts
git commit -m "feat(copiar-url): fonte 'web-mirror' (Copiada da web) no catalogo"
```

---

## Task 8: Ação de importação com branch web

**Files:**
- Modify: `app/wp-pages/import-actions.ts`

**Interfaces:**
- Consumes: `fetchAnyUrl` (Task 4), `deriveWebSlug` (Task 1), store ampliado (Task 5).

- [ ] **Step 1: Detectar origem e ramificar**

Em `importByLinksAction`, dentro do loop, ANTES do bloco WP atual: calcular `host = u.hostname.replace(/^www\./,"")` e `isWpJay = host === "jayacademy.com.br" || host === "lp.jayacademy.com.br"`. Se `isWpJay` → caminho atual (intacto). Senão → novo bloco web:

```ts
// caminho web (qualquer site)
const forceHeadless = formData.get("forceHeadless") === "1";
const { html, finalUrl } = await fetchAnyUrl(url, { forceHeadless });
const slug = deriveWebSlug(finalUrl);
const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || slug).trim();
const existing = await loadContent(host, slug);
const content: WpPageContent = {
  id: 0,
  slug,
  domain: host,
  title,
  content: "",
  fullHtml: html,
  excerpt: "",
  link: finalUrl,
  modified: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  sourceKind: "web",
  sourceUrl: finalUrl,
  ...(existing
    ? { placed: existing.placed, placedAt: existing.placedAt, published: existing.published,
        publishedAt: existing.publishedAt, publicSlug: existing.publicSlug }
    : {}),
};
await saveContent(content);
after(async () => { try { await localizePage(host, slug); } catch {} });
// publicar opcional: mesmo bloco `autoPublish` do caminho WP, usando host/slug
results.push({ url, ok: true, message: existing ? `Atualizada: ${title}` : `Copiada: ${title} — otimizando em 2º plano` });
continue;
```

Importar `fetchAnyUrl`, `deriveWebSlug`. Erros do `fetchAnyUrl` já caem no `catch` do loop (mensagem "O site respondeu X" / "Site pesado — copie pelo PC" se headless indisponível).

- [ ] **Step 2: Config de tempo/memória da rota**

No topo de `app/wp-pages/page.tsx` (rota que hospeda a action), adicionar `export const maxDuration = 60;`. (Memória: se a Vercel exigir, configurar no `vercel.json`/Project Settings — ver Task 10.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/wp-pages/import-actions.ts app/wp-pages/page.tsx
git commit -m "feat(copiar-url): importByLinksAction aceita qualquer URL (branch web)"
```

---

## Task 9: UI — botão, formulário e etiqueta

**Files:**
- Create: `components/import-by-link.tsx`
- Modify: `components/sidebar-shell.tsx:34`, `app/wp-pages/page.tsx`

**Interfaces:**
- Consumes: `importByLinksAction` (Task 8), `pageOriginLabel` (Task 6).

- [ ] **Step 1: Recriar `import-by-link.tsx`**

Client Component com `useActionState(importByLinksAction, { results: [] })`: `<textarea name="links">` (1 URL por linha), checkbox `name="forceHeadless" value="1"` ("Forçar navegador robô (site pesado)"), checkbox `name="publish" value="1"` ("Publicar automaticamente"), `<button>` (usar `pending-button`/`useFormStatus` já existentes) e a lista de `results` (ok/erro por URL). Seguir o estilo dark do painel (classes já usadas em outros forms).

- [ ] **Step 2: Rótulo da sidebar**

`components/sidebar-shell.tsx:34`: `label: "Páginas WP"` → `label: "Páginas copiadas"` (mantém `href: "/wp-pages"` e o ícone).

- [ ] **Step 3: Tela "Páginas copiadas"**

`app/wp-pages/page.tsx`: heading/título → "Páginas copiadas"; montar `<ImportByLink />` no topo; garantir que a lista (`wp-manage-list`/cards) mostre a etiqueta via `pageOriginLabel`. (A lista já sai de `listSaved()`, então cópias web aparecem automaticamente com o store da Task 5.)

- [ ] **Step 4: Verificação manual (local)**

Run: `npm run dev` (porta 4000) → abrir `http://localhost:4000/wp-pages` logado como admin.
Expected: sidebar diz "Páginas copiadas"; formulário aparece; nenhuma cópia web rotulada como WP.

- [ ] **Step 5: Commit**

```bash
git add components/import-by-link.tsx components/sidebar-shell.tsx app/wp-pages/page.tsx
git commit -m "feat(copiar-url): UI 'Copiar de uma URL' + sidebar 'Paginas copiadas'"
```

---

## Task 10: QA local + checkpoint do headless na Vercel

**Files:** nenhum (validação).

- [ ] **Step 1: QA local — 3 tipos de site**

Com `npm run dev`, copiar via a UI: (a) 1 site estático simples, (b) 1 WordPress externo qualquer, (c) 1 SPA React. Para cada: conferir que salvou, a etiqueta de origem certa, abre no editor, publica num slug e a página renderiza em `/p/<slug>` com assets localizados.
Expected: os 3 funcionam; o SPA usa o navegador robô (`usedHeadless`).

- [ ] **Step 2: Rodar toda a suíte + typecheck**

Run: `node --experimental-strip-types --test lib/*.test.ts && npx tsc --noEmit`
Expected: tudo verde, zero erro de tipo.

- [ ] **Step 3: `rebuildindex` (após publicar cópias)**

Abrir logado: `http://localhost:4000/api/wp-localize?rebuildindex=1`.
Expected: JSON confirmando os resumos reindexados (com `sourceKind`).

- [ ] **Step 4: Checkpoint do navegador robô na Vercel (quando o James autorizar o 1º push)**

Após push, testar copiar 1 SPA em produção. Se o headless estourar tempo/memória: garantir o fallback — `@sparticuz/chromium` incluído no bundle (`next.config.ts` → `outputFileTracingIncludes` pra rota da action) e memória da função elevada. **Se não rodar bem no plano grátis:** decisão consciente registrada na spec §10.1 — headless só no PC; na Vercel fica a cópia simples com aviso "site pesado → copie pelo PC". O resto da feature não muda.

- [ ] **Step 5: Atualizar `notas/progresso-atual.md`**

Registrar a feature "Copiar de uma URL" (o que ficou, e o resultado do checkpoint do headless na Vercel).

```bash
git add notas/progresso-atual.md
git commit -m "docs: registra feature Copiar de uma URL no progresso"
```

---

## Self-Review (cobertura da spec)

- §3/§4.1–4.3 motor híbrido + extrator → Tasks 2,3,4,8. ✓
- §4.4 store ampliado → Task 5. ✓
- §4.4b exibição por origem (bug crítico) → Task 6. ✓
- §4.5 catálogo `web-mirror` → Task 7. ✓
- §4.6 UI/sidebar → Task 9. ✓
- §5 erros (site fora do ar, headless indisponível, colisão de slug) → Tasks 1,4,8. ✓
- §7 rota não renomeada → respeitado (só rótulo, Task 9). ✓
- §8 testes → Tasks 1,2,3,6 + suíte na 10. ✓
- §10 ordem (validação/headless) → Task 4 (local) + Task 10 step 4 (Vercel). ✓
- Não-objetivos (login, crawl, JS 100%) → fora do plano. ✓
