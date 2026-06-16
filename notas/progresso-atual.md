# 🚦 Progresso atual — Portal Jay Academy

> **Estado vivo do portal.** Atualizar ao fim de CADA sessão. Substitui handoffs.
>
> **Última atualização**: 2026-06-16 (importar por link + fim do /p/ no slug raiz + mobile responsivo)

---

## 🧱 Estrutura atual de rotas

```
portal/app/
├── page.tsx                          → / lobby (logo orbital + botão "Acessar painel")
├── login/                            → autenticação
├── cadastro/                         → criação de conta (vira viewer por default)
├── dashboard/                        → /dashboard (greeting + stats + projetos + WP block + activity)
├── lps/
│   ├── page.tsx                      → lista de LPs
│   ├── new/                          → criar LP nova
│   ├── connect/[folder]/             → registrar pasta detectada
│   ├── [slug]/
│   │   ├── page.tsx                  → detalhe da LP
│   │   └── edit-visual/              → editor visual ✨
│   └── pmuclass/edit-content/        → editor específico do PMU CLASS
├── wp-pages/[domain]/[slug]/
│   ├── page.tsx                      → detalhe página WP
│   ├── edit/                         → editor inline (contentEditable + image replace) ✨
│   └── preview/                      → HTML completo em tela cheia
├── wordpress/                        → triagem 92 páginas + cópia
├── forms/
│   ├── page.tsx                      → lista de formulários
│   ├── new/                          → criar form
│   └── [id]/                         → editar form
├── f/[slug]/                         → form público (consumido por leads)
├── p/[slug]/                         → preview público
├── websites/                         → lista filtrada por tipo "website"
├── sugestoes/                        → sistema de sugestões
├── lixeira/                          → itens trashed
├── settings/
│   ├── page.tsx                      → settings gerais
│   └── users/                        → gestão de usuários (apenas senior)
├── analytics/                        → analytics (placeholder)
├── laser/                            → proxy/rota pra Jayo Laser
├── magicshadow/                      → proxy/rota pra Magic Shadow 3
└── api/
    ├── chat-pmu/                     → endpoint do AI chat
    ├── lp-content/[slug]/            → CRUD de conteúdo de LP
    └── wp-form-submit/               → submissão de forms WP
```

---

## 🔐 Sistema de autenticação

**Stack**: JWT (`jose`) + bcryptjs + cookie httpOnly `jay_session` (30 dias)

**3 roles**:
- `senior` — James hardcoded (`suporte@jamesolaya.com.br`, senha `@Suporte123`). Único que gerencia usuários.
- `admin` — pode editar/criar/excluir LPs e páginas. Não gerencia usuários.
- `viewer` — somente leitura.

**Helpers em [lib/auth.ts](../lib/auth.ts)**:
- `getCurrentUser()` — retorna sessão atual
- `requireAdmin()` / `requireSenior()` — guards pra Server Actions
- `canEdit(user)` / `isSenior(user)` / `isViewer(user)` — checks puros
- `signIn` / `signUp` / `signOut` / `updateMyName`
- `listUsers` / `setUserRole` / `deleteUser` (apenas senior)

**Persistência**: `data/users.json` via KV em [lib/storage.ts](../lib/storage.ts)

---

## 📦 Sub-projetos registrados

| Slug | Nome | Tipo | Porta dev | Stack | Status |
|---|---|---|---|---|---|
| `pmuclass` | PMU CLASS | website | 3001 | Vite + React 19 + Express + OpenRouter | published |
| `magic-shadow` | Magic Shadow 3 | lp | 5500 | HTML/CSS/JS puro | published |
| `laser` | Jayo Laser | lp | 8080 | TanStack Start + Radix UI | published |
| `teste` | Teste | lp | — | — | draft (de testes) |

Config: [lib/landing-pages.ts](../lib/landing-pages.ts) (estática) + [lib/lp-store.ts](../lib/lp-store.ts) (dinâmico via KV)

---

## 🗂️ Estado dos dados (`data/`)

**Gitignored** — não vai pro repo.

```
data/
├── lps_all.json                                   → LPs dinâmicas + overrides
├── users.json                                     → usuários cadastrados
├── wp-decisions.json (2 cópias?)                  → decisões da triagem WP
└── wp-content/                                    → 18 páginas WP copiadas
    ├── lp_inicio.json
    ├── lp_inmersion-pelo-a-pelo-*.json (6)
    ├── lp_peloapelo-sc.json
    ├── lp_pmu-upsell-*.json (2)
    ├── main_contato-inmersion.json
    ├── main_curso-online-profissao-remove.json
    ├── main_inicio.json
    ├── main_lips-sense-*.json (2)
    ├── main_pmu-class-super-oferta.json
    ├── main_pmu-pro.json
    └── main_up-pmuclass-1.json
```

---

## 🧩 Bibliotecas internas (`lib/`)

| Arquivo | O que faz |
|---|---|
| `auth.ts` | Auth completo (signin/signup/roles/JWT) |
| `storage.ts` | KV genérico (kvGet/kvSet via JSON local) |
| `landing-pages.ts` | Tipos + LPs estáticas + helpers de cor/status |
| `lp-store.ts` | CRUD dinâmico de LPs (`loadLps`, etc.) |
| `lp-content-store.ts` | Conteúdo editável das LPs |
| `connect-lp.ts` | Registrar pasta detectada como LP |
| `discover-lps.ts` | Scan de pastas em `jayacademy/` não registradas |
| `wp-api.ts` | REST API WordPress (lista 92 páginas) |
| `wp-fetch-page.ts` | Busca REST + HTML público |
| `wp-content-storage.ts` | CRUD de páginas WP copiadas |
| `wp-decisions.ts` | Persistência das decisões da triagem |
| `wp-categorize.ts` | Heurística `isCampaign()` + `suggestionForPage()` |
| `embedded-html-store.ts` | Armazena HTML embedded de páginas |
| `forms-store.ts` | CRUD do sistema de formulários |
| `suggestions-store.ts` | CRUD do sistema de sugestões |
| `activity-log.ts` | Log de ações (lido pelo activity feed) |

---

## 🎨 Componentes (`components/`)

**Layout**: `sidebar.tsx`, `sidebar-nav.tsx`, `topbar.tsx`, `dashboard-topbar.tsx`, `user-menu.tsx`

**LPs/WP**: `lp-card.tsx`, `lp-actions-menu.tsx`, `wp-page-card.tsx`, `wp-page-row.tsx`, `wp-saved-card.tsx`, `detected-folder-card.tsx`

**Editor**: `editor-shell.tsx`, `image-replace-modal.tsx`, `publish-button.tsx`

**Genéricos**: `collapsible-section.tsx`, `pending-button.tsx`, `empty-state.tsx`, `copy-now-button.tsx`, `copyable-url.tsx`, `edit-quick-link.tsx`, `editable-greeting.tsx`, `site-url-link.tsx`, `search-modal.tsx` (⌘K), `quick-actions.tsx`, `orbit-icons.tsx`, `wp-form-behavior.tsx`

---

## 🆕 Sessão 2026-06-01 (tarde) — Page Builder (Opção 3 da sugestão seed-3)

Implementada a 3ª das 3 ideias salvas em `suggestions-store.ts`: criar páginas do zero com blocos pré-feitos, sem WordPress nem React custom.

**Arquivos novos**:
- [`lib/page-builder-store.ts`](../lib/page-builder-store.ts) — Schema + CRUD + defaults + helpers de cor
- [`lib/builder-html-render.ts`](../lib/builder-html-render.ts) — Renderer HTML template puro (sem React, pra rota pública)
- [`components/page-builder/public-renderer.tsx`](../components/page-builder/public-renderer.tsx) — Renderer React (pra preview do editor)
- [`components/page-builder/builder-editor.tsx`](../components/page-builder/builder-editor.tsx) — Editor visual (Client Component)
- [`app/lps/[slug]/build/page.tsx`](../app/lps/[slug]/build/page.tsx) — Rota do editor
- [`app/lps/[slug]/build/actions.ts`](../app/lps/[slug]/build/actions.ts) — Server Actions (save + init)

**Arquivos modificados**:
- [`app/p/[slug]/route.ts`](../app/p/[slug]/route.ts) — Detecta builder page antes de WP. Renderiza HTML + Tailwind CDN + Google Fonts.
- [`app/lps/new/page.tsx`](../app/lps/new/page.tsx) — Checkbox "Construir com blocos" (default marcado). Cria builder page vazia + redireciona pro editor.
- [`app/lps/actions.ts`](../app/lps/actions.ts) — `createLpAction` aceita `useBuilder=1` form field.
- [`app/lps/[slug]/page.tsx`](../app/lps/[slug]/page.tsx) — Botão "Editar com blocos" (se já tem builder) ou "Construir com blocos" (se ainda não).
- [`data/lps_all.json`](../data/lps_all.json) — LP "teste" agora published com stack "Blocos (page builder)" pra servir de demo.

**Arquivos seed (demo)**:
- [`data/builder-page_teste.json`](../data/builder-page_teste.json) — Página demo com Hero + FAQ + CTA visível em `/p/teste`.

**7 tipos de bloco implementados** (em vez dos 5 originais):
1. `hero` — Eyebrow + título + subtítulo + bg image opcional + CTA
2. `testimonials` — Grid de cards com foto/nome/role/texto
3. `faq` — Accordion `<details>` nativo
4. `cta` — Bloco com gradient bg + título + botão branco
5. `pricing` — Grid de planos com plano destacado opcional
6. `text` — Markdown básico (`**bold**`, `_italic_`, `[link](url)`, `## H2`, `### H3`)
7. `image` — Solo + alt + caption opcional

**7 temas de cor** (accents): pink-orange, purple-fuchsia, amber-orange, gold-black, rose, blue-indigo, emerald. + toggle dark/light mode.

**Editor UX**:
- Sidebar esquerda: tema (accent + dark mode) + lista de blocos com botões reorder/duplicate/delete/add-below
- Centro: preview ao vivo dos blocos (Client Component usando o renderer React)
- Sidebar direita: painel de edição por tipo de bloco (campos específicos)
- Topbar: nome da LP + status de save + botão "Ver no ar" + botão Salvar
- Click no bloco no preview seleciona ele
- Aviso de "Não salvo" + confirm antes de sair

**Decisão técnica importante**: Next 16 bloqueia `react-dom/server` em route handlers. Fiz 2 renderers — um React pra preview no editor, um HTML template puro pra rota pública. Documentado em [`historico-decisoes.md`](./historico-decisoes.md).

**Tailwind via CDN no /p/[slug]**: pra MVP. Trocar por CSS extraído quando deployar em produção.

**Testado**: HTTP 200 em `/p/teste` (3902 bytes), contém "Teste do Page Builder", "tailwindcss" e "Funciona mesmo". TypeScript passa limpo.

---

## 🆕 Sessão 2026-06-15 — Polimento visual Magic Shadow (`public/magicshadow/`)

Iteração visual-first com James (editar `portal/public/magicshadow/` → push repo `jay-academy`). Tudo em `styles.css` + `index.html`:

- **Seção benefícios** ("O que as clientes ideais buscam"): linha dourada brilhante costurando imagem→texto (anel glow na imagem + linha que sai dela e corre por cima do título, com ponto de luz na junção).
- **Seção diferencial**: números 01–04 um pouco maiores.
- **Díptico PESO VISUAL | leves/elegantes/naturais**:
  - Kickers "— o que era —" / "— o que o mercado busca —" ancorados nos **cantos opostos do topo** (soltos do `__inner`; `__inner` perdeu `position:relative`, z-index segue via flex item).
  - "O PESO VISUAL" trocou outline vazado por **Poppins sólida** (PESO em dourado).
  - "leves, elegantes e naturais" menor + **escada descendo pra direita** (nth-child 2/3/4 indent progressivo).
  - Lado claro **ancorado pelo topo** (`align-items: flex-start`) pra intro travar; bloco título+lista desce via margin-top no nth-child(2).
  - Seção estendida (min-height até 1080px); frase de fechamento + botão **em fluxo** (grid-rows `1fr auto`); botão centralizado sobre a divisória; blocos preto/cream estendidos pra baixo.
  - **Cor dos blocos = cor real da imagem** (amostrei pixels via System.Drawing): escuro `#140D08`, claro `#EFE6D9`; os fades das colunas dissolvem no MESMO tom (sem emenda). ⚠️ há override inline no `<head>` do index.html (mobile <900px) que precisa acompanhar qualquer mudança dessas cores.
- ⚠️ **Mobile do díptico ainda não foi verificado a fundo** nesta sessão (James revisou desktop). Pendente checar empilhado.

---

## 🆕 Sessão 2026-06-15 (tarde) — Gestão WP estilo WordPress + IA + performance + mobile

**Área de gestão de páginas WP nova** (`/wp-pages`):
- Lista estilo WP: busca, filtros (status/categoria/domínio), seleção múltipla + ações em lote (publicar/despublicar/categorizar/lixeira). Componente [`wp-manage-list.tsx`](../components/wp-manage-list.tsx).
- "Gerenciar" no dashboard abre essa lista em **aba nova**; removido o "Ver as X restantes".
- Server actions: [`manage-actions.ts`](../app/wp-pages/manage-actions.ts) — quickPublish/Unpublish, publishAll/unpublishAll, bulk*, rename, duplicate, generateSummary.

**Detail da página WP** ([`page.tsx`](../app/wp-pages/[domain]/[slug]/page.tsx)) — segue o padrão da detail de LP:
- **Publicada** → gestão limpa: Editar(renomear)/Duplicar/Mover-lixeira + "Sobre essa página" + Atalhos (Abrir página, Editar visualmente). Webhook **só pra forms**.
- **Não publicada** → mantém categorizar + publicar.
- Componente [`wp-page-actions.tsx`](../components/wp-page-actions.tsx) (rename modal/duplicar/lixeira/despublicar).

**Resumo IA automático** — ao publicar, gera resumo (máx 3 linhas) via OpenRouter ([`ai-summary.ts`](../lib/ai-summary.ts) + [`page-summary.ts`](../lib/page-summary.ts)). Sem botão; fallback gera em background. ⚠️ Precisa `OPENROUTER_API_KEY` (só na Vercel; local não tem). Campo `summary` no `WpPageContent`.

**Performance**: fontes via `next/font` (sem render-block); `/p/[slug]` com `stale-while-revalidate` (nunca trava); code-split já ok por rota; force-dynamic mantido (auth).

**Mobile**: editores visuais (edit-visual, build, wp-edit) **bloqueados no mobile** com aviso ([`desktop-only-editor.tsx`](../components/desktop-only-editor.tsx)). Forms/texto livres (funcionam no touch).

**Fidelidade mobile WP**: confirmado que copiar→servir→editar preserva `<head>`/CSS/viewport (editor salva doc inteiro). Adicionada garantia de `<meta viewport>` no `/p`.

**Animações**: feedback tátil global nos botões (press scale + hover) no [`globals.css`](../app/globals.css).

**Pendente (precisa de você):** deploys + páginas-com-erro reais → precisa do **token Vercel** (deploys) + health-check (erro). Botões de animação e resumo IA: validar no ar.

---

## 🆕 Sessão 2026-06-15 (noite) — Roadmap de features (SEO/mídia/analytics/backup/agendamento)

Deploy `b63ba0a` no ar. **KV (Upstash) + Blob já provisionados e com nomes de env certos** (`KV_REST_API_URL/TOKEN`, `BLOB_READ_WRITE_TOKEN`) → **persiste em produção** (a história de "dados resetam" era desatualizada).

- **Sidebar nova** ([sidebar-shell.tsx](../components/sidebar-shell.tsx)): Home · grupo **URLs** retrátil (Websites/LPs/Forms) · Biblioteca de mídia · Analytics · Config · **colapsável**. Sugestões virou **lampadazinha no topbar**. (sidebar-nav.tsx removido)
- **SEO por página**: atalho "SEO da página" em Atalhos → modal ([seo-shortcut.tsx](../components/seo-shortcut.tsx) + [seo-editor.tsx](../components/seo-editor.tsx)) com preview Google/share. Injeta meta tags no `/p` (`applySeo`). Campos no `WpPageContent`.
- **Biblioteca de mídia** (`/midia`): [media-store.ts](../lib/media-store.ts)/[media-types.ts](../lib/media-types.ts) + [media-library.tsx](../components/media-library.tsx). Upload (Blob) + por URL, categorias, busca. **Integrada nos editores** via [media-picker.tsx](../components/media-picker.tsx) (page builder, trocar imagem, SEO).
- **Analytics** (`/analytics`): [analytics-store.ts](../lib/analytics-store.ts) + beacon em `/p` → `/api/track` (classifica origem). Leads **só em forms**. ⚠️ `/api/track` e `/api/cron` liberados no middleware.
- **Backup** (Config, só senior): [backup-store.ts](../lib/backup-store.ts) — snapshot de tudo, restaurar, baixar JSON.
- **Agendamento**: campos `scheduledPublishAt/UnpublishAt` + [schedule-control.tsx](../components/schedule-control.tsx) + worker `/api/cron/publish` + `vercel.json`. ⚠️ **Hobby = cron 1x/dia** (`0 9 * * *`); Pro → trocar pra `*/15`.
- Fix: hidratação dos cards do dashboard (stretched link).

**⚠️ Aprendizado:** `vercel.json` com cron `*/15` **rejeitava o deploy inteiro no Hobby** (sem aparecer na lista). Cron > 1x/dia exige Pro.

**Pulado do roadmap (decisão James):** #3 health-check, #5 templates, #6 domínios, #9 forms independentes, #10 integrações nativas.

---

## 🆕 Sessão 2026-06-16 — Importar por link + fim do /p/ + mobile

- **Importar por link** ([import-by-link.tsx](../components/import-by-link.tsx) + [import-actions.ts](../app/wp-pages/import-actions.ts)): cola URLs do WP → copia (REST por slug + fullHtml). Tem "publicar automaticamente". Botão no topo de Gerenciar páginas.
- **Páginas WP** virou item da sidebar (grupo URLs); bloco WP duplicado do dashboard removido; "Todos os projetos" mostra páginas WP **publicadas** (placed || published).
- **Fim do /p/** ⭐: páginas publicadas servem **no slug raiz** (`/metodo-fio-a-fio`) via [app/[slug]/route.ts](../app/[slug]/route.ts) (re-exporta o GET de /p). Middleware **invertido**: protege só os ADMIN_PREFIXES; resto público (slug raiz = público). `/p/` antigo ainda funciona (backward compat). URLs exibidas atualizadas pra sem /p/. ⚠️ Pra valer no domínio próprio: apontar jayacademy.com.br → portal (DNS) DEPOIS de importar tudo (senão WP some e dá 404 em páginas não importadas).
- **Mobile** ⭐ (desktop intacto, tudo via `lg:`): sidebar virou **gaveta** (☰ canto sup-esq, off-canvas + backdrop) — [sidebar-shell.tsx](../components/sidebar-shell.tsx); dashboard/headers/conteúdo com padding mobile + clearance do hamburguer (`pt-16`); ProjectRow/WpProjectRow só nome+status no mobile; tabelas com `overflow-x-auto`; **Atividade recente + Deploys movidos pra Configurações no mobile** ([admin-feeds.tsx](../components/admin-feeds.tsx)).
- Animação de entrada de página (fade) via [app/template.tsx](../app/template.tsx).
- ⚠️ Mobile é **primeira passada** — editores visuais/builder/modais/forms podem precisar de refino.

---

## ✅ Features completas

- [x] **Page Builder Webflow-style** (`/lps/[slug]/build`) — 7 blocos + 7 temas + editor com preview ao vivo · 2026-06-01
- [x] Auth com 3 roles (senior/admin/viewer)
- [x] Lobby + dashboard com stats e activity feed
- [x] Triagem WordPress (92 páginas, 2 domínios)
- [x] Cópia completa WP (REST + HTML público com CSS/imagens)
- [x] 18 páginas WP copiadas
- [x] Editor inline contentEditable para páginas WP
- [x] Modal de replace de imagem
- [x] Editor visual para LPs (`/lps/[slug]/edit-visual`)
- [x] Editor de conteúdo PMU CLASS (`/lps/pmuclass/edit-content`)
- [x] Sistema de status (draft/published/archived)
- [x] Lixeira com trashed flag
- [x] Sistema de formulários (criação, listagem, público em `/f/[slug]`)
- [x] Sistema de sugestões
- [x] Preview público (`/p/[slug]`)
- [x] Search modal ⌘K
- [x] Activity log lateral (admin/senior)
- [x] Gestão de usuários (apenas senior)
- [x] Quick actions no dashboard
- [x] Editable greeting
- [x] Auto-detect de pastas novas
- [x] Sidebar colapsável com lista de LPs

---

## 🚀 Deploy

- **Projeto Vercel**: `jay-academy.vercel.app` (account `mktjamesolaya2-5547s-projects`)
- **Mesmo projeto serve**: portal admin na raiz + PMU CLASS em `/pmuclass`
- **Git remote**: `github.com/mktjamesolaya2/jay-academy` (branch `main`)
- **Fluxo de deploy**: integração Vercel ↔ GitHub. **`git push origin main` → Vercel buildaautomático** e promove pra produção. Sem CLI manual.

### Como atualizar produção

```
cd portal
git add <arquivos>
git commit -m "..."
git push origin main
```

Em ~1-2 min sobe em `jay-academy.vercel.app`. Ver status em https://vercel.com/mktjamesolaya2-5547s-projects/jay-academy/deployments

### ⚠️ Limitações persistentes do deploy

- **Dados resetam a cada build**: filesystem do servidor Vercel é efêmero (`data/` local não vai pro Vercel). Pra persistir LPs/users/páginas builder em produção, precisa provisionar **Vercel KV** (Marketplace) + adicionar `KV_REST_API_URL` + `KV_REST_API_TOKEN` nas env vars.
- **AUTH_SECRET dev hardcoded**: setar var real em produção (jose JWT signing).
- **Senior hardcoded sempre disponível**: `suporte@jamesolaya.com.br` / `@Suporte123` funciona mesmo sem KV.

### Pendências de produção
  - [ ] Setar `AUTH_SECRET` real (hoje tem default dev) via dashboard Vercel
  - [ ] Provisionar Vercel KV via Marketplace + setar env vars
  - [ ] Conferir `vercel.json` (path rewrites pra `/pmuclass`, `/laser`, `/magicshadow`) — pode não existir ainda

### Último push pra produção (2026-06-01)

- **Commit**: `b477f15 Add page builder with 7 block types`
- **Inclui**: Page Builder completo (Opção 3) + sistema de notas
- **Build esperado**: ~1-2 min depois do push

## ⚠️ Bugs conhecidos / dívidas

- [ ] `revalidatePath` às vezes não atualiza browser — workaround: F5
- [ ] `data/wp-decisions.json` e `data/wp_decisions.json` (com underscore) — duplicação suspeita, conferir qual é o oficial
- [ ] `main_lips-sense-avancado-micropigmentacao-labial-estrategica-2.json` na raiz de `data/` (não em `wp-content/`) — pode ser leftover de teste

---

## 🔮 Próximos passos (ver `backlog-proximos-passos.md`)

Sessão atual (2026-06-01): **criar sistema de notas robusto pra não perder mais progresso.** Em andamento.

Depois disso, James decide qual é a próxima feature. Possíveis caminhos:
1. Polimento visual do portal (decisão de 2026-05-28: focar layout antes de features)
2. Implementar próxima feature do backlog
3. Deploy real em `jayacademy.com.br` (precisa decidir destino do WP atual)

---

## 📝 Como atualizar este arquivo

Ao fim de cada sessão:
1. Mover features novas pra "Features completas"
2. Atualizar "Estrutura atual de rotas" se criou rotas novas
3. Atualizar "Bibliotecas internas" e "Componentes" se criou arquivos novos
4. Anotar bugs descobertos em "Bugs conhecidos"
5. Atualizar "Última atualização" no topo
