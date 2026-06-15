# 🗂️ Visão geral completa — Portal Jay Academy

> Documento de referência do que o portal é, faz e por quê. Atualizado em 2026-06-15.

---

## 🎯 Objetivo / Propósito

O **Portal Jay Academy** é o **painel administrativo central** da Jay Academy — um lugar único, com login, pra **gerenciar todas as páginas, sites e landing pages** da escola sem depender do WordPress nem mexer em código.

A dor que ele resolve: hoje as páginas vivem espalhadas (WordPress antigo, LPs em projetos separados, sites soltos). O portal **centraliza** tudo, deixa **importar do WordPress**, **editar visualmente**, **publicar com URL própria**, **capturar leads** e **organizar** — tudo num painel só, com cara de SaaS premium (Vercel/Linear), e operável por quem **não é técnico**.

Resumo em uma frase: **"O WordPress da Jay Academy, mas moderno, rápido e do nosso jeito."**

---

## 🧱 Stack técnico

| Camada | Tecnologia |
|---|---|
| Framework | **Next.js 16** (App Router, Server Components, Server Actions, Turbopack) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS + design system próprio (dark SaaS) |
| Auth | JWT (`jose`) + bcryptjs + cookie httpOnly |
| Persistência | KV genérico via JSON local (`lib/storage.ts`) — em produção precisa Vercel KV pra persistir |
| IA | OpenRouter (resumo inteligente + chat PMU) com fallback de modelos grátis |
| Fontes | Inter via `next/font` (self-hosted) |
| Deploy | Vercel (auto-deploy via push no GitHub `mktjamesolaya2/jay-academy`) |
| Ícones | lucide-react |

---

## 🔐 Autenticação e papéis

Stack: JWT + bcrypt + cookie `jay_session` (30 dias). Helpers em `lib/auth.ts`.

**3 papéis:**
- **`senior`** — James (hardcoded). Único que **gerencia usuários**. Acesso total.
- **`admin`** — cria/edita/exclui LPs e páginas. Não gerencia usuários.
- **`viewer`** — só leitura.

Guards: `requireAdmin()`, `requireSenior()`, `canEdit()`, `isSenior()`, `isViewer()`. Persistência em `data/users.json`.

---

## 🗺️ Mapa completo de funcionalidades

### 1. Lobby + Login + Cadastro
- `/` — lobby (logo orbital + "Acessar painel")
- `/login`, `/cadastro` (novo usuário entra como viewer)

### 2. Dashboard (`/dashboard`)
- Saudação editável, **estatísticas** (total de páginas, recentes, rascunhos, **páginas com erro**)
- Lista de projetos/LPs + bloco WordPress (stats + atalho "Gerenciar")
- **Feed de atividade** lateral (admin/senior) — log de todas as ações
- **Feed de deploys** (⚠️ hoje placeholder — precisa integrar API Vercel)
- **Quick actions** + **busca global ⌘K**

### 3. Landing Pages (`/lps`)
- Lista de todas as LPs com status (rascunho/publicada/arquivada/erro)
- `/lps/new` — criar LP nova (com opção "construir com blocos")
- `/lps/[slug]` — detalhe da LP: status, **Editar (renomear)**, **Duplicar**, **Mover pra lixeira**, "Sobre", **Atalhos** (Abrir página, Editar visualmente/blocos), data
- `/lps/connect/[folder]` — registrar pasta detectada como LP
- Auto-detecção de pastas novas em `jayacademy/`

### 4. Editores manuais
- **Editor Visual** (`/lps/[slug]/edit-visual`) — arrastar, redimensionar, trocar imagem, editar texto inline (iframe). Salva o documento inteiro (preserva CSS/responsivo).
- **Page Builder** (`/lps/[slug]/build`) — montar página com 7 blocos (hero, depoimentos, FAQ, CTA, preços, texto, imagem) + 7 temas de cor + dark/light. Sem WordPress nem código.
- **Editor de conteúdo PMU CLASS** (`/lps/pmuclass/edit-content`) — textos, links Hotmart, WhatsApp.
- **Editor inline de páginas WP** (`/wp-pages/[domain]/[slug]/edit`) — contentEditable + replace de imagem.
- 📱 **Os editores visuais (visual/builder/WP) são bloqueados no mobile** com aviso amigável (evita erros de toque/tela pequena). Forms e editor de texto continuam liberados.

### 5. WordPress — Importar / Triagem (`/wordpress`)
- Lista as **92 páginas** dos 2 domínios WP (jayacademy.com.br + lp.jayacademy.com.br) — **só leitura, não altera o WP**
- Decisão por página: **Copiar** / Ignorar / Pendente (+ heurística que sugere automaticamente)
- "Marcar sugeridas" em lote
- Cópia completa: REST API + **HTML público inteiro** (com CSS/imagens/viewport originais → **mobile preservado**)
- Seção "Já copiadas" + estatísticas

### 6. Gestão de páginas WP — estilo WordPress (`/wp-pages`) ⭐ novo
- **Lista estilo WP**: busca, filtros (status/categoria/domínio), **seleção múltipla** com checkbox
- **Ações em lote**: publicar / despublicar / categorizar / mover pra lixeira
- "Publicar todas" / "Despublicar todas"
- **Detalhe** (`/wp-pages/[domain]/[slug]`):
  - **Publicada** → gestão limpa: Editar(renomear) / Duplicar / Mover-lixeira + "Sobre essa página" (**resumo IA**) + Atalhos (Abrir página, Editar visualmente). Webhook **só pra formulários**.
  - **Não publicada** → categorizar ("Onde colocar": Website/LP/Form) + publicar.
- **Publicar** gera URL pública `/p/[slug]` + **resumo IA automático**.

### 7. Resumo inteligente (IA) ⭐ novo
- Ao **publicar**, o portal lê o conteúdo da página e gera um **resumo curto (máx 3 linhas)** automaticamente (OpenRouter, sem botão).
- Fallback: se faltar, gera em background ao abrir.

### 8. Formulários + Leads (`/forms`)
- Criar formulário (`/forms/new`) — campos Nome/WhatsApp/E-mail
- `/forms/[id]` — config + **webhook** (Clint/Zapier/Make/RD) + **redirect** pós-envio + **leads recebidos em tempo real** (com status do webhook)
- `/f/[slug]` — formulário público (sem login)
- **Interceptor universal**: qualquer form de página WP publicada (Elementor/CF7/Gravity) é capturado → manda o lead pro portal → dispara webhook → redireciona. (Bug do `<base href>` corrigido — usa URL absoluta do portal.)

### 9. Páginas públicas (`/p/[slug]`)
- Serve LPs/páginas publicadas (builder, HTML editado ou cópia WP)
- **Cacheadas com `stale-while-revalidate`** (rápidas, nunca travam, revalidam em background)
- Garante `<base href>` (resolve assets WP) + `<meta viewport>` (mobile)

### 10. Websites (`/websites`)
- Lista filtrada das páginas categorizadas como tipo "website" (sites multi-página)

### 11. Sugestões (`/sugestoes`)
- Sistema de ideias/sugestões de features

### 12. Lixeira (`/lixeira`)
- Itens movidos pra lixeira (soft delete) com **restaurar** ou excluir permanente

### 13. Settings (`/settings`, `/settings/users`)
- Configurações gerais + **gestão de usuários** (criar/papel/excluir — só senior)

### 14. Analytics (`/analytics`)
- Placeholder pra métricas

---

## 🔌 Sub-projetos integrados (servidos pelo portal)

| Slug | O que é | Stack | Rota |
|---|---|---|---|
| **PMU CLASS** | Escola streaming de micropigmentação (4 LPs) | Vite + React 19 + Express + OpenRouter | `/pmuclass` |
| **Magic Shadow 3** | LP cinematográfica do curso Magic Shadow | HTML/CSS/JS puro | `/magicshadow` |
| **Jayo Laser** | LP do curso de laser | TanStack Start + Radix | `/laser` |

> O portal serve essas LPs como subpaths no mesmo deploy Vercel.

---

## 🚀 Deploy / Produção

- **Vercel**: `jay-academy.vercel.app` (serve o portal na raiz + sub-projetos nos subpaths)
- **Git**: `github.com/mktjamesolaya2/jay-academy` (branch `main`)
- **Fluxo**: `git push origin main` → Vercel buildaautomático e promove pra produção
- ⚠️ **Limitações atuais**:
  - Dados resetam a cada build (filesystem efêmero) → precisa **Vercel KV** pra persistir LPs/users/páginas em produção
  - `OPENROUTER_API_KEY` só na Vercel (resumo IA não roda local sem `.env.local`)
  - `AUTH_SECRET` real a setar em produção

---

## ⚡ Performance (otimizações feitas)
- Fontes self-hosted via `next/font` (sem render-block)
- Páginas públicas com `stale-while-revalidate` (instantâneas, sem travamento)
- Editores pesados isolados por rota (code-split automático)
- Feedback tátil/animação global nos botões

---

## 🧩 Bibliotecas internas (`lib/`)
`auth.ts`, `storage.ts` (KV), `landing-pages.ts`, `lp-store.ts`, `lp-content-store.ts`, `connect-lp.ts`, `discover-lps.ts`, `wp-api.ts`, `wp-fetch-page.ts`, `wp-content-storage.ts`, `wp-decisions.ts`, `wp-categorize.ts`, `embedded-html-store.ts`, `forms-store.ts`, `suggestions-store.ts`, `activity-log.ts`, `page-builder-store.ts`, `builder-html-render.ts`, `ai-summary.ts` ⭐, `page-summary.ts` ⭐.

---

## 📋 Pendências / Roadmap

- [ ] **Deploys reais no dashboard** — integrar API da Vercel (precisa token Vercel + project ID)
- [ ] **Health-check de páginas com erro** — pingar URLs publicadas e marcar erro automaticamente
- [ ] **Vercel KV** em produção (persistir dados entre builds)
- [ ] Melhorias "estilo WP" extras: editar slug/permalink + SEO, agendar publicação, miniatura visual na lista
- [ ] Validar resumo IA + webhooks em produção
