# 🎯 Perfil — James (Portal Jay Academy)

Base de pensamentos, gostos, jeitos de trabalhar e princípios estéticos do James **no contexto do portal admin**. Distinta do perfil das LPs (PMU CLASS é Netflix dark editorial — o portal é SaaS profissional).

**Sempre crescente** — atualizo conforme aprendo coisas novas.

---

## 👤 Quem é

- **Founder/criador** do PMU CLASS + Jay Academy (guarda-chuva de cursos online de micropigmentação e laser)
- **Email**: `mktjamesolaya@gmail.com` · **Login senior**: `suporte@jamesolaya.com.br`
- **Decide rápido** mas exige iteração até cair certo — não tem medo de pedir refazer 5+ vezes
- **Visão de produto + estética** ao mesmo tempo. Pensa em UX, copy e visual juntos
- **Trabalha com referências visuais primeiro** — screenshots, sketches, sites de referência

---

## 🎨 DNA estético — portal admin (DISTINTO das LPs)

> ⚠️ **CRÍTICO**: não misturar com o DNA das LPs PMU CLASS. As LPs são streaming/Netflix dark com gradient pink→orange. O portal é SaaS profissional, sóbrio, escuro mas neutro.

### Aesthetic core
- **SaaS profissional moderno** (referências: Vercel dashboard, Linear, Notion, Adminex)
- **Dark mode neutro** — preto + cinzas, accent branco
- **Funcional > decorativo** — informação dense, scannable, rápida
- **Sem gradientes coloridos nas letras** (deixa pras LPs)
- **Bordas finas, cantos arredondados, espaçamento generoso**

### Paleta sagrada do portal
- Background app: **`#0a0a0a`**
- Surface (cards/painéis): **`#0d0d0d`** ou **`#0f0f0f`**
- Border: **`#1f1f1f`** (sutil)
- Hover surface: **`#101010`** / **`#121212`** / **`#161616`**
- Texto principal: **`white`**
- Texto secundário: **`text-neutral-300`** / **`text-neutral-400`**
- Texto muted: **`text-neutral-500`** / **`text-neutral-600`**
- Accent primário: **branco sólido** (botões primary = `bg-white text-black`)
- Accent funcional por tipo:
  - Sucesso/published: `emerald-400/300` com bg `emerald-500/10` ring `emerald-500/25`
  - Atenção/draft: `amber-400/300`
  - Erro/error: `rose-400/300`
  - Info/deploy: `sky-400/300`
  - Destaque cards: `violet-300/500` (sutil, usado em StatCards)
- Acentos por LP (cor de cover): `pink→orange` (PMU CLASS), `gold-black` (Magic Shadow), `rose` (Laser)

### Tipografia
- **Headlines do portal**: `Plus Jakarta Sans` ou `Inter` — semibold/bold, tracking tight (`-0.02em` a `-0.04em`)
- **Body / UI**: `Inter`
- **Mono** (URLs, slugs): `font-mono`
- **NUNCA** usar serif (Fraunces) no portal — isso é coisa das LPs
- **NUNCA** italic
- **NUNCA** gradient text no portal

### Componentes recorrentes
- **Cards**: `bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl` ou `rounded-2xl`
- **Botão primary**: `bg-white text-black` + hover sutil
- **Botão ghost**: `bg-[#161616] border border-[#1f1f1f] text-neutral-300 hover:text-white hover:border-neutral-700`
- **Status badges**: pílula com `ring-1` + dot colorido + label uppercase tracking
- **Eyebrow em seções**: `text-[10px] uppercase tracking-[0.12em] text-neutral-600 font-semibold`

---

## ✅ O que ATRAI ele no portal admin

| Padrão | Por que funciona |
|---|---|
| **Dashboard denso com stats no topo** | Visão geral instantânea, "consigo controlar" |
| **Tabela/grid de projetos com status colorido** | Scanneable, profissional, Vercel-like |
| **Sidebar com lista colapsável de LPs** | Hierarquia clara, fica fora do caminho |
| **Activity feed lateral** | Sente que o sistema está vivo, log de ações |
| **⌘K search global** | Velocidade de power-user |
| **Editor inline (contentEditable)** | Edição rápida sem sair do contexto |
| **Auth real com roles** | Profissionalismo, pode dar acesso pra equipe |
| **Persistência em JSON local + KV** | Confia mais do que ferramenta externa |
| **Botão "Voltar pro dashboard" sempre visível** | Não fica preso em rota interna |
| **Loading spinners em Server Actions** | Feedback de que tá fazendo algo |
| **Modais de confirmação inteligentes** (recopiar/copia nova) | Não toma decisão por ele |
| **Status badges (draft/published/archived)** | Profissional, claro |

---

## ❌ O que ele REJEITA no portal (RED FLAGS)

| Anti-padrão | Por que ele odeia |
|---|---|
| **Cores vibrantes pulando em tudo** | "Cara de Bootstrap genérico" |
| **Gradientes pink→orange no portal** | É marca das LPs, não do admin |
| **Layout com tons brancos/claros (light mode)** | Quer dark sempre — projeto inteiro |
| **Tipografia decorativa (serif/italic)** | Quebra o tom de ferramenta profissional |
| **Texto cinza claro demais em fundo escuro** | Sem contraste, ilegível |
| **Botões grandes coloridos onipresentes** | Cara de marketing, não de admin |
| **Modais bloqueantes sem necessidade** | Atrapalha fluxo |
| **Ícones genéricos demais (emoji, FontAwesome)** | Quer Lucide consistente |
| **Páginas vazias sem empty state** | Confunde, parece bug |

---

## 🗣️ Vocabulário / padrões de feedback

| Quote típica | Significado | Como reagir |
|---|---|---|
| *"ta ruim"* / *"ficou pessimo"* | Rejeição forte | Refazer com abordagem diferente, não ajustar |
| *"não esta me agradando"* | Rejeição explicável | Pergunta o porquê + propõe alternativas |
| *"gostei mas..."* | Aprovado, ajuste pequeno | Tweak específica |
| *"perfeito"* / *"ficou bom"* | Aprovado, segue | Marca done + próximo |
| *"vamos para a próxima"* | Aprovação tácita | Pula pra próxima |
| *"use sua inteligência"* | Autonomia total | Toma iniciativa, propõe direção |
| *"é a mesma coisa"* | Não percebeu diferença | Aumenta contraste/efeito |
| *"ja fizemos isso"* | Memória desatualizada | Inspeciona estado real antes de assumir |

---

## 🛠️ Workflow / jeito de trabalhar

### Sim
- **Iterativo e ágil** — não tem medo de pedir 5-7 versões da mesma tela
- **Visual-first** — prefere ver do que ler descrição
- **Mobile sempre harmônico com desktop** — mesmo em portal admin, checa mobile
- **Lê as notas** — abre arquivos no IDE, então o que escrever AQUI ele consome
- **Adiciona arquivos manualmente** — avisa "adicionei XXX, use"
- **Propõe e ajusta** — gosta quando proponho direção em vez de perguntar demais
- **Mas APRESENTA opções quando inseguro** — usa `AskUserQuestion` com previews quando faz sentido

### Não
- Perguntas demais antes de codar
- Refactors/cleanups que ele não pediu
- Documentação prolixa fora das `notas/`
- Repetir mesma feature sem checar se já foi feita (regra nova: SEMPRE atualizar `progresso-atual.md`)

---

## 🧬 Princípios do portal — padrões já validados

### Layout geral
- Sidebar fixa à esquerda (`w-64`-ish), sticky
- Main content `flex-1` com `px-8 py-8 space-y-8`
- Aside direita opcional (activity feed) — só pra admin/senior
- Topbar com search, breadcrumbs, user menu

### Stats no dashboard
- Grid 2 colunas (mobile-friendly)
- Cards com label, valor grande (`text-3xl font-bold`), delta pequeno embaixo, ícone tintado no canto

### Tabelas/listas
- Header com `text-[10px] uppercase tracking-[0.12em] text-neutral-600 font-semibold`
- Linhas com `border-b border-[#161616]` (sutil)
- Hover row: `hover:bg-[#101010]`
- Click linha inteira navega (não só o texto)

### Botões
```jsx
// Primary
<button className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-black hover:bg-neutral-100">

// Ghost
<button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#161616] border border-[#1f1f1f] hover:border-neutral-700 hover:text-white text-neutral-300">
```

### Status badges
```jsx
<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 bg-emerald-500/10 text-emerald-300 ring-emerald-500/25">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
  Publicado
</span>
```

---

## 📱 Mobile no portal

- Mobile NÃO é prioridade primária do portal admin (James usa desktop pra editar) — mas precisa funcionar
- Sidebar vira drawer no mobile
- Stats vira 1 coluna
- Tabelas com scroll horizontal OK
- **Editor visual NÃO precisa ser mobile-friendly** (admin trabalha sentado)

---

## 🔮 Pra projetos futuros relacionados

### Quando criar novo sub-projeto sob `jayacademy.com.br`
1. Registrar em `lib/landing-pages.ts` com tipo correto (website/lp/form)
2. Definir `accent` (cor da capa) que combine com o tema
3. Adicionar `localPath`, `devUrl`, `productionUrl`
4. Sub-projeto roda em porta dev própria (3001, 5500, 8080...)
5. Path-based routing em produção (`/pmuclass`, `/laser`, `/magicshadow`)
6. Documentar em `historico-decisoes.md`

### Quando adicionar funcionalidade ao portal
- Sempre dark mode (`#0a0a0a` base)
- Sempre Lucide icons (consistente)
- Sempre Plus Jakarta/Inter (nunca serif)
- Sempre dar feedback de loading nas Server Actions
- Sempre ter estado vazio decente (não mostrar lista vazia sem explicação)
- Sempre testar como senior, admin E viewer (3 roles)

---

> **Esta nota é viva** — atualizo conforme aprendo. Quando aparecer um padrão novo de preferência ou rejeição, adiciono aqui.
