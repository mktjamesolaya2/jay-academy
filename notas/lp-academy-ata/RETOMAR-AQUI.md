# 🔖 RETOMAR AQUI — LP Academy, ajustes da ata

> Pasta criada em **2026-08-04** pra não perder o fio quando a conversa acabar.
> Se você é o Claude chegando agora: **lê este arquivo inteiro antes de mexer em nada.**

**Arquivo:** `portal/lp-html/academy.html` · **Roda em:** `localhost:4000/academy`
**Contexto vivo do projeto:** `portal/notas/progresso-atual.md`

---

## ✅ ESTADO: commitado, mas **NÃO pushado** (05/08)

Branch `lp-academy-deploy`, **4 commits à frente de `origin/main`**:
1. `fix(academy): registra a LP no dashboard` (vinha de antes)
2. `feat(academy): ajustes da ata 04/08 (fase 1 desktop)`
3. `feat(academy): dobra 0 — abertura em lettering + hero volta ao titulo original`
4. `feat(academy): fotos coloridas de aula de verdade na dobra 3`

⚠️ **O push não foi possível: `.env.local` não existe mais nesta máquina**, e é lá que
mora o PAT `token_mktjamesolaya2` que o `git push` precisa (a Vercel só injeta as envs de
produção quando o autor é o dono — ver "Pegadinhas" no `CLAUDE.md`). Sem o arquivo o push
fica pendurado esperando credencial. Recriar `.env.local` com o PAT e então:

```
git push "https://mktjamesolaya2:$PAT@github.com/mktjamesolaya2/jay-academy.git" HEAD:main
```

---

## ✅ Já feito

### Fase 1 — desktop (04/08)

| # | Item | Como ficou |
|---|------|-----------|
| 3 | Cards das formações clicáveis | Camada invisível sobre o card, a partir do próprio `.card__cta` — **um link só**, sem aninhar `<a>`, pra não quebrar leitor de tela |
| 4 | Depoimentos em cards | Cartão branco com sombra na lâmina clara; o nome preso no rodapé por filete, então os quatro alinham por baixo |
| 5 | Negrito na "seção de evolução" | Aplicado na dobra **`#academy`** — é a única cujo texto fala em "sua evolução". ⚠️ Interpretação minha, o James ainda não confirmou se era essa |
| 6 | "Você não aprende apenas uma técnica" (`#metodo`) | Colunas aproximadas, título em 22ch, bloco centrado no eixo do retrato |

### 05/08

| # | Item | Como ficou |
|---|------|-----------|
| 1 | Título da hero desfeito | Voltou pra **"Micropigmentação de alto nível"** |
| 2 | **Tela de abertura em lettering** (dobra 0) | Lâmina preta de 220vh antes da hero. Ver decisões abaixo |
| 3 | **As 3 fotos da dobra 3, agora coloridas** ⭐ | Resolvido — ver abaixo |

---

## 🎬 Dobra 0 — abertura em lettering: o que eu decidi sozinho

O James não tinha respondido três coisas. Como o workflow dele é propor e ajustar,
eu escolhi e deixei registrado — **se ele reclamar, é aqui que se mexe:**

| Pergunta | O que ficou | Por quê |
|---|---|---|
| Quebra | `BEM-VINDO À` (rótulo pequeno) / `JAY ACADEMY` (grande) | Duas linhas, como ele pediu, na hierarquia que a LP já usa (rótulo minúsculo + título) |
| Gatilho | **Conforme a rolagem** | A própria descrição dele dizia "conforme rola… crescendo até ocupar a tela toda" |
| Saída | **Desliza pra cima** (o `sticky` solta e entrega a hero) | Sem fade: fade faria o texto sumir *antes* de sair, e aí a saída deixa de ser um movimento |

**Detalhes que valem saber antes de mexer:**
- A frase **começa fantasma** (opacidade `.12`), não invisível. Tela preta vazia no
  carregamento lê como página quebrada — e hint instrucional ("role para baixo") está
  fora, é anti-padrão dele.
- As letras se **sobrepõem** na cascata (`JANELA = .30`). Sem sobreposição vira fade em
  bloco, que é outra coisa.
- O halo dourado da hero se repete fechado no centro, pra amarrar as duas dobras.
- Sem JS ou com `prefers-reduced-motion` a lâmina vira **só uma tela de título** legível,
  com 100vh em vez da corrida de 220vh (a classe `is-animada` é quem estica).
- `body { overflow-x: hidden }` **não** quebra o `sticky` aqui porque o `html` não tem
  overflow — o do body propaga pra viewport. Se alguém puser overflow no `html`, quebra.

---

## 📸 As 3 fotos da dobra 3 — RESOLVIDO

**Não eram recuperáveis no projeto:** todas as versões no git já eram cinza (saturação
0.0 / 1.1 / 6.0 desde o commit `c778578`). Não existia original colorido.

**De onde vieram as novas:** Canva, design **`DAHIKhsXzBk` — "JAY ACADEMY - TRECHOS DE
AULA"** (73 páginas de recorte de aula de verdade, colorido). Páginas usadas:

| Slot | Página | Cena | Aspecto |
|---|---|---|---|
| A sala | 1 | James apontando o conteúdo na tela, aluna em primeiro plano | 3:4 |
| A demonstração | 17 | James executando, aluna acompanhando atrás | 4:5 |
| A prática | 9 | Aluna executando em modelo real, turma ao lado | 5:6 |

**Como foram tiradas de lá:** `export-design` em JPG 1080×1920 e **corte fora da faixa
onde o Canva assenta o texto** (detectada varrendo as linhas com branco puro), já no
aspecto que cada slot pede. Acabamento leve: `brightness` 1.04–1.12, `saturation` 1.07,
`sharpen(0.8)`. **Não precisa mexer no Canva do James** — nada foi editado lá.

**Onde NÃO procurar (já vasculhado, não tem turma):**
- `DAF2sbUupQ0` (APRESENTAÇÃO FULL 2, 106 pág.) — catálogo de curso, fundo sempre a casa
- `DAHOvtt3XVA` (TELAS TV RECEPÇÃO, 28 pág.) — só resultado (antes/depois, lábios, olhos)

---

## 🔜 O QUE FAZER, NA ORDEM

### 1. O James ver o desktop e aprovar
`localhost:4000/academy`. Falta o aval dele nas três decisões da abertura (tabela acima).

### 2. Fase 2 — Mobile (só depois do desktop aprovado)
- Reorganizar a dobra da experiência (a ata chama de "seção de demonstração")
- Divisores inconsistentes entre desktop e mobile, inclusive nos cards de benefícios
- Espaçamentos, alinhamentos e centralização de blocos de texto
- Acabamento dos cards de benefícios

---

## ❓ Decisões paradas com o James

1. **Carrossel dos depoimentos** — no desktop também, ou cards no desktop e carrossel só no celular?
2. **Destino dos "Ver formação"** — WhatsApp, LP do curso ou âncora interna? Hoje vão pra `#comecar`.
3. **"Seção de evolução"** — confirmar se o negrito entrou na dobra certa (`#academy`).
4. **Abertura em lettering** — confirmar quebra, gatilho e saída (tabela lá em cima).

---

## 🗺️ Como a ata mapeia nos nomes reais do código

| Ata | Seção no HTML |
|---|---|
| "seção de demonstração" | `#experiencia` (o trio de fotos) |
| "você não aprende apenas uma técnica" | `#metodo` |
| "seção de evolução" | `#academy` *(interpretação, não confirmada)* |
| "cards de benefícios" | `.indicadores`, dentro de `#experiencia` |
| — | `.abertura` é a dobra 0, que **não** estava na ata |

---

## 🧠 Armadilhas já pagas (não repetir)

- **Não usar `Magic Shadow 3/assets/proofs`** — é material da **VOGUE**, com o logo da revista na imagem.
- **As 3 macros da dobra `#resultados`** vieram de páginas de post do Canva. **A origem nunca foi
  confirmada** — podem ser banco de imagem usado como fundo. O James disse "beleza" quando falei
  que não são IA, mas ninguém verificou se são dele.
- **Windows: não ler e gravar o mesmo caminho** com sharp — grava em arquivo temporário e renomeia,
  senão dá `UNKNOWN: open`.
- **Seletor com `#id` vence media query.** Já quebrou o mobile da dobra 7 uma vez: se criar override
  com ID, repetir o ID dentro do `@media`.
- **Variar o arranjo das mesmas peças não conta como "opção diferente"** pra ele. Se pedir algo
  diferente, mudar a lógica do bloco, não a posição das caixas.
- **Reaproveitar device antes de inventar** — `.indicadores` em colunas com filete, `.trio` escalonado,
  `.card`. Device novo costuma ser reprovado.
- **A LP usa UM filete**, nunca dois cercando um bloco (isso vira caixa, e caixa não é a linguagem).
- **Full-bleed só na hero, na abertura e no fechamento.** Toda dobra mora dentro do `.faixa`.

---

## 🛠️ Como eu conferi (dá pra repetir)

Não tem ferramenta de browser, mas o projeto tem `puppeteer-core` e o Chrome está instalado:

```
npm run dev                       # porta 4000
node <script>.mjs                 # puppeteer-core + executablePath do Chrome
```

Os scripts de screenshot que usei ficaram no scratchpad da sessão (`shot-abertura.mjs`
tira a abertura em 5 pontos da rolagem, desktop e mobile; `shot-trio.mjs` tira a dobra 3).
Se sumirem, são ~30 linhas cada.

---

## 📄 A ata original

Está em `ata-reuniao-04-08.md`, nesta mesma pasta.
