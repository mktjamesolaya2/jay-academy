# 🚦 Progresso atual — Portal Jay Academy

> **Estado vivo do portal.** Atualizar ao fim de CADA sessão. Substitui handoffs.
>
> **Última atualização**: 2026-06-01 (sessão tarde — implementou Page Builder, Opção 3)

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
