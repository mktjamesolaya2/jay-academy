# 🔖 RETOMAR AQUI — LP Academy, ajustes da ata

> Pasta criada em **2026-08-04** pra não perder o fio quando a conversa acabar.
> Se você é o Claude chegando agora: **lê este arquivo inteiro antes de mexer em nada.**

**Arquivo:** `portal/lp-html/academy.html` · **Roda em:** `localhost:4000/academy`
**Contexto vivo do projeto:** `portal/notas/progresso-atual.md`

---

## ✅ ESTADO: commitado, mas **NÃO pushado** (05/08)

Branch `lp-academy-deploy`, **12 commits à frente de `origin/main`** (`git log origin/main..HEAD`).
Do mais antigo pro mais novo: registro da LP no dashboard → fase 1 da ata → abertura em
lettering → fotos coloridas → correção da abertura (sem scroll) → degradê da emenda →
troca das fotos por ensaio → página de comparação da "A sala".

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

## 🎬 Dobra 0 — abertura em lettering

### ⛔ A primeira versão foi REPROVADA — não refazer assim

Eu tinha amarrado a animação ao scroll: 220vh de corrida, `sticky`, e a escala do bloco
seguindo a posição da rolagem. O James:

> *"ficou meio bugado essa tela de inicio… não é para ser uma intro, é como se fosse uma
> hero msm, eu estou tentando passar o mouse e está dando zoom"*

Dois problemas: qualquer roçada na roda mexia no **tamanho** da frase, e a lâmina **comia
duas telas de rolagem** antes da hero. **Regra que sai daqui: nesta LP, animação não é
pilotada por scroll.** Entrada acontece uma vez e acaba.

### ✅ Como ficou

| Pergunta | O que ficou |
|---|---|
| Quebra | `BEM-VINDO À` (rótulo pequeno) / `JAY ACADEMY` (grande) — a hierarquia que a LP já usa |
| Gatilho | **Sozinho ao carregar** (~1,9s até a frase inteira acesa) |
| Saída | Não tem saída: é uma **tela de 100vh** e a página rola normal por cima |

**Detalhes que valem saber antes de mexer:**
- `.abertura` tem **100vh cravado** — o topo da hero é exatamente a altura da viewport.
  Conferido em 1440 e 390.
- **Zero listener de scroll.** O JS só quebra as linhas em letras e carimba o
  `animation-delay`; quem anima é o CSS (`letra-acende`, `bloco-cresce`, `halo-abre`).
- O "crescer até tomar a tela" virou `scale(.88) → 1` **na entrada, uma vez**.
- As letras se **sobrepõem**: .045s de atraso entre elas contra .72s de animação. Sem
  sobreposição vira fade em bloco, que é outra coisa. **É esse `.045` que se mexe se
  ele achar longo demais.**
- A frase parte de opacidade `.12` (fantasma), não de zero — e hint instrucional
  ("role para baixo") está fora, é anti-padrão dele.
- O halo dourado da hero se repete fechado no centro, pra amarrar as duas dobras.
- `prefers-reduced-motion` desliga as três animações e a frase já aparece pronta.

### A emenda com a hero (pedido do James, 05/08)

Dava uma **linha horizontal** na divisão das duas dobras: a abertura é preto chapado
(`#050403`) e o topo da hero já entra no morno do halo. Medido no desktop: `rgb(5,4,3)`
virava `rgb(14,11,7)` de um pixel pro outro.

Agora as duas se encontram no meio do caminho — **véu dos dois lados** (`.abertura::after`
esquenta descendo, `.hero::before` escurece subindo), calibrados pra fechar no mesmo tom.

⚠️ **Os números são diferentes no celular.** Lá a hero é foto sangrada com scrim e o topo
dela fica em `rgb(6,5,4)`, quase o mesmo preto da abertura — sem morno nenhum. Com os
valores do desktop a abertura ia pra 11 contra 6 da hero e a linha **voltava, ao
contrário**. Por isso existe um override dentro do `@media (max-width: 768px)`.

**Se mexer no fundo da hero ou da abertura, remedir.** O jeito: puppeteer + amostrar a
coluna central e a borda a cada poucos px em volta da emenda; enquanto a sequência não
tiver degrau maior que ~1, está limpo (o ±1 é dithering do Chrome, não erro).

---

## 📸 As 3 fotos da dobra 3 — RESOLVIDO (na 2ª tentativa)

**Não eram recuperáveis no projeto:** todas as versões no git já eram cinza (saturação
0.0 / 1.1 / 6.0 desde o commit `c778578`). Não existia original colorido.

### ⛔ 1ª tentativa reprovada: frame de vídeo

Usei o design `DAHIKhsXzBk` "JAY ACADEMY - TRECHOS DE AULA" (73 recortes de aula). São
coloridos e são aula de verdade, **mas são frames de vídeo**. O James:

> *"não gostei das imagens, achei que faltou qualidade nela e ficaram com muitos pixels"*

Frame de vídeo já nasce mole e comprimido (teto de 1080 de largura), e ainda estava sendo
**ampliado** pra encher o card, que renderiza a ~910px em tela retina. **Regra que sai
daqui: cortar no aspecto do slot e REDUZIR até a resolução real do arquivo. Nunca
entregar upscale.**

### ✅ O que ficou: foto de ensaio profissional

Design **`DAHAkyAhyOI` — "[JÚLIA] JAYO ACADEMY - PROVA SOCIAL ALUNOS"**. As páginas têm
tarja de comentário do Instagram por cima, então:

1. `copy-design` das páginas 1, 3, 8 e 11 → cópia **`DAHRbRpyTkU`**
2. `edit-design` apagando tarja + texto + logo em cada página da cópia
3. `export-design` em 2160×2700 e corte/redução no aspecto do slot

**O design original do James NÃO foi tocado.** A cópia está no Canva dele com o nome
**"TEMP - fotos limpas p/ LP Academy (pode apagar)"** — pode ser apagada à vontade.

| Slot | Página da cópia | Cena | Saída |
|---|---|---|---|
| A sala | 2 | James de microfone auricular na bancada, duas alunas treinando atrás | 1100×1467 (3:4) |
| A demonstração | 1 | James executando sob softbox, turma em primeiro plano assistindo | 1000×1250 (4:5) |
| A prática | 3 | Aluna de máscara e luva azul executando em modelo real | 1050×1260 (5:6) |

A página 4 da cópia (`JAY-VOGUE-CONCEITO-70.jpg`, **4000×5910** — a turma inteira reunida
em volta, com a vidraça da casa ao fundo) ficou de reserva.

### ⏳ "A sala" ainda em escolha

O James: *"da sala, eu gostei dessa, porém eu acho q tem melhores, da uma olhada"*.

Achei o **filão bom**: o design irmão **`DAHE-SWJM00` "[JÚLIA] 02 ... PROVA SOCIAL ALUNOS"**
usa o ensaio profissional das turmas — arquivos `LIPSSENSE-04-2026-*.jpg`,
`vogue-01-2026-*.jpg`, todos em **4000×6000**. É a melhor fonte de foto de turma do acervo.
Mesmo procedimento: cópia (**`DAHRbggohco`**, renomeada "TEMP 2 - fotos de turma p/ LP
Academy (pode apagar)") → apagar tarjas → exportar em 4320×5400.

Quatro opções cortadas em 3:4 e uma página de comparação:
**`localhost:4000/lp/academy/opcoes-sala.html`** (fonte em `public/lp/academy/opcoes-sala/`).

| | Cena | Original |
|---|---|---|
| Atual | bancada, James de microfone auricular, duas alunas atrás | 2000×1333 |
| A | turma inteira em volta da maca | 4000×6000 |
| B | quatro alunas de crachá sob o ring light — **a minha aposta** | 4000×6000 |
| C | mesma cena da A, instante mais aberto | 3856×5784 |
| D | plano fechado, James + uma aluna, telão atrás | 4000×6000 |

**Quando ele escolher:** copiar a escolhida de `opcoes-sala/` pra
`public/lp/academy/reais/sala-aula.jpg`, atualizar o `alt` na dobra `#experiencia` e
**apagar a pasta `opcoes-sala/`** — ela é andaime, não pode ir pro deploy definitivo.

**Onde NÃO procurar (já vasculhado, não tem turma):**
- `DAF2sbUupQ0` (APRESENTAÇÃO FULL 2, 106 pág.) — catálogo de curso, fundo sempre a casa
- `DAHOvtt3XVA` (TELAS TV RECEPÇÃO, 28 pág.) — só resultado (antes/depois, lábios, olhos)
- `DAGKGpYp-6c` (ABERTURA, 17 pág.) — só fundo gráfico vermelho/coluna grega
- `public/lp/jamesolaya/` (espelho do site) — as grandes coloridas são a casa e produto;
  as de aula ali são exatamente as cinzas
- **Google Drive**: o conector está sem escopo ("insufficient authentication scopes")

⚠️ **Cuidado com banco de imagem.** Várias páginas desses designs usam stock, não foto da
casa. Dá pra separar pelo nome do asset em `get-assets`: `IMG_0416.jpg`,
`JAY-VOGUE-CONCEITO-70.jpg`, `1.png` = da casa; `beautiful-young-woman-going-through-
microblading-treatment.jpg`, `fpkdl.com_960_...` = stock.

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
4. **Abertura em lettering** — a 2ª versão (tela de 100vh, escrita ao carregar) ainda não
   foi vista por ele. Confirmar se o ritmo da escrita está bom.

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
- **Nada de animação pilotada por scroll.** Escala/opacidade seguindo a rolagem lê como bug
  pra ele ("está dando zoom") e ainda rouba rolagem. Entrada acontece uma vez e acaba.
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
