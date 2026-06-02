# 📝 Notas do Portal Jay Academy

> Base de conhecimento viva do portal `jayacademy.com.br`. Toda decisão importante, padrão validado, ideia, feedback do James vai aqui.
>
> **Regra de ouro**: a cada sessão de trabalho, atualizar `progresso-atual.md` antes de fechar. Nunca mais perder estado.

---

## 📂 Estrutura

### 🧠 Base de conhecimento (cresce com o tempo)

- **[perfil-james.md](./perfil-james.md)** ⭐ — Quem é, como pensa, princípios estéticos do portal admin (distintos das LPs), workflow, vocabulário
- **[feedback-cliente.md](./feedback-cliente.md)** — Padrões aprendidos do que ele gosta/odeia no contexto portal admin
- **[ideias-inspiracoes.md](./ideias-inspiracoes.md)** — Ideias que ele teve mas ainda não implementamos, referências visuais, conceitos guardados
- **[historico-decisoes.md](./historico-decisoes.md)** — Log de decisões tomadas com motivação. Por que escolhemos X em vez de Y.

### 🚦 Estado atual (atualizado sempre)

- **[progresso-atual.md](./progresso-atual.md)** ⭐ — Estado vivo do portal. **Atualizar ao fim de cada sessão.** Substitui handoffs.
- **[backlog-proximos-passos.md](./backlog-proximos-passos.md)** — O que tá na fila, ordenado por prioridade
- **[projeto-apresentacao-pmu.md](./projeto-apresentacao-pmu.md)** — Apresentação interativa do PMU CLASS em `/apresentacao-pmu`

### 📜 Histórico (não tocar)

- **[handoff-2026-05-27.md](./handoff-2026-05-27.md)** — Snapshot da primeira sessão grande
- **[backlog.md](./backlog.md)** — Backlog antigo (substituído por `backlog-proximos-passos.md`)

---

## 🎯 Sobre o projeto

**Portal `jayacademy.com.br`** — painel admin que orquestra todas as LPs/sites do James (PMU CLASS, Magic Shadow, Jayo Laser, etc.) + importa e edita o conteúdo legado do WordPress.

**Localização**: `c:\Users\Suporte\Desktop\jayacademy\portal\`

**Stack**: Next.js 16 App Router · React 19 · Tailwind v4 · TypeScript · JWT auth (bcryptjs + jose) · KV storage local (`data/`)

**Porta dev**: `4000` (`pnpm dev` no portal/)

---

## 🧭 Como usar essas notas

1. **Antes de codar** — abre `perfil-james.md` + `feedback-cliente.md` pra revisitar padrões
2. **Antes de propor algo** — checa `ideias-inspiracoes.md` (talvez já existe a ideia) + `historico-decisoes.md` (talvez já rejeitamos)
3. **Ao fim da sessão** — atualiza `progresso-atual.md` com o que foi feito + estado atual
4. **Quando aprender algo novo** — adiciona no arquivo correspondente. Estas notas são VIVAS, crescem sempre.

---

> **Por que essas notas existem?** Porque já perdemos progresso uma vez. Nunca mais.
