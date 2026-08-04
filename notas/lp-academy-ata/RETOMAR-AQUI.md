# 🔖 RETOMAR AQUI — LP Academy, ajustes da ata

> Pasta criada em **2026-08-04** pra não perder o fio quando a conversa acabar.
> Se você é o Claude chegando agora: **lê este arquivo inteiro antes de mexer em nada.**

**Arquivo:** `portal/lp-html/academy.html` · **Roda em:** `localhost:4000/academy`
**Contexto vivo do projeto:** `portal/notas/progresso-atual.md`

---

## ⚠️ ESTADO: nada disso está commitado

As mudanças de 04/08 estão **só no arquivo local**. Se algo se perder, é aqui que dói.
Antes de qualquer coisa nova, vale commitar o que já existe.

---

## ✅ Já feito (Fase 1 — desktop)

| # | Item | Como ficou |
|---|------|-----------|
| 3 | Cards das formações clicáveis | Camada invisível sobre o card, a partir do próprio `.card__cta` — **um link só**, sem aninhar `<a>`, pra não quebrar leitor de tela |
| 4 | Depoimentos em cards | Cartão branco com sombra na lâmina clara; o nome preso no rodapé por filete, então os quatro alinham por baixo |
| 5 | Negrito na "seção de evolução" | Aplicado na dobra **`#academy`** — é a única cujo texto fala em "sua evolução". ⚠️ Interpretação minha, o James ainda não confirmou se era essa |
| 6 | "Você não aprende apenas uma técnica" (`#metodo`) | Colunas aproximadas, título em 22ch, bloco centrado no eixo do retrato |
| — | Fotos da dobra 3 | Restauradas pra versão anterior ao meu tratamento + `median(3)` pra reduzir ruído. **Melhorou pouco** — ver pendência 3 |

---

## 🔜 O QUE FAZER, NA ORDEM

### 1. Desfazer o título da hero
Voltar de "Bem-vindo à Jay Academy" para **"Micropigmentação de alto nível"**.
Foi trocado pela ata, mas o James mudou de ideia — o boas-vindas vai virar tela de abertura (item 2).

### 2. Tela de abertura em lettering (NOVO)
Antes da hero: **tela preta**; conforme rola, **"Bem-vindo à Jay Academy"** aparece em efeito
lettering, crescendo até ocupar a tela toda. **No máximo 2 linhas.** Depois dela vem a hero.

⚠️ **Três coisas que o James ainda não respondeu** (perguntar antes de codar):
- **Quebra:** "BEM-VINDO À" / "JAY ACADEMY"?
- **Gatilho:** escreve conforme a rolagem, ou sozinho ao carregar?
- **Saída:** desliza pra cima revelando a hero, ou some em fade?

### 3. Trocar as 3 fotos da dobra "Aprenda onde a técnica acontece" ⭐
**É o item mais cobrado — o James pediu 4 vezes.**

Estão em `public/lp/academy/reais/`: `sala-aula.jpg`, `demonstracao-real.jpg`, `pratica-real.jpg`.
Ele quer **coloridas**. As atuais são P&B e granuladas.

**O que já foi investigado (não repetir):**
- Vieram do espelho do jamesolaya.com.br, em `public/lp/jamesolaya/` (img12, img27, img24)
- **Todas as versões no git já são cinza** — saturação 0.0 / 1.1 / 6.0 desde o commit `c778578`.
  Não existe original colorido no projeto. Medir de novo é perder tempo.
- O **grão** é da própria foto (sala escura, ISO alto), não é efeito de CSS. `median(3)` reduziu pouco;
  reduzir mais borra os rostos.

**➡️ Onde procurar (Canva do James):**
| Design ID | Nome | Páginas | Já visto? |
|---|---|---|---|
| `DAHOvtt3XVA` | JAY ACADEMY - TELAS TV RECEPÇÃO | 28 | 5 páginas — **tem foto colorida real** (sat 41 a 97), mas as vistas são de resultado, não de turma |
| `DAF2sbUupQ0` | JAY ACADEMY - APRESENTAÇÃO FULL 2 | 106 | não |
| `DAHCQAi9Y8Q` | JAYO ACADEMY - CARROSSEL CURSOS 2026 | 74 | não |

Se não achar turma colorida, a alternativa é trocar por outra imagem real que faça sentido —
mas **não** repetir as fotos da casa (fachada/lounge/sala), que já estão na dobra `#academy`.

### 4. Fase 2 — Mobile (só depois do desktop aprovado)
- Reorganizar a dobra da experiência (a ata chama de "seção de demonstração")
- Divisores inconsistentes entre desktop e mobile, inclusive nos cards de benefícios
- Espaçamentos, alinhamentos e centralização de blocos de texto
- Acabamento dos cards de benefícios

---

## ❓ Decisões paradas com o James

1. **Carrossel dos depoimentos** — no desktop também, ou cards no desktop e carrossel só no celular?
2. **Destino dos "Ver formação"** — WhatsApp, LP do curso ou âncora interna? Hoje vão pra `#comecar`.
3. **"Seção de evolução"** — confirmar se o negrito entrou na dobra certa (`#academy`).

---

## 🗺️ Como a ata mapeia nos nomes reais do código

| Ata | Seção no HTML |
|---|---|
| "seção de demonstração" | `#experiencia` (o trio de fotos) |
| "você não aprende apenas uma técnica" | `#metodo` |
| "seção de evolução" | `#academy` *(interpretação, não confirmada)* |
| "cards de benefícios" | `.indicadores`, dentro de `#experiencia` |

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
- **Full-bleed só na hero e no fechamento.** Toda dobra mora dentro do `.faixa`.

---

## 📄 A ata original

Está em `ata-reuniao-04-08.md`, nesta mesma pasta.
