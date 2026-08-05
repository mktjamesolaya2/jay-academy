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

| Slot | Origem | Cena | Saída |
|---|---|---|---|
| A sala | `DAHRbggohco` p.3 (`LIPSSENSE-04-2026-9.jpg`, 3856×5784) | A turma em volta da maca acompanhando o procedimento — **escolha do James entre 4 opções (a "C")** | 1400×1867 (3:4) |
| A demonstração | `DAHRbRpyTkU` p.1 (`IMG_0416.jpg`, 2000×1333) | James executando sob softbox, turma em primeiro plano assistindo | 1000×1250 (4:5) |
| A prática | `DAHRbRpyTkU` p.3 (`1.png`, 1080×1440) | Aluna de máscara e luva azul executando em modelo real | 1050×1260 (5:6) |

⚠️ A legenda de "A sala" foi reescrita junto: falava em "bancadas montadas", que era a
foto anterior. Descrever o que não está no quadro é o tipo de desleixo que ele nota.
**Trocou a foto, relê a legenda.**

A página 4 da cópia (`JAY-VOGUE-CONCEITO-70.jpg`, **4000×5910** — a turma inteira reunida
em volta, com a vidraça da casa ao fundo) ficou de reserva.

### ✅ "A sala" — escolhida (a "C")

O James: *"da sala, eu gostei dessa, porém eu acho q tem melhores, da uma olhada"*. Depois:
*"gostei da opção C"*.

**O filão bom das fotos de turma** é o design irmão **`DAHE-SWJM00` "[JÚLIA] 02 ... PROVA
SOCIAL ALUNOS"**: usa o ensaio profissional das turmas — `LIPSSENSE-04-2026-*.jpg`,
`vogue-01-2026-*.jpg`, todos em **4000×6000**. É a melhor fonte do acervo; guardar isso.
Mesmo procedimento: cópia (**`DAHRbggohco`**, "TEMP 2 - fotos de turma p/ LP Academy (pode
apagar)") → apagar tarjas → exportar em 4320×5400.

Mostrei quatro opções numa página de comparação (`public/lp/academy/opcoes-sala*`), no 3:4
e na lâmina clara da dobra. Ele escolheu a **C** — a turma em volta da maca num instante
mais aberto, com uma aluna filmando. **O andaime já foi apagado.**

📌 **Lição sobre escolha de foto:** minha aposta era a B (alunas de crachá sob o ring light,
rostos visíveis). Ele foi na C, que é a mais **cheia** — turma toda em volta, movimento,
gente filmando. Quando o assunto é "a sala", ele quer o volume de gente e a cena
acontecendo, não o retrato bonito. Vale como parâmetro na próxima.

🗂️ **Se precisar refazer as opções:** as fotos limpas de turma estão nas páginas 1 a 4 da
cópia `DAHRbggohco`. A página de comparação é simples de reconstruir — grade de `figure`
com `aspect-ratio: 3/4` na paleta da lâmina clara.
⚠️ Página em `public/` tem que ser o **caminho do arquivo** (`.../opcoes-sala.html`); o Next
não serve `index.html` de pasta e devolve 404.

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

## 📱 Fase 2 — Mobile (05/08)

**Ferramenta:** `localhost:4000/lp/academy/preview-celular.html` — a LP de verdade
rodando dentro de um iPhone 13 (390×844), com atalho pra cada dobra, botão de recarregar
e "Tamanho real" pra alternar 1:1. O aparelho se encolhe sozinho até caber na janela;
a tela por dentro continua 390×844, então o layout não muda, só o zoom.

### ✅ Feito

| Item da ata | O que estava errado (medido) | Como ficou |
|---|---|---|
| Divisores nos cards de benefícios | Em 2 colunas o **3º item abria a fileira de baixo mas herdava filete e recuo de 2ª coluna** — entrava 18px pra dentro com uma linha vertical órfã. O **2º guardava 18px à direita** e não fechava na borda como o 4º. Sem filete entre as fileiras. Alturas 67px × 87px. | Até 1180px quem manda é a posição na fileira (ímpares abrem, pares fecham, fileira de baixo ganha filete por cima). Até 768px vira **uma coluna** com o device das `.etapa` |
| Alinhamento dos cards | `max-width: 13ch` era desenho das 4 colunas do desktop; numa coluna de 350px quebrava "Orientação / durante / sua evolução" em 3 linhas com 200px de vazio | 24ch + corpo de 17px (a base trava em 15px porque o termo em vw some nessa largura) |
| "Corrigir posição de títulos" na dobra da experiência | `.cabeca-dupla .titulo-lamina { max-width: 15ch }` prendia o título em **181px com 170px de buraco — 52% da coluna** | Trava removida no mobile; o `text-wrap: balance` resolve. Experiência foi de 3 pra 2 linhas, método de 5 pra 4, e a foto subiu pra primeira visualização |

**Varreduras que rodei (dá pra repetir):**
- Toda grade da página, procurando item que abre fileira com filete/recuo de meio de
  fileira → **nenhum defeito restante** em 390px e 900px.
- Todo bloco de texto com `max-width`, medindo quanto da coluna ele usa → **nenhum**
  abaixo de 80% por trava de desktop (os que sobram são centrados de propósito, como a
  hero, ou frases curtas).
- Ritmo vertical: todas as dobras em 58px de padding (só manifesto e fechamento em 70px,
  de propósito), `.faixa` em 20..370 em todas. **Consistente, nada a fazer.**

### ⏳ Sobrou UM item, e é decisão de desenho

"**Reorganizar a seção de demonstração para melhorar a compreensão na primeira
visualização**" (`#experiencia`). O que ainda incomoda: as três fotos empilhadas em 4:5
dão ~1.400px de imagem em fila. O trio deixa de ser lido como trio.

Não mexi porque é **mudança de desenho, não correção de defeito** — e device novo costuma
ser reprovado por ele. As saídas possíveis:
1. **Carrossel horizontal** no celular: volta a leitura de trio (a 2ª foto espia na
   borda) e corta ~900px de rolagem. É o mesmo device que a ata pede pros depoimentos.
2. **Foto menor + legenda ao lado**, virando lista: compacto, mas mata a fotografia, que
   é o ponto da dobra.
3. **Deixar como está**: a remoção da trava do título já subiu a 1ª foto pra primeira
   visualização, que era metade da queixa.

⚠️ Isso se cruza com a decisão nº 1 lá embaixo (carrossel dos depoimentos). Se ele
aprovar carrossel, vale usar o mesmo device nos dois lugares.

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
