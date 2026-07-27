# Endurecimento "Copiar de uma URL" — achados de 3 auditorias adversariais (24/07)

> Após QA real (James copiou a Wikipedia → veio sem estilo), 3 auditorias adversariais no código.
> Branch `feat/copiar-qualquer-url`. **Nada pushado.** Corrigir em ordem de risco, verificando com SITES REAIS (não HTML de laboratório).

## 🔒 BLOCO 1 — Segurança (fechar antes de qualquer deploy)
- **S1 [High] Stored XSS same-origin.** Scripts do site copiado rodam no domínio do painel; podem chamar `/api/*` admin e burlar o header anti-CSRF `x-portal-op`. **Fix:** ao servir página `sourceKind:web`, remover `<script>`, atributos `on*=`, e `javascript:` hrefs — ANTES de injetar tracking/interceptor. (`app/p/[slug]/route.ts`)
- **S2 [High] SSRF.** Sem denylist de IP; colar `http://169.254.169.254`/`localhost`/IP privado → servidor busca (fetch + headless) e pode autopublicar. **Fix:** bloquear loopback/link-local/RFC1918/metadata no ramo web ANTES de fetch e renderHeadless. (`app/wp-pages/import-actions.ts` / novo helper)
- **S3 [Critical] Não-HTML/gigante derruba o batch.** `res.text()` sem checar Content-Type/Length; PDF 200MB → OOM (SIGKILL não cai no try/catch) → perde todos os resultados. **Fix:** checar Content-Type (só html) + Content-Length (teto) antes de `res.text()`. (`lib/fetch-any-url.ts`)

## 🎨 BLOCO 2 — Fidelidade (fazer a cópia ficar igual)
- **F1 [Critical] Reescrita não bate em URL relativa.** `rewriteUrls` faz replace de string literal ABSOLUTA contra HTML que tem a relativa → mesmo baixando o asset, não troca. **Fix raiz:** ABSOLUTIZAR no import — reescrever todo src/srcset/href(link/script)/url() do HTML pra absoluto contra a origem (`finalUrl`). Isso conserta F1+F2+links internos+fallback de uma vez. (`lib/wp-localize-core.ts` novo `absolutizeUrls`, chamado no import web)
- **F2 [Critical] `<base>` removida sem substituto** → relativos apontam pro portal (404). Resolvido pelo absolutize (F1); sem relativo sobrando, o strip de base fica inofensivo.
- **F3 [Critical] Detecção por extensão perde CSS "disfarçado"** (Google Fonts, load.php). **Fix:** detectar por TAG (`<link rel=stylesheet/preload/icon/manifest>`, `<script src>`) além da extensão. (`wp-localize-core.ts`)
- **F4 [Critical] Recursão de CSS travada no host WP** → fontes/bg dentro de CSS externo nunca baixam. **Fix:** passar `isWeb`/accept host-agnóstico pro `fetchAndStore` na parte de CSS. (`lib/wp-localize.ts:178`)
- **F5 [High] Web pula delazy** → imagens lazy ficam em branco. **Fix:** aplicar delazy (promover data-src→src) no caminho web também.
- **F6 [High] `&amp;` não decodificado** → busca o asset errado. **Fix:** decodificar entidades HTML no href/src antes de resolver.
- **F7 [Medium] Charset não detectado** → acento vira mojibake em site não-UTF8. **Fix:** ler `<meta charset>`/header e decodificar com TextDecoder certo. (`lib/fetch-any-url.ts`)
- **F8 [High] `@import` não seguido** no CSS. **Fix:** seguir `@import url()`/`@import "x"`.

## ⚠️ BLOCO 3 — Casos-limite / correção
- **C1 [Medium] Caminho não-latino → todos slug "home" → sobrescreve.** **Fix:** quando o slug sair vazio, usar hash curto do path em vez de "home". (`lib/web-slug.ts`)
- **C2 [Medium] Redirect grava `domain` errado** (host do link curto, não do destino). **Fix:** derivar `host` do `finalUrl`. (`import-actions.ts`)
- **C3 [Medium] Slug = rota do painel → "publicado" falso.** **Fix:** lista de slugs reservados; avisar em vez de publicar invisível.
- **C5 [Low] Headless com caminho de Chrome só Windows** (dev não-Windows quebra). **Fix:** fallback multiplataforma / mensagem clara.
- **D1 [pré-existente] `smart-summary.tsx:31`** `dispatch` fora de `startTransition` (aviso React 19). Não é da feature. **Fix:** envolver em `startTransition`.

## Verificação (desta vez com sites REAIS)
Após cada bloco: copiar no localhost e conferir de verdade — Wikipedia (extension-less CSS + relativos), uma LP comum, um site não-UTF8, um SPA. Screenshot do resultado servido.
