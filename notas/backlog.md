# Backlog — Portal Jay Academy

> Ideias aprovadas pra implementar quando voltar. Ordem de prioridade.

---

## 🚨 Sprint 1 — Crítico (faz primeiro)

### 1. Auth (Clerk)
- Login obrigatório pra acessar admin
- Middleware Next.js protege `/`, `/dashboard`, `/wp-pages/*`, `/lps/*`
- Páginas públicas (quando deployar): `/pmuclass`, `/laser`, etc. seguem livres
- **Implementação**: ~1 sessão. Clerk via Vercel Marketplace, env vars auto-provisionadas.

### 2. Status da página
- Cada página WP/LP tem campo `status: "draft" | "published" | "archived"`
- Edições em "draft" não aparecem na URL pública
- Botão "Publicar" no editor pra promover de draft pra published
- Badge visual no card do dashboard
- **Implementação**: adicionar campo no JSON, atualizar cards e editor.

---

## 💪 Sprint 2 — Produtividade

### 3. Duplicar página
- Botão "Duplicar" na página de detalhe (`/wp-pages/[domain]/[slug]`) e no card do dashboard
- Cria cópia do JSON com slug novo (`-copy-1`, `-copy-2`)
- Vai direto pro editor da cópia
- **Implementação**: Server Action que copia o JSON + redireciona.

### 4. Search global ⌘K
- Atalho Cmd+K / Ctrl+K abre modal de busca
- Busca por: nome de página, slug, título da WP, conteúdo
- Click no resultado navega pra página
- **Implementação**: client component com `useEffect` keyboard listener + fuzzy search em landingPages + páginas WP.

---

## 🔒 Pulando por agora (decidido pular)

- **Permissões granulares** (Editor/Designer/Gestor) — Admin only basta enquanto for 1 pessoa
- **Analytics próprio** — usa GA4 embedded quando plugar
- **Deploy centralizado completo** — Vercel já tem dashboard ótimo
- **Versionamento completo** — editor já tem Ctrl+Z
- **Sub-estrutura complexa** (pixels/domínio/etc por projeto)

---

## 🎨 Sprint 3 (depois) — Polimento

- Thumbnails / preview visual das páginas
- Gerenciamento de assets central (imagens reutilizáveis)
- Logs de ação simples (quem editou o quê, quando)

---

Decisão atual (2026-05-28): focar primeiro no LAYOUT do portal antes de implementar essas features.
