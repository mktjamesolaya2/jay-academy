# CLAUDE.md

> **Mapa vivo do projeto.** Carregado toda sessão pra evitar reexploração (economia de
> tokens). Manter conciso, PT-BR, "1 linha por item". Detalhes de sessão vão em
> `notas/progresso-atual.md`, não aqui.

## O que é este projeto
Jay Academy Portal (`jayacademy-portal`) — CMS/admin interno da Jay Academy (marca de
treinamento em micropigmentação/PMU) para centralizar landing pages, sites, formulários/leads
e conteúdo migrado do WordPress legado. Não é a plataforma de entrega de cursos (isso é o
"PMU CLASS", sub-projeto SPA servido como subpath `/pmuclass`).

Dia a dia observado no histórico: majoritariamente iteração visual/copy em landing pages de
venda (NanoFios, Shadow PRO, Fio a Fio, Lips Sense), não feature do admin/CMS.

## Stack
- Next.js 16 (App Router + Turbopack), React 19, TypeScript, Tailwind v4
- Sem `src/`: tudo na raiz (`app/`, `components/`, `lib/`)
- Auth própria: `jose` (JWT, cookie `jay_session`) + `bcryptjs` — `middleware.ts` + `lib/auth.ts`
- Storage: `lib/storage.ts` abstrai KV (Vercel KV; fallback arquivo local em `data/`) e upload
  de arquivos (S3-compatível/R2 > Vercel Blob > `public/uploads` local)
- Dev roda na **porta 4000** (`npm run dev`, não 3000)
- Deploy: Vercel, repo `mktjamesolaya2/jay-academy`, branch `main`, auto-deploy no push
  (⚠️ ver "Pegadinhas" — push tem que ser como o dono)

## Estrutura geral
- `app/` — App Router **flat** (sem route groups); gating de admin via prefixos no
  `middleware.ts` (`/dashboard`, `/paginas`, `/wp-pages`, `/lps`, `/forms`, `/settings`, etc.)
- `lib/` — toda a lógica de negócio/dados (stores no KV, serving de LP, WordPress, tracking)
- `lp-html/*.html` — LPs de venda como HTML puro; editar o HTML + push = deploy
- `notas/` — base de conhecimento viva. **Ler `notas/README.md` e `notas/progresso-atual.md`
  primeiro**; **atualizar `notas/progresso-atual.md` ao fim de cada sessão** (regra do projeto)
- `public/recriadas/<slug>/` — LP estática servida direto (hoje só `inmersion-pelo-a-pelo`)

## Mapa de rotas

### Painel admin (`app/<rota>/page.tsx`, quase todas `force-dynamic`)
- `dashboard` — home: catálogo unificado, stats, recentes, leads.
- `paginas` — lista/filtra o catálogo de TODAS as páginas (chips por fonte).
- `wp-pages` — gestão das páginas migradas do WP (+`[domain]/[slug]/{edit,preview}`).
- `leads` — inbox de submissões (+`leads/export` CSV). `forms` — CRUD de forms (+`new`, `[id]`).
- `lps/[slug]` — ficha da página (+`{build,edit-visual,celular}`). `websites` existe mas saiu do menu.
- `analytics` — visitas por página. `midia` — biblioteca de mídia. `sugestoes` — sugestões+upvote.
- `settings` (+`users` roles, +`backup` do KV). `lixeira` — trash restaurável.
  **Código do CRM por página**: o CRM entrega um BLOCO DE CÓDIGO (formulário + script, ou só o
  script), não uma URL. Fica em `lp-form-config:<slug>.codigoCrm`, editado no bloco "Integração
  do CRM" em `/lps/<slug>`, e injetado antes de `</body>` por `lib/serve-lp.ts` — por último, pra
  achar o formulário já montado. Os formulários do portal seguem com o campo de webhook em
  `/forms/[id]`.
  ⚠️ **UMA lista de páginas** (`/paginas`). O "tipo" (website/lp/form) não muda nada no código —
  não voltar a ter uma lista por tipo. Editor: `EditorShell` serve LPs do KV, páginas do WP e as de
  `lp-html/` (via `resolveLpHtml`, override no KV passa na frente do arquivo). **Export do Elementor
  NÃO entra no editor visual** (`ehExportElementor`) — 60-80 scripts montam o formulário depois do
  load e salvar corromperia. Override é silencioso: a tela mostra "Versão no ar" + "Voltar pro
  original".
  ⚠️ **`/lps/[slug]` cai no `lp-html-registry` quando o KV não tem a LP.** Sem isso, 8 páginas
  (incl. as 4 que mais trazem lead) davam 404 e não tinham onde configurar nada.
  ⚠️ **Não construir sistema de integração dentro do portal.** Já foi feito e desfeito em 11/08 —
  o CRM é dono dos webhooks; o portal só hospeda o código que ele gera.
- `wordpress` — importação DESATIVADA (migração concluída); redireciona pra `/wp-pages`.
- `login`; `f/[slug]` — render público de form standalone.

### Serving público
- `app/[slug]/route.ts` — serve página publicada no slug raiz; reusa `app/p/[slug]/route.ts`
  (pipeline canônico das páginas publicadas do KV). Estáticas têm prioridade.
- LPs `lp-html/*.html` via route handlers dedicados (`app/<slug>/route.ts` + `lib/serve-lp.ts`,
  com de-lazy + tracking). Registry: `lib/lp-html-registry.ts` (`lpHtmlPages`/`lpHtmlRedirects`).
  Slugs: basic-magic-shadow, basic-nanofios, curso-online-profissao-remove,
  fio-a-fio-realista-by-james-olaya, inmersion-pelo-a-pelo, metodo-shadow-pro,
  pdv-lips-sense-technique, pmuclass.
- `pmuclass` = SPA (skeleton estático + conteúdo runtime via `/api/lp-content/pmuclass`).
- `next.config.ts`: só `headers()` de segurança (nosniff/Referrer-Policy/HSTS; X-Frame só no
  admin) + `serverActions.bodySizeLimit`. SEM rewrites de `public/`.
- `sitemap.ts`, `robots.ts`, `not-found.tsx` (404 branded).

## api/ (rotas)
- `track` — registra visita (origem de utm/referrer). `meta-capi` — Meta CAPI server-side
  (blindado: allowlist de evento + same-origin + rate-limit). `elementor-form` — substituto
  local do admin-ajax.php dos forms Elementor das LPs. `wp-form-submit` — submissões genéricas.
- `chat-pmu` — chat IA (OpenRouter) do PMU CLASS. `lp-content/[slug]` — conteúdo JSON de LP SPA.
- **`api/wp-localize/route.ts` é um MULTI-TOOL** de admin (`canEdit`) via `?param=1`. Ops
  destrutivas exigem `confirm=1` + header `x-portal-op: confirm` (anti-CSRF). One-shots:
  - `wpcheck` — audita se páginas PUBLICADAS ainda carregam asset do servidor WP (ok:true = pode desligar).
  - `rebuildindex` — regrava todos os `wp:summary:*` (rodar após deploy que mexa em páginas).
  - `fixwpflags` (`&confirm=1`) — reescreve bandeiras gtranslate no KV pra `/wp-plugins/...`.
  - `fixlipsvideos` (`&one=<url>`/`&rewrite=1`/`&remove=1`) — migra/remove vídeos WP (mapa `wpvideo:migrated`).
  - `reslug` (`&from&to&force`) — troca slug público. `unpub` (`&slug&domain`) — despublica.
  - `publishsitemap` — publica todos os slugs do sitemap WP nos slugs originais (idempotente).
  - `supalist`/`supascan`/`supafix`/`supaclean` — auditoria/limpeza dos assets no Supabase.
  - `relocate`/`organize`/`mediastats`/`testupload`/`deletebroken` — mídia/storage.
  - legados: `freshfiofio`/`fixfiofio`/`relocateproducts`/`publishproducts`/`pricecontext`/`hotmartscan`.

## Crons (`vercel.json`)
- `/api/cron/publish` — 09:00 UTC: publica/despublica páginas com `scheduledPublishAt`/unpublish vencido.
- `/api/cron/localize` — 09:20 UTC (`maxDuration=60`, lote de 2): baixa assets de páginas sem `localizedAt`.
- Ambos exigem `Authorization: Bearer $CRON_SECRET` se a env estiver setada.

## lib/ (mapa — símbolos centrais em negrito)
- **Storage/KV**: `storage.ts` (**`kvGet/kvSet/kvDel/kvKeys/kvIncr/kvMget`**, `blobUpload`);
  `wp-content-storage.ts` (tipos **`WpPageContent`/`SavedSummary`**; **`listSaved/listPublished/
  listTrashed`**, `saveContent/loadContent/deleteContent`, `setPublished/unsetPublished/
  getPublishedBySlug`, **`rebuildSummaryIndex`**, `trashContent/restoreContent/markPlaced`).
- **Catálogo**: `page-catalog-core.ts` (**`CatalogEntry`/`PageSource`/`PageCategory`**,
  `mergeCatalog`, **`catalogCounts`**, `sourceLabel/sourceColors/sourceOrder`); `page-catalog.ts`
  (**`assembleCatalog`**, `loadCatalogSources`, `buildPageCatalog`); `page-summary.ts`.
- **LP serving**: `lp-html-registry.ts`, `serve-lp.ts` (`serveLp`), `landing-pages.ts`
  (`landingPages[]`, `LpStatus/LpType`), `lp-store.ts` (KV), `embedded-html-store.ts`,
  `lp-content-store.ts`, `builder-html-render.ts`, `page-builder-{store,types}.ts`, `connect-lp.ts`.
- **WordPress**: `wp-api.ts` (`WpDomain`, `fetchAllWpPages`), `wp-fetch-page.ts`
  (`fetchPageContent`), `wp-localize.ts` (`localizePage/relocatePage/buildSlugToPublic`),
  `wp-localize-core.ts` (utils puros testados: `localizeHtml/rewriteUrls/delazyHtml/…`),
  `wp-decisions.ts`, `wp-categorize.ts`.
- **Auth**: `auth.ts` (`UserRole`, `signIn/getCurrentUser`, `requireAdmin/requireSenior/canEdit`,
  `adminCreateUser/setUserRole`), `auth-secret.ts` (`AUTH_SECRET`).
- **Tracking**: `meta-tracking.ts` (pipeline `withTracking`, `META_PIXEL_ID`), `meta-capi.ts`
  (`sendMetaCapiEvent`), `google-tag.ts` (`GTM_ID`), `analytics-store.ts` (`recordVisit/getPageStats`).
- **Forms/Mídia/Leads**: `forms-store.ts` (`FormConfig`, `listForms/addSubmission/listAllSubmissions`),
  `lp-form-config.ts` (`getLpFormConfig/setLpFormConfig`), `media-store.ts`, `media-pages-store.ts`.
- **Infra**: `rate-limit{,-core}.ts` (`rateLimit`, `clientIp/tooManyRequests`), `activity-log.ts`
  (`logActivity/readActivityLog`), `backup-store.ts`, `notifications.ts`, `suggestions-store.ts`,
  `project-groups-store.ts`, `ai-summary.ts`, `vercel-deploys.ts`, `format-date.ts`.

## Modelo de dados no KV (prefixos de chave)
- `wp:content:<domain>:<slug>` — conteúdo completo da página migrada (`WpPageContent`, com `fullHtml`).
- `wp:summary:<domain>:<slug>` — **índice leve** (`SavedSummary`, sem HTML) que as listagens leem.
- `published-index:<slug>` — slug público → página publicada. `wpvideo:migrated` — mapa de vídeos.
- `lps:all`/`lp:<slug>` — LPs dinâmicas. `lp-content:<slug>` — conteúdo SPA. `lp-form-config:<slug>`.
- `forms:all`/`form-submissions:<formId>`. `users:all`. `suggestions:all`. `project-groups:list`.
- `wpasset:*` / `wpmirror/*` (S3) — assets espelhados do WP. `ratelimit:*` — contadores.

## Auth e papéis
Três papéis: `senior` (conta fixa `suporte@jamesolaya.com.br`, único que gerencia usuários),
`admin` (cria/edita/apaga LPs e páginas), `viewer` (somente leitura). Senha do senior vem de
`SENIOR_PASSWORD`. Cadastro público foi REMOVIDO — só o senior cria contas em `/settings/users`.

## Variáveis de ambiente
- `AUTH_SECRET` (obrigatória, JWT — fail-fast em prod sem ela). `SENIOR_PASSWORD` (login do senior).
- `KV_REST_API_URL`/`KV_REST_API_TOKEN` (Vercel KV). `CRON_SECRET` (recomendada, protege os crons).
- `S3_*`/`R2_*` (storage S3-compatível, prioridade) ou `BLOB_READ_WRITE_TOKEN` (Vercel Blob).
- `OPENROUTER_API_KEY` (resumo IA / chat PMU — só em prod). Sem gateway de pagamento (Hotmart hardcoded no HTML).

## Convenções
- Comentários e docs de projeto (README, `notas/`) em português — manter o padrão.
- Editar LPs de `lp-html/` como HTML puro, commit por página.
- **Testes**: `npm test` (5 arquivos: page-catalog, rate-limit, wp-localize-core, media-nomes,
  variantes, media-albuns, ; 128 casos).
- Scripts: `npm run dev|build|start`. ⚠️ **`npm run lint` NÃO funciona** — `next lint` saiu no Next 16 e
  o projeto não tem `eslint.config.js` nem dependência de eslint. Vale `npx tsc --noEmit`, que passa limpo.
  `npm run checar-modelos` valida a cadeia de IA do chat contra o catálogo público da OpenRouter.
  `npm run manifesto-midia` regrava `lib/midia-assets.json` (roda sozinho no `prebuild`) — é ele que
  alimenta a biblioteca de mídia: TODA imagem e vídeo de `public/`, agrupados por álbum. A `/midia`
  se sincroniza sozinha quando a marca do manifesto muda (`media:repo-sync:marca` no KV), então
  imagem nova commitada aparece na galeria no primeiro acesso depois do deploy.

## Pegadinhas (importante — lê antes de deployar ou mexer no KV)
- **Push/deploy TEM que ser como o dono do projeto** `James Olaya <suporte@jamesolaya.com.br>` +
  PAT na var **`GITHUB_PAT`** do `.env.local` (não `token_mktjamesolaya2`):
  `PAT=$(grep -oP '(?<=^GITHUB_PAT=).*' .env.local | tr -d '\r')`
  `git push "https://mktjamesolaya2:$PAT@github.com/mktjamesolaya2/jay-academy.git" HEAD:main`.
  Autor não-dono → o build do Vercel falha com "AUTH_SECRET não configurada" (envs de produção
  não são injetadas). A config git do repo já está ajustada pro dono.
- **`vercel env pull` traz os SEGREDOS vazios** (KV/S3/AUTH_SECRET) → não dá pra rodar script
  local contra KV/S3. Usar endpoints server-side (ex.: os one-shots do `wp-localize`).
- **Nunca `kvMget` de muitos valores grandes**: já lê em lotes de 10; as listagens leem o índice
  leve `wp:summary:*`, não o `fullHtml` (um mget de ~96 páginas com HTML = ~24MB e estourava o KV,
  zerando o painel silenciosamente). Depois de deploy que mexa em páginas, rodar `?rebuildindex=1`.
  Campo novo que a UI precise na lista → adicionar em `SavedSummary`+`summarize` e rebuildar.
- **"Publicada" = página no ar num slug público** (`counts.byStatus.published`); número consistente
  entre dashboard e `/paginas`. `/wp-pages` mostra o recorte só das migradas.

## Estado da migração WordPress (jul/2026)
Migração das páginas CONCLUÍDA (~96 no KV, ~70 publicadas nos slugs originais; 68/68 URLs do
sitemap WP respondendo na Vercel). UI de importação removida. `?wpcheck=1` → `ok:true` (nenhum
asset do servidor WP em página publicada) = **WP pode ser desligado** após backup (dump do banco +
`wp-content/uploads`, que não têm cópia local). Homepage `/` serve provisoriamente o mesmo site
institucional de `/jamesolaya`; login admin só em `/login` e painel protegido em `/dashboard`.
Referência viva e histórico: `notas/progresso-atual.md`.
