# CLAUDE.md

## O que é este projeto
Jay Academy Portal (`jayacademy-portal`) — CMS/admin interno da Jay Academy (marca de
treinamento em micropigmentação/PMU) para centralizar landing pages, sites, formulários/leads
e importação do WordPress legado. Não é a plataforma de entrega de cursos em si (isso é o
"PMU CLASS", um sub-projeto separado servido como subpath).

Dia a dia observado no histórico de commits: majoritariamente iteração visual/copy em landing
pages de venda (NanoFios, Shadow PRO, Fio a Fio, Lips Sense), não trabalho de feature do
admin/CMS.

## Stack
- Next.js 16 (App Router + Turbopack), React 19, TypeScript, Tailwind v4
- Sem `src/`: tudo na raiz (`app/`, `components/`, `lib/`)
- Auth própria: `jose` (JWT, cookie `jay_session`) + `bcryptjs`, ver `middleware.ts` e `lib/auth.ts`
- Storage: `lib/storage.ts` abstrai KV (Vercel KV, fallback arquivo local em `data/`) e upload
  de arquivos (S3-compatível/R2 > Vercel Blob > `public/uploads` local)
- Dev roda em **porta 4000** (`npm run dev`, não a 3000)
- Deploy: Vercel, repo `mktjamesolaya2/jay-academy`, branch `main`, auto-deploy no push

## Estrutura
- `app/` — App Router **flat** (sem route groups tipo `(dashboard)`); gating de admin é feito
  via prefixos no `middleware.ts` (`/dashboard`, `/lps`, `/forms`, `/settings`, etc.)
- `app/[slug]` — catch-all que serve páginas publicadas (via KV) direto na raiz do domínio
- `app/<slug-especifico>/route.ts` — várias LPs "recreated" são servidas por route handler
  dedicado lendo HTML estático de `lp-html/*.html` (editar o HTML e dar push = deploy)
- `lib/` — toda lógica de negócio/dados: stores (LPs, forms, mídia, backup, activity log),
  import/scraping do WordPress, page builder, resumo via IA (OpenRouter)
- `notas/` — base de conhecimento viva do projeto (decisões, perfil do cliente, progresso
  atual, backlog). **Ler `notas/README.md` e `notas/progresso-atual.md` primeiro** para
  contexto de sessões anteriores; **atualizar `notas/progresso-atual.md` ao final de cada
  sessão de trabalho** (regra já estabelecida no projeto)
- `public/recriadas/<slug>/` — outro padrão de LP estática, servida via rewrite no
  `next.config.ts` (distinto do padrão `lp-html/`)

## Auth e papéis
Três papéis: `senior` (conta fixa `suporte@jamesolaya.com.br`, único que gerencia usuários),
`admin` (cria/edita/apaga LPs e páginas), `viewer` (somente leitura, padrão para novo cadastro).
Helpers em `lib/auth.ts`: `requireAdmin()`, `requireSenior()`, `canEdit()`, `getCurrentUser()`.

## Variáveis de ambiente relevantes
- `AUTH_SECRET` (obrigatória, assinatura JWT)
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (Vercel KV)
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob) ou `S3_*`/`R2_*` (storage S3-compatível, tem prioridade)
- `OPENROUTER_API_KEY` (resumo IA / chat PMU — só em produção)
- Sem integração de gateway de pagamento no código; links da Hotmart são hardcoded no HTML das LPs

## Convenções
- Comentários e documentação de projeto (README, notas/) são em português — manter o padrão
- Editar LPs em `lp-html/` como HTML puro, dar commit por página (padrão já usado no histórico)
- Cron diário (`vercel.json` → `/api/cron/publish` às 9h) cuida de publicação agendada
