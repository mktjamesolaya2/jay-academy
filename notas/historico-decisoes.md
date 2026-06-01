# 📜 Histórico de decisões — Portal

> Decisões importantes com motivação. "Por que escolhemos X em vez de Y?".
> Cresce cronologicamente. Não apagar entradas — se mudar de ideia, adicionar entrada nova explicando.

---

## 2026-05-27 — Arquitetura inicial

### Portal como guarda-chuva em path-based routing
- **Decisão**: `jayacademy.com.br` será admin + path routing pras LPs (`/pmuclass`, `/laser`, `/magicshadow`)
- **Alternativa rejeitada**: subdomínios (`pmuclass.jayacademy.com.br`)
- **Por quê**: mantém autoridade de SEO num só domínio, deploy mais simples
- **Implicação**: WordPress atual em `jayacademy.com.br` precisa ser migrado ou redirecionado

### Stack: Next.js 16 App Router
- **Decisão**: Next 16 + React 19 + Tailwind v4 + TypeScript
- **Por quê**: server actions facilitam CRUD sem API custom, App Router pra rotas dinâmicas

### Porta dev 4000
- **Decisão**: portal roda em `:4000`
- **Por quê**: evitar conflito com PMU CLASS (`:3001`), Magic Shadow (`:5500`), Jayo Laser (`:8080`)

### DNA visual distinto das LPs
- **Decisão**: portal = SaaS dark sóbrio. LPs = streaming Netflix com gradient pink→orange.
- **Por quê**: ferramenta de trabalho ≠ produto comercial. Misturar confunde o James e os usuários.

---

## 2026-05-27 — WordPress import

### Cópia em 2 camadas (REST + HTML público)
- **Decisão**: cada página WP é copiada com `content` (do REST API) E `fullHtml` (HTML público completo com CSS+imagens inline)
- **Alternativa rejeitada**: usar só REST API
- **Por quê**: REST API só dá o conteúdo do editor, sem CSS/imagens estilizadas. `fullHtml` preserva visual fiel.
- **Trade-off**: mais espaço em disco, mas vale por fidelidade

### Triagem com 3 estados (copy/ignore/desmarcar)
- **Decisão**: cada página WP tem decisão persistida em `data/wp-decisions.json`
- **Heurística automática**: `isCampaign()` + `suggestionForPage()` em `lib/wp-categorize.ts`
- **James decide manualmente**: pode aceitar sugestão ou ajustar

### Modal inteligente "Copiar agora"
- **Decisão**: se já tem cópias, oferece 3 opções: "copiar só novas" / "recopiar todas (sobrescreve)" / "cancelar"
- **Por quê**: nunca tomar decisão por ele em ação destrutiva

---

## 2026-05-28 — Pivô estratégico

### Pausar features, focar layout
- **Decisão**: antes de continuar features do backlog, alinhar layout do portal
- **Por quê**: James queria sentir que o portal é dele antes de empilhar funcionalidade
- **Status**: foi implementado em sessões não documentadas. Funcionou.

---

## Entre 2026-05-28 e 2026-06-01 — Sessões não documentadas (reconstruído)

> ⚠️ **Estas decisões foram tomadas em sessões onde não atualizamos as notas.** Reconstruídas via inspeção do código em 2026-06-01.

### Auth próprio (não Clerk)
- **Decisão**: implementar auth custom com JWT + bcryptjs + cookies httpOnly
- **Alternativa rejeitada**: Clerk via Vercel Marketplace (que estava no backlog)
- **Por quê provável**: controle total, sem depender de SaaS externo, dados locais
- **3 roles**: senior (hardcoded, único, gerencia usuários) / admin (edita conteúdo) / viewer (read-only)
- **Senior hardcoded**: `suporte@jamesolaya.com.br` com senha `@Suporte123` — sempre disponível mesmo sem KV

### Migração de roles legados
- **Decisão**: code em `lib/auth.ts` faz migration automática: role `"editor"` (legado) → `"admin"`
- **Implicação**: se aparecer user antigo, ele é normalizado no read

### Editor visual `/lps/[slug]/edit-visual`
- **Decisão**: criar editor visual para LPs (além do editor de conteúdo PMU CLASS)
- **Status**: implementado, detalhes em `lp-content-store.ts` + `editor-shell.tsx`

### Editor WP inline com contentEditable
- **Decisão**: feature que estava pausada por créditos → foi implementada
- **Detalhes**: `dangerouslySetInnerHTML` + `contentEditable` direto no HTML armazenado
- **Image replace**: modal separado com upload ou URL
- **Save**: Server Action atualiza JSON

### Sistema de formulários
- **Decisão**: criar feature de forms separada (`/forms` admin + `/f/[slug]` público)
- **Por quê provável**: capturar leads diretamente do portal sem depender de WP

### Sistema de sugestões
- **Decisão**: `/sugestoes` page + `suggestions-store.ts`
- **Por quê provável**: canal interno pra James/equipe sugerirem mudanças

### Lixeira com `trashed` flag
- **Decisão**: soft delete via flag em vez de delete real
- **Por quê provável**: reversibilidade — James pode recuperar item por engano

### ⌘K search global
- **Decisão**: `search-modal.tsx` com keyboard listener Cmd/Ctrl+K
- **Por quê**: velocidade de power-user — pular pra qualquer LP/WP page rápido

### Activity log lateral
- **Decisão**: `activity-log.ts` + render no aside direito do dashboard
- **Visível só pra**: admin + senior
- **Por quê**: sente que tem audit trail das ações da equipe

### Rotas públicas `/p/[slug]` e `/f/[slug]`
- **Decisão**: separar editor admin (`/lps/[slug]`) de preview público (`/p/[slug]`)
- **Por quê**: URLs públicas curtas, sem expor estrutura admin

---

## 2026-06-01 — Sistema de notas

### Criar `notas/` estilo PMU CLASS
- **Decisão**: replicar estrutura de notas do `PMUCLASS/PMU-CLASS/notas/` no portal
- **Por quê**: James reportou *"ja fizemos tudo isso, não foi salvo nosso ultimo progresso"* — perdemos histórico de várias sessões
- **Estrutura adotada**:
  - `README.md` — índice
  - `perfil-james.md` — base de pensamentos
  - `feedback-cliente.md` — padrões aprovado/rejeitado
  - `progresso-atual.md` — **estado vivo, atualizado por sessão** (substitui handoffs)
  - `historico-decisoes.md` — este arquivo
  - `ideias-inspiracoes.md` — ideias guardadas
  - `backlog-proximos-passos.md` — fila priorizada
- **Regra nova**: ao fim de cada sessão, ATUALIZAR `progresso-atual.md`. Não deixar pra próxima.

---

## 2026-06-01 (tarde) — Page Builder

### 3 ideias da seed-sugestões (29/05) → escolha de ordem
- **Decisão**: começar pela 3ª (Páginas do zero estilo Webflow). Depois forms (2ª) e LPs nativas (1ª evoluída).
- **Por quê**: o sistema de blocos universal serve de base pra refatorar LPs nativas depois. Resolve a primeira ideia ("HTML/CSS direto") via blocos mais ricos. James escolheu via `AskUserQuestion`.

### Renderer público em HTML template puro (não React)
- **Decisão**: `lib/builder-html-render.ts` produz HTML via template literal. NÃO usa `renderToString` do React.
- **Por quê**: Next 16 bloqueia `react-dom/server` em route handlers (erro: "You're importing a component that imports react-dom/server..."). Tentei React.createElement + renderToString → falhou no Turbopack dev.
- **Trade-off**: dois renderers (React pra editor preview, HTML pra produção). Lógica duplicada. Aceitável pra MVP.
- **Como evoluir**: quando deployar em produção, considerar mover `/p/[slug]` pra `page.tsx` (Server Component) com Tailwind buildado em vez de CDN. Pra WP page, separar em rota distinta tipo `/p-wp/[domain]/[slug]/route.ts`.

### Tailwind via CDN no HTML servido
- **Decisão**: `<script src="https://cdn.tailwindcss.com">` na rota `/p/[slug]` quando é builder page.
- **Por quê**: classes geradas dinamicamente (cor accent, gradients) não estão necessariamente no bundle do Next. Resolve em 1 linha.
- **Trade-off**: FOUC + dependência externa + sem JIT real (CDN é versão Play, não dá pra customizar tema).
- **Quando trocar**: na configuração de deploy. Pode usar `tailwind safelist` ou Next page.tsx.

### 7 tipos de bloco (em vez dos 5 sugeridos)
- **Decisão**: hero, testimonials, faq, cta, pricing + text (markdown básico) + image
- **Por quê**: text e image são primitivos úteis. Pouco custo pra adicionar. Permite preencher gaps entre os blocos "premium".

### Markdown próprio no bloco text (não usar lib)
- **Decisão**: implementei parser próprio mínimo (regex pra `**bold**`, `_italic_`, `[link](url)`, `## H2`, `### H3`).
- **Por quê**: lib externa (react-markdown, marked) adiciona ~30kb. Pra MVP, só preciso de 5 tokens.
- **Como evoluir**: se James pedir tabelas, listas com bullets, code blocks, etc., trocar por `marked` ou `react-markdown`.

### Editor com 3 colunas (sidebar/preview/inspector)
- **Decisão**: layout 3 colunas tipo Webflow/Framer
- **Sidebar esquerda**: tema + lista de blocos + ações por bloco (mover up/down/duplicar/deletar/add abaixo)
- **Centro**: preview ao vivo, click no bloco seleciona
- **Sidebar direita**: painel de edição do bloco selecionado (campos específicos)
- **Sem drag-and-drop ainda**: botões up/down bastam pra MVP. Drag pode entrar em Sprint 2.

### LP "teste" virou demo published
- **Decisão**: a LP "teste" que James criou em 28/05 virou page builder demo (`/p/teste`)
- **Por quê**: tinha LP vazia "draft" ocupando espaço — converti pra demo válida. Pode ser deletada/repurposed depois.

### useBuilder checkbox em /lps/new (default marcado)
- **Decisão**: nova LP padrão usa builder. Checkbox desmarcado = registro vazio (comportamento antigo).
- **Por quê**: builder é o caminho recomendado agora. Quem precisa de WP/dev é exceção.

---

## 2026-06-01 (noite) — Deploy preview + refactor de tipos

### Tipos do page builder extraídos pra arquivo separado
- **Decisão**: criar `lib/page-builder-types.ts` com TODOS os tipos + constantes puras + funções puras (defaultBlockData, newBlockId, emptyPage). O `lib/page-builder-store.ts` mantém só CRUD server-only.
- **Por quê**: build de produção do Next 16 quebrou com erro *"'server-only' cannot be imported from a Client Component module"*. O `builder-editor.tsx` (Client) importava tipos do store que tinha `server-only`. Em dev passou; em prod Turbopack pegou.
- **Lição**: Client Components NÃO podem importar de arquivos com `"server-only"`. Sempre separar tipos puros em arquivo distinto desde o início.
- **Como aplicar de novo**: pra qualquer feature nova, criar `lib/X-types.ts` com tipos + `lib/X-store.ts` com server-only operations.

### Deploy via git push (não CLI)
- **Decisão FINAL**: deploy é via `git push origin main` na repo `github.com/mktjamesolaya2/jay-academy`. Vercel pega via integração GitHub e deploya automático.
- **Por quê**: setup já existia antes (James confirmou *"a gente criou junto"*). Cheguei a instalar `vercel` CLI + linkar manualmente + deployar preview por engano. Reverti: desinstalei CLI, mantive `.gitignore` com `.vercel`.
- **Vantagem**: cada `git push` = produção sobe em ~1-2 min sem comandos extras. James pode fazer push de qualquer máquina.
- **Lição**: SEMPRE conferir `git remote -v` no início. Se tem remote GitHub, presumir auto-deploy Vercel.

### Account Vercel + projeto
- **Account**: `mktjamesolaya2-5547s-projects`
- **Projeto**: `jay-academy.vercel.app`
- **Mesmo projeto**: serve portal admin na raiz + PMU CLASS em `/pmuclass` (path-based)

---

## 2026-06-01 (noite) — Bug do .gitignore `build/`

### Sintoma
Push do commit `b477f15` foi pra GitHub mas o build de produção no Vercel falhou com `Cannot find module '@/app/lps/[slug]/build/actions'`. Preview da CLI tinha passado, mas era falso positivo (CLI vê filesystem local, GitHub deploy só vê o que está commitado).

### Causa
`.gitignore` linha 9 tinha `build/` (genérico, sem barra inicial). Esse pattern matchea QUALQUER pasta chamada `build` no repo, incluindo `app/lps/[slug]/build/` — o folder novo da rota do editor. Os arquivos `page.tsx` e `actions.ts` ficaram silently ignored pelo git. O commit subiu sem eles.

### Fix
Mudei `build/` → `/build/` (ancorado na raiz) em `.gitignore`. Next 16 com Turbopack usa `.next/` mesmo, então o pattern raiz é só por precaução.

### Lição (importante)
- Padrões `.gitignore` SEM barra inicial são RECURSIVOS — pegam qualquer subpasta com aquele nome em qualquer profundidade.
- Sempre que possível, ancorar padrões na raiz com `/` no começo (`/build/`, `/dist/`, etc).
- Antes de assumir que commit tá completo, conferir `git status --ignored` quando algo der errado.

---

## 🔮 Decisões pendentes (a tomar)

- [ ] Destino do WordPress atual quando portal subir em `jayacademy.com.br` — backup em `wp.jayacademy.com.br`? Redirects 301? Morre?
- [ ] Plugar GA4 + Meta Pixel? Onde? Por sub-projeto ou global no portal?
- [ ] Mobile do editor visual: vale o esforço ou desktop-only basta?
- [ ] Deploy: Vercel pro portal e cada LP separado, ou monorepo Turbo?
