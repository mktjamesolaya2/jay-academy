# 💬 Padrões de feedback do James — Portal

> Toda decisão de "isso ele gostou / isso ele rejeitou" vai aqui. Pra não errar duas vezes.

---

## ✅ O que FUNCIONA no portal

### 1. Dark mode `#0a0a0a` em tudo
- **Quote**: *"quero o portal todo dark, ferramenta profissional"*
- **Regra**: nunca usar `bg-black` puro, nunca light mode. Surface `#0d0d0d`, border `#1f1f1f`.

### 2. Tipografia bold + tracking tight nas headlines
- **Onde funciona**: lobby "Jay Academy" tracking `-0.04em`, semibold
- **Regra**: Inter ou Plus Jakarta semibold/bold. Nunca serif. Nunca italic.

### 3. Tabela/grid de projetos com colunas fixas
- **Onde funciona**: dashboard "Projetos recentes" com cols Nome / Tipo / Status / Última edição
- **Por quê**: scanneable, Vercel-like, profissional

### 4. Status badges pílula com dot + ring
- **Padrão**: `bg-emerald-500/10 ring-emerald-500/25 text-emerald-300` + dot `bg-emerald-400`
- **Por quê**: limpo, profissional, padrão SaaS moderno

### 5. Auth real (não mock)
- **Sistema atual**: JWT + bcryptjs + cookie httpOnly
- **3 roles**: senior (James hardcoded `suporte@jamesolaya.com.br`), admin, viewer
- **Senior é exclusivo** — único que pode gerenciar usuários
- **Por quê**: James pediu sistema real desde cedo, queria poder dar acesso pra equipe

### 6. Editor inline com contentEditable
- **Onde funciona**: `/wp-pages/[domain]/[slug]/edit` — edita texto direto no HTML da página WP
- **Image replace via modal** com upload ou URL
- **Salvamento via Server Action** no JSON
- **Por quê**: queria editar sem precisar mexer no WordPress original

### 7. Modais de confirmação inteligentes
- **Onde funciona**: "Copiar agora" no /wordpress — detecta se já tem cópias e oferece "copiar só novas" vs "recopiar todas"
- **Por quê**: não toma decisão por ele, mas evita fricção

### 8. ⌘K search global
- **Quote**: queria poder navegar rápido entre LPs e WP pages
- **Atalho**: Cmd+K / Ctrl+K abre modal de busca
- **Busca em**: landingPages + páginas WP por nome/slug

### 9. Activity feed lateral (só admin/senior)
- **Onde**: aside direita do dashboard, lista últimas 15 ações
- **Por quê**: sente que o sistema tá vivo, log natural de ações da equipe

### 10. Empty states claros
- **Padrão**: ícone + texto "Sem X ainda. [ação sugerida]."
- **Onde**: tabela de projetos vazia, deploys feed, activity feed
- **Por quê**: não deixa página parecer bug

### 11. EditableGreeting no dashboard
- **O quê**: "Bom dia, [nome]" — clica no nome edita inline
- **Por quê**: personalização sutil, sente que é dele

### 12. Persistência local em JSON (`data/`)
- **Estrutura**: `data/wp-content/[domain]_[slug].json`, `data/wp-decisions.json`, `data/lps_all.json`, `data/users.json`
- **Gitignored** pra não vazar dados
- **Por quê**: rápido, sem dependência de DB externo, dá pra inspecionar manualmente

---

## ❌ O que NÃO funciona / foi REJEITADO

### 1. Misturar DNA de LP com portal admin
- **Quando deu errado**: tentar usar gradient pink→orange nos botões do portal
- **Regra**: portal é SaaS sóbrio, gradient só nas LPs comerciais

### 2. Light mode / cores claras
- **Quote**: nunca aceitou propostas com fundo claro
- **Regra**: dark mode sempre no portal

### 3. Tipografia decorativa (Fraunces serif, italic)
- **Por quê**: quebra o tom profissional do admin
- **Regra**: só Inter/Plus Jakarta. Sem serif. Sem italic.

### 4. Esquecer mobile do portal
- Mesmo sendo ferramenta desktop, **precisa funcionar no mobile** (responsivo básico)
- Sidebar vira drawer, stats em 1 col, tabelas com scroll horizontal

### 5. Não verificar estado real antes de assumir
- **Quote (2026-06-01)**: *"ja fizemos tudo isso, não foi salvo nosso ultimo progresso"*
- **Regra**: SEMPRE checar código real antes de dizer "vamos fazer X" — features podem já existir
- **Solução adotada**: este sistema de notas + `progresso-atual.md` atualizado a cada sessão

### 6. Páginas WP sem CSS/imagens
- **Quando deu errado**: primeira versão da cópia WP pegava só o `content` do editor REST API
- **Fix**: criou `fullHtml` que pega HTML público completo (com CSS+imagens inline)
- **Regra**: sempre testar visualmente o preview de uma página copiada

### 7. Hot reload do Next.js sendo confiável demais
- **Bug recorrente**: `revalidatePath` às vezes não atualiza o browser
- **Workaround**: F5 manual
- **Bug recorrente 2**: IDE diagnostics ficam stale depois de Edit. "Cannot find name X" pode ser cache — verificar com Read antes de mexer

---

## 🧭 Bússola pra decisões rápidas no portal

Quando estiver em dúvida, pergunta:

1. **"Combina com Vercel/Linear/Notion dashboard?"** → Bom sinal
2. **"Tem cor desnecessária?"** → Provavelmente tirar (admin = neutro)
3. **"Daria pra usar isso numa LP comercial?"** → Se sim, NÃO use no portal
4. **"Vai me ajudar a controlar e ver tudo num lugar?"** → Bom sinal
5. **"Os 3 roles (senior/admin/viewer) veem isso da forma certa?"** → Sempre checar
6. **"Atualizei `progresso-atual.md`?"** → Antes de fechar sessão, SIM

---

## 🆕 Histórico de feedback (cronológico)

### 2026-05-27 (sessão tarde)
- Aprovou: sidebar colapsável, dashboard organizado, triagem WP em 2 blocos
- Pediu: modal inteligente pra "Copiar agora" (não copiar tudo cego)
- Pediu: feature pausada por créditos → editor inline pra páginas WP

### 2026-05-28
- Decidiu pausar implementação de features → focar primeiro no LAYOUT
- Aprovou backlog priorizado: Auth Clerk → Status drafts → Duplicar → ⌘K

### Entre 2026-05-28 e 2026-06-01 (sessões não documentadas — RECUPERADAS via inspeção do código)
- Implementou auth próprio (não Clerk) com JWT + bcryptjs + 3 roles
- Implementou editor visual `/lps/[slug]/edit-visual`
- Implementou editor WP inline `/wp-pages/.../edit` com image replace modal
- Implementou search modal ⌘K
- Implementou activity log lateral
- Implementou sistema de forms (`/forms`, `/forms/new`, `/forms/[id]`, public `/f/[slug]`)
- Implementou sistema de sugestões (`/sugestoes`)
- Implementou lixeira (`/lixeira`) com trashed flag
- Implementou rotas públicas `/laser`, `/magicshadow`, `/p/[slug]`
- 18 páginas WP copiadas
- ⚠️ **Não foi salvo nas notas** → motivação pra criar este sistema

### 2026-06-01
- Pediu **sistema de memória inteligente** pra nunca mais perder progresso
- Pediu **base de conhecimento de gostos/aversões** estilo `feedback-cliente` do PMU CLASS
- **Adotado**: este conjunto de notas + regra de atualizar `progresso-atual.md` por sessão
