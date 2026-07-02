# 💡 Ideias e inspirações — Portal

> Espaço pra guardar:
> - Ideias do James que ainda não viraram código
> - Referências visuais (sites, dashboards, ferramentas)
> - Conceitos pra explorar depois
> - "Faria sentido se um dia..."
>
> Cresce sempre. Quando uma ideia vira feature, move pra `progresso-atual.md`. Se for rejeitada, anota o motivo + move pra `historico-decisoes.md`.

---

## 🎯 Ideias do James pra explorar

### 📌 As 3 sugestões originais — 2026-05-29 (recuperadas de `suggestions-store.ts`)

> ⚠️ James salvou essas como seed do `/sugestoes` em 29/05. Eu não tinha visto até agora — recuperei via inspeção de código em 2026-06-01.

#### 1. Subir HTML/CSS direto, sem passar por WordPress
> "Hoje só conseguimos editar páginas que vieram do WP. Seria útil colar HTML/CSS de uma LP comprada ou gerada por IA direto no portal, ter URL pública /p/[slug] e poder editar pelo editor visual igual nas páginas WP."

**Status atual**: não implementado. EditorShell já suporta HTML estático (modo `embed`), falta só UI pra colar HTML/CSS na criação de LP.

**Evolução (01/06/2026)**: virou parte da Opção 1 — editar as LPs nativas (PMU CLASS, Magic Shadow, Jayo Laser) que JÁ são HTML/JS/React. Mesma ideia em escala maior.

#### 2. Editor visual no /forms (campos arrastáveis)
> "Forms nativos hoje têm só 3 campos fixos (nome, whatsapp, email). Quero poder arrastar campos novos (radio, select, textarea, checkbox), trocar cores do botão e do background, e personalizar texto do sucesso/erro."

**Status atual**: não implementado. `FormSubmission` em `lib/forms-store.ts` é hardcoded com name/whatsapp/email.

**Mantida intacta em 01/06/2026** como Opção 2.

#### 3. Páginas do zero estilo Webflow (blocos pré-feitos)
> "Criar uma LP nova SEM depender de WordPress nem de código React. Blocos prontos (hero, depoimentos, FAQ, CTA, pricing) que arrasto e configuro só preenchendo texto e trocando imagem. A LP entra em /p/[slug] pronta pra usar."

**Status atual**: não implementado. `/lps/new` hoje só cria o registro JSON (rascunho); banner amber diz "peça pro programador estruturar".

**Mantida intacta em 01/06/2026** como Opção 3.

---

### 💭 Ideias futuras (não documentadas ainda)

---

## 🎨 Inspirações visuais — dashboards admin que funcionam pro estilo dele

### Vercel Dashboard
- **O que copiar**: tabela de projetos, status badges (Ready/Building/Error), grid de stats no topo
- **Tom**: dark sóbrio, accent branco, tipografia tight, monospace pra URLs/slugs
- **Já aplicado em**: dashboard, ProjectRow, status badges

### Linear
- **O que copiar**: ⌘K command palette, navegação keyboard-first, sidebar com seções colapsáveis
- **Tom**: dark elegante, accent sutil, microinterações de qualidade
- **Já aplicado em**: search-modal.tsx (⌘K)
- **Ainda inspirar em**: keyboard shortcuts pra ações comuns (`/` foca busca, `g d` vai pra dashboard)

### Notion (admin views)
- **O que copiar**: lista de páginas com ícones, edição inline, drag-to-reorder
- **Tom**: clean, denso mas respirado
- **Ainda inspirar em**: drag-to-reorder na lista de LPs?

### Stripe Dashboard
- **O que copiar**: feed de eventos lateral, copy-to-clipboard inline em IDs/URLs
- **Tom**: profissional, neutro, dados em primeiro plano
- **Já aplicado em**: activity feed, copyable-url.tsx
- **Ainda inspirar em**: gráficos de analytics quando plugar GA4

### Adminex / Tailwind UI Admin
- **O que copiar**: componentes consistentes, grid systems, padrões de empty state
- **Tom**: profissional, pronto-pra-usar
- **Já aplicado em**: cards, badges, layout geral

---

## 🚀 Conceitos pra explorar (não implementados, vale considerar)

### Bulk actions
- Checkbox nas linhas de projetos → ações em massa (publicar/arquivar/mover pra lixeira)
- **Quando faria sentido**: se passar de ~10 LPs/páginas

### Versionamento de páginas
- Cada edição cria snapshot — voltar pra versão anterior
- **Trade-off**: complexidade vs. utilidade. Hoje Ctrl+Z no editor basta?
- **Status no backlog**: "decidido pular por enquanto"

### Templates de LP
- "Nova LP a partir de template" — clona uma LP existente como ponto de partida
- **Por quê**: James cria várias LPs com estrutura similar
- **Sinergia**: feature de duplicar página (já no backlog Sprint 2)

### Comments / anotações inline
- Em editor visual, podder clicar em qualquer bloco e deixar nota pra equipe
- **Persona**: quando James trabalhar com designer/copywriter externo

### Preview em iframe com toggle de dispositivo
- Botões `desktop / tablet / mobile` no preview pra ver responsividade
- **Inspiração**: Vercel preview, Webflow designer

### Webhooks / integrações
- "Quando uma LP for publicada, notifica no WhatsApp" / "envia pro Hotmart"
- **Quando faria sentido**: quando portal virar central de operações reais

### Drag-to-reorder das LPs na sidebar
- Reordenar por importância manualmente
- **Inspiração**: Notion, Linear

### Analytics embedded por sub-projeto
- Cada LP mostra impressions/conversões direto no card
- **Dependência**: plugar GA4 ou Plausible

### Editor visual com componentes salvos
- "Salvar este bloco como componente" → reutilizar em outras páginas
- **Tipo Webflow CMS / Framer**

### Modo escuro alternativo (ainda mais escuro?)
- "OLED black" pra monitores OLED dele
- **Quando**: se ele pedir

---

## 🛠️ Melhorias técnicas guardadas

### Migrar `data/` pra Vercel KV / Postgres
- **Hoje**: JSON local em `data/`
- **Quando produção**: precisa migrar pra storage real (Vercel KV, Postgres, ou Supabase)
- **Refs**: skill `vercel:vercel-storage` cobre isso

### Type-safe Server Actions com Zod
- Validar input das actions com Zod antes de processar
- **Por quê**: evitar bugs silenciosos quando user manda dado torto

### Sistema de notificações in-app
- Toast pra ações concluídas, erro, etc.
- **Hoje**: tudo via redirect+revalidate sem feedback visual

### Bundle / lazy load do editor visual
- Editor é grande, só carrega quando precisa

---

## 🔗 Links/refs que James pode mandar

> Quando ele compartilhar referência (URL, screenshot, "olha esse site"), anotar aqui com contexto.

### (vazio por enquanto)

---

## 📝 Como usar este arquivo

- Toda vez que James disser "seria legal", "imagina", "podia ter" → adicionar em **Ideias do James pra explorar**
- Toda vez que tropeçar em referência visual interessante → **Inspirações**
- Toda vez que pensar "isso vale considerar mas não agora" → **Conceitos pra explorar**
- Quando uma ideia for **rejeitada**, move pra `historico-decisoes.md` com motivo
- Quando uma ideia for **implementada**, move pra `progresso-atual.md`

## 💡 Shadow PRO — dobra "4 pilares" · ideia #2 guardada (2026-07-02)
Alternativa à versão de colunas (que foi a escolhida): **Raio-X de UM shadow perfeito** — uma macro grande de um cicatrizado impecável no centro, com 4 marcadores dourados apontando onde cada pilar aparece naquele resultado (distribuição → saturação → execução → acabamento). Transforma o abstrato em anatomia visual de um resultado real. James curtiu, guardar pra possível uso futuro.
