# Copiar de uma URL — copiar qualquer página (não só WordPress)

> Spec de design · 2026-07-23 · Jay Academy Portal
> Origem: brainstorming com o James. Objetivo desta spec = base pro plano de implementação.

## 1. Objetivo

Trazer de volta a função **"Copiar de uma URL"** (removida em 17/07 junto da UI de importação do WP), agora aceitando **qualquer endereço**, não só o WordPress da Jay. A página copiada entra no **catálogo editável**, é ajustada nos editores que já existem e publicada num slug próprio — o mesmo destino e as mesmas ferramentas do fluxo do WP.

Reaproveita o motor que já existe (`importByLinksAction` + pipeline de localização de assets). O que muda é: (a) buscar o HTML de qualquer URL (com navegador robô quando preciso) e (b) organizar a IA pra cópias de qualquer origem conviverem sem virar bagunça.

## 2. Decisões (fechadas no brainstorming)

| Tema | Decisão |
|---|---|
| O que fazer com a cópia | Adaptar e publicar como minha (entra no catálogo editável) |
| Cobertura | Total — inclui sites pesados de JS via **navegador robô** |
| Onde roda | Localhost (PC) **e** produção (Vercel) |
| Motor | **Híbrido**: cópia simples primeiro; navegador robô só quando a simples vem vazia |
| Grátis-first | Sem serviço externo pago. Chrome local no PC; `@sparticuz/chromium` na Vercel |
| Organização (IA) | Opção A: "Páginas WP" vira "**Páginas copiadas**", unificando WP + web com etiqueta de origem |

## 3. Arquitetura (visão geral)

```
[Formulário "Copiar de uma URL"]  (recria import-by-link.tsx)
            │  cola URL(s) + opções (forçar robô / publicar)
            ▼
[importByLinksAction generalizada]  (app/wp-pages/import-actions.ts)
            │  decide a origem pela URL
            ├── host = jayacademy WP  → caminho ATUAL (REST API + fetchPageContent)
            └── qualquer outro host   → fetchAnyUrl()  ← NOVO
                                            │ 1) fetch simples
                                            │ 2) detecta "casca vazia de JS"
                                            │ 3) fallback: renderHeadless()  ← NOVO
            ▼
[saveContent]  (wp-content-storage — domain generalizado p/ host + sourceKind)
            │
            └── after(): localizePage()  (baixa assets + reescreve p/ cópias locais)
                             usa extractAssetUrls genérico  ← NOVO
            ▼
[Catálogo / Editor / Publicação]  (reuso total — /p/[slug], editor inline, publish-button)
```

## 4. Componentes e mudanças por arquivo

### 4.1 Motor de busca (novo)
- **`lib/fetch-any-url.ts`** (novo) — `fetchAnyUrl(url): Promise<{ html, finalUrl, usedHeadless }>`.
  1. `fetch()` simples com User-Agent de browser.
  2. Heurística `looksEmpty(html)`: corpo com pouquíssimo texto visível, ou marcadores de SPA sem conteúdo (`<div id="root"></div>`, `<div id="__next">` vazio, `<app-root>`), ou `<noscript>` pedindo JS. Se o usuário marcou **"forçar robô"**, pula direto pro headless.
  3. Se vazio → `renderHeadless(url)`.
- **`lib/headless-fetch.ts`** (novo) — `renderHeadless(url): Promise<string>`.
  - Usa `puppeteer-core`. **Local**: aponta pro Chrome instalado (`C:/Program Files/Google/Chrome/Application/chrome.exe`, com fallback por env `CHROME_PATH`). **Vercel**: `@sparticuz/chromium` (executablePath + args). Detecção por env (`process.env.VERCEL`).
  - Abre a página, espera `networkidle`/timeout curto, retorna `document.documentElement.outerHTML` já renderizado. Teto de tempo defensivo.

### 4.2 Ação de importação (generalizar a que existe)
- **`app/wp-pages/import-actions.ts`** — `importByLinksAction`:
  - Detecta origem: se `host` é `jayacademy.com.br`/`lp.jayacademy.com.br` → caminho WP atual (intacto). Senão → caminho web.
  - Caminho web: `fetchAnyUrl(url)` → monta um `WpPageContent` com `domain = host` (normalizado, sem `www.`), `fullHtml` = HTML renderizado, `sourceKind: 'web'`, `sourceUrl`. `saveContent` + `after(localizePage)` + publicar opcional. **Mesma estrutura do WP**, só a fonte do HTML muda.
  - **Slug robusto** (`deriveWebSlug`): slugifica o **caminho inteiro** (`/planos/anual/oferta` → `planos-anual-oferta`), não só o último pedaço — senão `site.com/a/oferta` e `site.com/b/oferta` colidiriam no mesmo host. **Homepage sem caminho** (`site.com/`) → fallback `home`. Se já existir `domain+slug`, re-importação = atualizar (preserva publicação), igual ao WP.
  - Config de rota: `export const maxDuration = 60` e memória elevada no segmento que roda a ação (headless na Vercel).

### 4.3 Localização de assets (generalizar o extrator)
- **`lib/wp-localize-core.ts`** — novo `extractAssetUrls(html, baseUrl)` genérico: varre `src`, `srcset`, `href` de `<link rel=stylesheet/preload>`, `url()` em `<style>` e atributos `style`, `<script src>`, `<source>`/`poster`. Resolve relativo→absoluto pela `baseUrl`. O `extractWpAssetUrls` atual vira um caso particular (ou chama o genérico + extras do WP).
- **`lib/wp-localize.ts`** — `localizePage` usa o extrator genérico quando `sourceKind==='web'` (sem de-lazy do Elementor nem `deRocketUrl`, que são específicos do WP). Download/dedup/reescrita permanecem iguais (já são genéricos).

### 4.4 Modelo de dados
- **`lib/wp-content-storage.ts`** — `WpPageContent.domain`: de `WpDomain` para **`string`** (host). Campos novos: `sourceKind?: 'wp' | 'web'` (default `'wp'` pros registros antigos), `sourceUrl?: string`. Chaves KV seguem `wp:content:<domain>:<slug>` / `wp:summary:<domain>:<slug>` (o `<domain>` agora pode ser um host). `SavedSummary` ganha `sourceKind` + `sourceUrl` (a lista/etiqueta lê deles) → rodar `?rebuildindex=1` após deploy.
- **⚠️ A generalização NÃO é "contida" (correção da 1ª versão desta spec).** `WpDomain` aparece em ~15 assinaturas e ~20 casts. Ampliar de fato exige tocar, no mínimo:
  - **Store** (`wp-content-storage.ts`): `keyFor`, `summaryKey`, `loadContent`, `saveContent`, `setPublished/unsetPublished`, `PublishedIndex`, `getPublishedBySlug` — assinaturas `WpDomain` → `string`.
  - **Localização** (`wp-localize.ts`): `localizePage`, `relocatePage` — `domain: WpDomain` → `string` (uso interno é só `loadContent`/`buildSlugToPublic`, seguro ampliar).
  - **Resumo** (`page-summary.ts`): idem.
  - Os casts `formData.get("domain") as WpDomain` em `manage-actions`/`publish-actions`/`actions`/`behavior-actions`/`edit/actions` continuam funcionando (é string em runtime); passam a `as string` sem drama.
  - As funções **genuinamente WP** (`fetchPageContent`, `wp-api`, caminho WP do `import-actions`) mantêm `WpDomain` — só recebem `"main"`/`"lp"`.

### 4.4b Exibição por origem (corrige o bug "não-WP virando WP")
**Problema achado na revisão:** 4 lugares hardcodam `domain === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br"` + rótulo "Migrada do WordPress"/"WP ·". Uma cópia da web (`domain="site.com"`) cairia no `else` e apareceria como **"Migrada do WordPress · lp.jayacademy.com.br"** — exatamente a bagunça a evitar. **Correção obrigatória:** criar helper `pageOriginLabel(content)` que decide pelo `sourceKind`:
  - `wp` → "Migrada do WP · {domain==='main'?jayacademy:lp.jayacademy}"
  - `web` → "Copiada da web · {host de sourceUrl}"
- Trocar o ternário hardcoded nos **4 arquivos**: `components/wp-page-card.tsx:41`, `components/search-modal.tsx:78`, `app/lixeira/page.tsx:100`, `app/wp-pages/[domain]/[slug]/page.tsx:68`. (Varrer por `lp.jayacademy.com.br` pra garantir que não sobrou nenhum.)

### 4.5 Catálogo + etiquetas
- **`lib/page-catalog-core.ts`** — nova `PageSource` **`web-mirror`** com label **"Copiada da web"** e cor própria (distinta de `wp-mirror` = "Página migrada"). `page-catalog.ts` mapeia `sourceKind==='web'` → `web-mirror`.

### 4.6 IA / navegação (Opção A)
- **`components/sidebar-shell.tsx`** (linha 34) — rótulo `"Páginas WP"` → **`"Páginas copiadas"`** (ícone mantido; **rota `/wp-pages` mantida** — ver §7).
- **`app/wp-pages/page.tsx`** — título/heading da tela → "Páginas copiadas"; passa a listar WP **e** web (já sai de `listSaved()`); cada linha mostra a etiqueta de origem (`sourceKind`). Botão **"＋ Copiar de uma URL"** no topo.
- **Recriar `components/import-by-link.tsx`** — formulário (campo URL, "forçar navegador robô", "publicar automaticamente", botão Copiar) + lista de resultados. Montado no topo da tela de Páginas copiadas.

### 4.7 Dependências / infra
- `package.json`: `puppeteer-core` + `@sparticuz/chromium`.
- Config de tempo/memória na rota da ação (Vercel). Sem novas envs obrigatórias (`CHROME_PATH` opcional no PC).

## 5. Fluxo de erros / casos-limite
- **URL inválida / sem host** → resultado "Endereço inválido", não trava os outros links da lista.
- **Site fora do ar / 4xx-5xx** → "O site respondeu X" (mostra o código).
- **Cópia simples vazia E headless indisponível** (ex: timeout na Vercel em site gigante) → mensagem clara: "Site muito pesado — copie pelo seu PC (localhost)". Nada é salvo pela metade.
- **Localização parcial** (alguns assets 404) → página salva mesmo assim; assets que faltaram mantêm a URL original; cron `/api/cron/localize` reprocessa (comportamento atual).
- **Slug colidindo** com página existente → re-importação = atualizar (preserva publicação/slug público), igual ao WP hoje.

## 6. Não-objetivos (v1)
- Páginas atrás de login/senha/paywall (exigiria cookies/credenciais).
- Copiar um site inteiro / crawl de várias páginas — **1 página por URL**.
- Garantir que todo JavaScript interativo copiado funcione 100% — é "o mais fiel possível"; o James ajusta no editor.
- Renomear a **rota** `/wp-pages` (só o rótulo) — ver §7.

## 7. Decisão consciente: rótulo sim, rota não
Renomear a rota `/wp-pages` → `/paginas-copiadas` tocaria ~12 arquivos (editor-shell, image-replace-modal, image-input, schedule/seo/public-slug editors, search-modal, publish-button, wp-manage-list, wp-page-actions, actions internas) — risco alto de bug pra ganho cosmético (a URL só aparece no admin). **Decisão:** renomear apenas o **rótulo** e o **título** da tela agora. A rota interna segue `/wp-pages`. Rename completo da rota (com redirect 308) fica como polimento futuro opcional.

## 8. Testes
- **`lib/fetch-any-url.test.ts`** — `looksEmpty()` (casca de SPA vs página cheia); decisão simples-vs-headless com "forçar robô"; `deriveWebSlug()` (caminho inteiro slugificado, homepage→`home`, sem colisão a/oferta vs b/oferta).
- **`lib/wp-localize-core.test.ts`** (existente) — casos do `extractAssetUrls` genérico (src/srcset/url()/link/script), resolução relativo→absoluto, sem regressão nos casos WP atuais.
- Smoke manual: copiar 1 site estático (ex: página simples), 1 WordPress externo, 1 SPA React — conferir HTML salvo, assets localizados, etiqueta de origem certa, edição e publicação.

## 9. Impacto / reaproveitamento
- **Reusa:** serving (`/p/[slug]`), editor inline, image-replace, publish-button, catálogo, biblioteca de mídia, cron de localização, dedup de assets em KV.
- **Novo:** `fetch-any-url.ts`, `headless-fetch.ts`, extrator genérico, `import-by-link.tsx` (recriado), 2 deps.
- **Ampliado:** tipo `domain` (→ host) + `sourceKind`/`sourceUrl` no store e no summary; exibição por origem em 4 componentes; `web-mirror` no catálogo; rótulo da sidebar.
- **Resquício conhecido:** `app/wordpress/actions.ts` mantém acoplamento WP legado — não atrapalha esta feature; deixar como está.

## 10. Ordem de implementação (validação arriscada primeiro)

> Ideia: provar o pedaço incerto ANTES de construir o resto em cima dele.

1. **Spike do navegador robô na Vercel** — pôr `puppeteer-core` + `@sparticuz/chromium` numa rota mínima de teste, renderizar 1 SPA, deployar e confirmar que roda no plano atual (runtime Node, `outputFileTracingIncludes` do binário, memória, teto 60s). **Se não rodar bem no grátis:** decisão consciente — headless só no PC (localhost), e na Vercel fica a cópia simples com aviso "site pesado → copie pelo PC". O resto da feature não muda.
2. **Motor**: `fetch-any-url.ts` + `headless-fetch.ts` (local primeiro) + testes de `looksEmpty`/`deriveWebSlug`.
3. **Store + exibição**: ampliar `domain`→string, `sourceKind`/`sourceUrl`, helper `pageOriginLabel`, trocar os 4 ternários. `?rebuildindex=1`.
4. **Extrator genérico** em `wp-localize-core` + ligar no `localizePage` p/ `sourceKind==='web'`.
5. **Ação**: generalizar `importByLinksAction` (branch web).
6. **UI**: recriar `import-by-link.tsx`, rótulo sidebar "Páginas copiadas", heading + etiqueta de origem na tela.
7. **Catálogo**: `web-mirror` + label "Copiada da web".
8. **QA local** (site estático, WP externo, SPA) → só então push e teste em produção.
