# 🚦 Progresso atual — Portal Jay Academy

> **Estado vivo do portal.** Atualizar ao fim de CADA sessão. Substitui handoffs.
>
> **Última atualização**: 2026-08-10 — **galeria de mídia no formato do app Fotos do iPhone + imagens das LPs finalmente entrando na biblioteca (manifesto de build + sincronizar)** + **as 2 sugestões abertas da caixa de ideias resolvidas ("ver no celular" nas páginas WP + corrente de modelos da I.A do PMU CLASS) e o bug do seed que ressuscitava sugestões apagadas** + **layout N aplicado às 5 formações presenciais, com foto própria por curso (build quebra se repetir)** + 2026-08-05 — **"Ver no celular" no painel (/lps/[slug]/celular) + caixa de ferramentas scripts/ (npm run foto e cortar)** + **LP Academy: abertura em lettering (dobra 0), hero de volta ao título original e as 3 fotos da dobra 3 finalmente coloridas** + 2026-07-31 — **carrossel de resultados 4:5 sem cortes na `/fio-a-fio-realista-v2`** + **revisão mobile integral da `/fio-a-fio-realista-v2`** + **nova `/fio-a-fio-realista-v2` isolada para validação** + **rebranding público de `/basic-magic-shadow` para Shadow PRO** + **home pública em `/` e conta principal como “Administrador”** + **overflow lateral móvel corrigido na `/metodo-shadow-pro`** + **nova foto antes/depois na `/metodo-shadow-pro`** + **fórmula vertical do método na `/metodo-shadow-pro`** + **WhatsApp e oferta refinada na `/metodo-shadow-pro`** + **autoplay móvel robusto no carrossel e vídeo da `/metodo-shadow-pro`** + **novo hero responsivo da `/metodo-shadow-pro` com `Generated image 1`** + **“James Olaya” destacado no topo da seção do professor da `/metodo-shadow-pro`** + **espaçamento uniforme nos 7 pontos da ficha técnica da `/metodo-shadow-pro`** + **vídeo da ficha técnica comprimido (21 MB → 1,8 MB) + `.claude/`/`tmp/` no gitignore** + **quebra de linha no título do hero da `/metodo-shadow-pro`** + **cards e fotos da seção “Cicatrizados reais” da `/metodo-shadow-pro`** + **nova diagramação e CTA animado na oferta da `/metodo-shadow-pro`** + **carrossel da `/metodo-shadow-pro` reconstruído só com `OK_RESULTADOS`** + **certificado correto do Shadow PRO na `/metodo-shadow-pro`** + **vídeo em autoplay na ficha técnica da `/metodo-shadow-pro`** + **novas fotos nos 4 pilares da `/metodo-shadow-pro`** + **slug `/metodo-shadow-pro` + GTM-NGVQTHXT + `_fbp`/`_fbc` no CAPI** + **UX mobile da `/metodo-shadow-pro-2` (hero maior, fotos quadradas, prova subiu pro topo)** + mais prova visual na `/metodo-shadow-pro-2` (antes-e-depois + carrossel dobrado) + copy da `/basic-magic-shadow` (CTAs imperativos + fim da escassez) + GTM por página (mapa slug → container) + política de tracking por página + auditoria dos links de checkout Hotmart + Basic Magic Shadow v2 promovida ao slug oficial + auditoria do Meta Pixel + varredura de segurança**

---

## 🖼️ Sessão 2026-08-10 (parte 4) — galeria de mídia no formato do app Fotos

James: *"queria deixar essa galeria mais organizada, e as paginas que eu crio
com vc as imagens não estão subindo p ca!"* e depois *"deixa como a galeria do
iphone acho q ficaria bom"*.

## 🧭 Sessão 2026-08-11 (parte 3) — arrumando o portal + o código do CRM nas páginas

James: *"o portal tá bem bagunçado"*. E estava — três coisas concretas.

### 🐛 O bug que explicava tudo: 8 páginas sem tela nenhuma

`/lps/basic-nanofios` dava **404**. Eram **8 LPs** nessa situação — incluindo
as **4 que mais trazem lead** (NanoFios, Profissão Remove, Fio a Fio, Lips
Sense). Elas apareciam no catálogo, mas clicar não levava a lugar nenhum.

Causa: `/lps/[slug]` só olhava o KV, e as LPs de `lp-html/` não têm registro
lá — o registro delas é `lib/lp-html-registry.ts`, versionado. Agora a tela cai
no registro quando o KV não tem. **Toda página tem ficha.**

Era isto que ele descrevia como *"não tá tendo como eu adicionar a webhook, tá
meio bugado"*: não faltava o campo, faltava a TELA.

### O código do CRM mora na página

⚠️ O CRM **não entrega uma URL** — entrega um **bloco de código** (formulário +
script, ou só o script). Por isso o campo é uma caixa de texto, não um input de
URL: guardar só a URL obrigaria a gente a remontar o script na mão e quebrar
toda vez que o Lucas mudasse alguma coisa.

- `lp-form-config:<slug>` ganhou **`codigoCrm`**.
- `lib/serve-lp.ts` injeta antes de `</body>` — **por último**, pra achar o
  formulário já montado quando for a variante "só o envio".
- Bloco **"Integração do CRM"** no topo da coluna da direita em `/lps/<slug>`.
- **Saiu a lista "Webhooks das LPs" de `/leads`.** James: *"ficar colocando em
  muito lugar assim não vai dar certo"*. Agora fica na tela da própria página.

Conferido servindo a página de verdade: o código aparece no HTML, com a chave
`pk_` do Lucas, antes do `</body>`.

### Busca do topo: só página publicada

Ela listava rascunho, arquivada e página do WP não publicada. Agora filtra por
`status === "published"` e `wp.published`.

### Avisos que mentiam (o "mostra coisa que não tem")

- **"Conteúdo ainda não foi construído"** aparecia nas páginas de `lp-html/`,
  que estão no ar e com conteúdo no repositório.
- **"Criada em"** vazio nas mesmas páginas.

Os dois só aparecem quando fazem sentido.

### ⏭️ Ainda pendente do que ele pediu

- **Padronizar a tela de todas as páginas.** Hoje LP e página do WP têm telas e
  menus de ação diferentes (`lp-actions-menu` × `wp-page-actions`). O bloco do
  CRM está só na de LP — falta a de WP.
- Ele disse que ia continuar procurando mais coisa fora do lugar.

---

## 🆕 SUPORTE POR IA NO WHATSAPP — fase 1 no ar (13/08)

Ideia do James: uma IA que faz o suporte dos cursos online pelo WhatsApp, e só
chama uma pessoa quando precisa. O número de suporte é dele, hoje ligado só ao
Clint — de onde estão migrando.

**Decidido**: construir **dentro do portal** (reusa login, KV, e a cadeia de
modelos grátis do PMU CLASS), isolado numa pasta só dele. James: *"pode ser
dentro, se até já quiser criar a aba de WhatsApp do suporte lá"*.

### Fase 1 (feita) — treinar antes de conectar

`/suporte`, na barra lateral. Chat de teste de um lado, **base de conhecimento
editável** do outro. Nada conectado a WhatsApp nenhum, e a tela diz isso.

Regras no `lib/suporte-prompt.ts` (9 testes, função pura):
- **Nunca inicia conversa** — só responde.
- **Não inventa** preço, prazo, política nem link. O que não está na base vira
  "vou chamar uma pessoa". Num suporte, resposta errada com confiança é pior
  que "não sei": o aluno age em cima dela.
- **Pediu humano → a IA cala.** Marcador `[HUMANO]` na resposta do modelo, mais
  um atalho que pega o pedido explícito ANTES de gastar chamada de IA. Ela não
  volta sozinha; quem reativa é o James.

### Fases seguintes (não começadas)

2. **Conectar o número** — ⚠️ **só pela API oficial da Meta**. Biblioteca não
   oficial (Baileys/whatsapp-web.js) funciona fingindo ser o WhatsApp Web: é
   contra os termos e **bana o número**, que no caso é o dele, com histórico.
   Risco maior ainda se iniciar conversa — mas ele não vai iniciar.
3. **Caixa de entrada** no portal pra ele assumir conversa.
4. **Trocar o motor** pra OpenAI se autorizarem — é mudar endpoint e chave, o
   resto continua.

⚠️ Ele vai perguntar ao Lucas sobre a conta Meta Business.

### 13/08 — formulários apertados no celular

James: *"todos os formulários no mobile estão com um bug de layout"*.

Medido numa tela de 390px, igual em `/acao-mshadow`, `/contato-instagram` e
`/stbrows`: **os campos ficavam a 10px da borda**, colados, enquanto o texto em
volta respirava. Dá a impressão de que o formulário vazou pra fora da página.

⚠️ **O que NÃO era**: a calha negativa do Elementor (wrapper `-5px` + grupo
`padding: 5px`) parecia culpada — o grupo mede 380 dentro de um form de 370 —
mas ela se anula e o campo já saía alinhado. Perdi uma tentativa mexendo nela.

**O que era**: falta de respiro. `lib/form-mobile-css.ts` põe `12px` de padding
no wrapper abaixo de 768px → o campo sai de 10px pra 22px e alinha com o bloco
de texto. Injetado no `<head>` pelos dois caminhos de servir.

⚠️ **`!important` é proposital**: o CSS do Elementor vem depois e com
especificidade alta. Sem ele a regra é ignorada — medido no navegador, o campo
continuava em 10px. A primeira versão do arquivo não tinha, e não funcionou.

Conferido aplicando o CSS na página de produção antes de subir: campo de
`{esq:10,larg:370}` pra `{esq:22,larg:346}`.

## 🤖 SUPORTE POR IA — fase 1 completa, com Hotmart ligada (13/08)

`/suporte` no painel. **Nenhum WhatsApp conectado** — é a fase de treinar as
respostas. A tela é **só o chat**; a base de conhecimento e a fila de lacunas
ficam em `/suporte/ajustes` (James: *"não quero isso aqui, apenas o chat"*).

### O que ela faz

- Responde o que está na base; **não inventa** — o que falta vira "chamo uma
  pessoa"
- **Nunca vende, nunca fala preço.** Quem quer curso vai pra uma pessoa
- Responde em **espanhol** no idioma de quem escreveu
- **Lê print** e **ouve áudio** (modelos gratuitos da OpenRouter; conferido com
  print de verdade: citou curso e data que só existiam na imagem)
- Pediu humano → **cala** e só o James reativa. Toca o **sino do portal** com um
  resumo do caso

### O fluxo de acesso, ligado na Hotmart

```
"não consigo acessar"  → pede o e-mail
dentro dos 12 meses    → "vou pedir pro time reenviar"      → PESSOA
fora dos 12 meses      → "expirou em <data>"                 → PESSOA
e-mail sem compra      → "usou outro e-mail?"
compra cancelada       → não fala de dinheiro                → PESSOA
```

⚠️ **A decisão é da regra, não do modelo** (`lib/suporte-acesso.ts`, 15 testes).
Data e prazo são conta em código; o modelo só escreve a frase. Modelo grátis
errando essa conta diria "seu acesso está ativo" pra quem não tem.

### Hotmart (conectada em 13/08)

- **Webhook** `/api/hotmart` — compra aprovada/completa/cancelada. Exige o
  `HOTMART_HOTTOK`; sem ele qualquer um inventaria compra e a IA afirmaria
  acesso que não existe.
- **API** (`HOTMART_CLIENT_ID/SECRET/BASIC`) — alcança o **histórico**, que o
  webhook não cobre. **Só leitura.**
- `todasAsCompras()` junta as duas: se a API cair, segue com o webhook. Dizer
  "você não tem compra" pra quem tem é pior que informação parcial.
- Conferido em produção: 3 compras reais de uma aluna, com produto e data.

⚠️ **Reembolso e chargeback NÃO estão marcados** (decisão do James). Então o
portal não sabe de reembolso — por isso a IA não crava a data como certeza e
qualquer assunto de reembolso vai direto pra pessoa.

⚠️ **"Reenviar acesso" continua sendo humano.** É um clique na Hotmart; não
sabemos se existe na API. A IA descobre que precisa e avisa o atendente.

### Pendências

- Ligar no WhatsApp (fase 2) — **só pela API oficial**, biblioteca não oficial
  bane o número
- Encher a base: o que ela não souber cai em `/suporte/ajustes`

### 13/08 — fila de "acessos pra reenviar"

⚠️ **Reenviar acesso NÃO tem API.** Sondei seis endereços plausíveis com GET
(só leitura) e todos deram 404. O que existe e responde é `sales/history`,
`sales/users` e `subscriptions`. Achado de brinde: `club/api/v1/users` existe
mas dá **403 — sem permissão nesta credencial**; se um dia liberarem, dá pra
saber em que módulo a aluna parou.

Então o reenvio segue sendo clique humano na Hotmart, e o portal faz a parte
dele: quando a IA descobre que o acesso está **válido** e só falta reenviar, ela
**anota numa fila** (`suporte:reenvios`). James: *"deixar ali uma caixa, um
espaço, com os e-mails pra reenviar"*.

- **Sino do portal**: "N acessos pra reenviar na Hotmart", **antes de tudo** —
  é aluna com acesso pago que não consegue entrar
- **Caixa em `/suporte`**, com e-mail, curso e até quando vale. **Só aparece
  quando tem algo na fila** — vazia, a tela continua sendo só o chat, como ele
  pediu
- Botão **"Já reenviei"** risca da lista

⚠️ **`max_tokens` subiu de 400 pra 900**: o raciocínio interno do modelo
consome do mesmo teto mesmo sendo descartado, e a resposta visível cortava no
meio ("Vou pedir ao").

### 13/08 (final) — etiqueta sai do portal de vez

James: *"tira esse negócio de etiqueta aí, porque a gente não etiqueta nada. É
só CRM. Aqui no portal a gente não vai etiquetar nada."*

O campo existiu por meio dia e foi removido. **O CRM ganhou tags fixas por
integração** — então quem etiqueta é ele: uma webhook por tag, criada lá, e a
chave colada na página. O portal só entrega o lead na porta certa.

O porquê ficou registrado em `lib/lp-form-config.ts` e `lib/crm-envio.ts`, com
um teste que **falha se alguém voltar a mandar tag no corpo** — foi criado e
recriado duas vezes em um dia, então o teste é a trava.

⚠️ **Também arquivado** (decisão dele, *"não é nada importante"*): testar a
etiqueta na /ciafol-luz, criar os 5 webhooks por funil, e a conferida do Attack
Challenge Mode na Vercel. Fica aqui registrado caso volte — o do Firewall é o
único que pode **perder lead sem deixar rastro**, porque a página nem abre.

### 13/08 — trocar a URL saiu do SEO e foi pra tela da página

James: *"senti falta de poder trocar a URL por aqui — vê aonde tem e unifica
apenas aqui"*.

Onde estava: um campo **"Slug / Permalink"** escondido **dentro do editor de
SEO**, entre título, descrição e imagem de compartilhamento. Trocar a URL não é
SEO — é a identidade da página, o link que se copia e manda pro ManyChat.

E tinha uma segunda porta morta: `changePublicSlugAction` já existia em
`wp-pages/manage-actions.ts` e **ninguém chamava**. Ela é a que cuida do índice
de publicadas e recusa URL já usada. Agora é ela que roda.

- `components/trocar-url.tsx` — "Trocar endereço" logo abaixo da URL, na tela
  da página
- o campo saiu do `seo-editor.tsx` — **um lugar só**
- ⚠️ avisa antes de trocar: o endereço antigo deixa de funcionar, e link em
  anúncio, ManyChat ou bio precisa ser atualizado

### ✅ 13/08 (fim do dia) — a tag funciona; e o erro que me levou pro caminho errado

⚠️ **Eu diagnostiquei errado e o Lucas corrigiu**: *"o webhook não estava
ignorando o utm_source — ele nunca chegou. O corpo do envio das 17:41 foi só
name, nome, email, telefone, pagina"*.

Ou seja: eu mandei o James testar afirmando que a tag ia no envio, **ela não
foi**, e a partir do resultado eu concluí que o CRM ignorava a tag. Cheguei a
**remover o campo da tela** por causa dessa conclusão errada.

**A lição não é "prestar atenção"**: é que o corpo do envio precisa ser
verificável sem depender de um teste manual no CRM de produção. Agora ele é:
`lib/crm-envio.ts` (`montarCorpoDoLead`) é uma função pura com 5 testes que
olham o objeto que sai, e o teste local intercepta o envio de verdade:

```
{"nome":"Maria Teste","whatsapp":"11999998888","email":"maria@teste.com",
 "telefone":"11999998888","pagina":"metodo-shadow-pro","tag":"INSTA CIAFOL LUZ"}
```

#### O que o Lucas entregou (produção, `eb3f2fc`)

- Campo **`tag`** no corpo vira **etiqueta no contato**, criada na hora se não
  existir — **não precisa cadastrar as 22 antes**.
- Aceita `tag`, `tags`, `etiqueta`, `etiquetas`; várias por vírgula; **até 3
  por envio** (a chave é pública).
- Sem campo de tag, o `utm_source` serve de etiqueta.
- A integração tem **tags fixas** no formulário de configuração — as do funil,
  aplicadas em todo preenchimento. **Fixa = funil, campo `tag` = página.**
- Canal agora é: `utm_source` → primeira tag → rótulo de origem → nome do
  webhook.

**Por isso um webhook por funil basta: são 6, não 22.**

⚠️ **Grafia**: escrever a tag sempre igual entre as páginas. Diferente cria
etiqueta diferente, e como ela nasce do envio, um typo vira tag permanente no
catálogo (dá pra ocultar em `/crm/configuracoes/tags`). Apagar tag usada por
integração agora é recusado — sem isso a landing pararia de marcar em silêncio.
O aviso está na tela, embaixo do campo.

### ✅ 13/08 — divisão fechada: o CRM cuida de tag, o portal só entrega

Testado de ponta a ponta na `/ciafol-luz` com a chave nova do James
(`pk_8YXIL695uQcGTcyA` — confirmada válida: POST vazio devolve 422 "Telefone
inválido", enquanto a antiga dava 404).

**O lead chegou no CRM**, no funil e etapa certos. A anotação do negócio provou
que o corpo do envio é lido:

```
Preenchimento do formulário "FORMULARIO CONTEUDO"
Página: ciafol-luz          ← campo NOSSO
```

⚠️ **Mas o CRM ignora o `utm_source` do corpo.** Em "De onde veio" apareceu
`Canal: FORMULARIO CONTEUDO` — o nome da webhook — e o negócio ficou **sem
etiqueta**. A ideia de "uma webhook por funil + tag no envio" **não funciona**.

**Decisão do James**: *"a única função do portal é fazer com que leia a webhook
do CRM e envie diretamente pro certo local no CRM. Essa parte de tageamento vai
ficar por conta do CRM, não nossa."*

Então: **uma webhook por tag, criada no CRM**, e a chave dela colada na página.
O campo "Tag do formulário" que eu tinha criado **foi removido** — campo que não
faz nada engana. Ver o comentário em `lib/lp-form-config.ts`, que guarda o
porquê pra ninguém recriar.

**Estado**: só a `/ciafol-luz` tem chave colada. As outras 21 guardam o lead no
portal mas não mandam pro CRM. O James cria as webhooks quando o Lucas terminar
as tags, e cola página por página — a tabela tag → página está na sessão e em
`notas/tags-formularios.csv`.

**Pendências dele**: apagar o lead `testeluz` do CRM; desligar o Attack
Challenge Mode na Vercel.

## 🔜 PRÓXIMA FRENTE — migrar os formulários do Clint pro CRM (13/08)

### O fluxo que precisa voltar a funcionar

```
pessoa comenta no Instagram → ManyChat dispara → manda o link da página com
formulário (hoje no NOSSO portal) → pessoa preenche → cai no CRM no funil
comercial, JÁ COM A TAG daquele formulário
```

A **tag** diz de qual formulário veio, e é ela que decide o roteiro e as
mensagens prontas do comercial. Sem tag o lead chega anônimo. No Clint cada
formulário tinha seu webhook e o webhook carregava a tag.

⚠️ **Roteiro e mensagens prontas dentro do CRM são do James, manual.** Não é
nosso escopo.

### Tamanho real: **70 páginas com formulário** (varridas do sitemap, 70 de 72)

Lista completa em `scratchpad/` da sessão; grupos: `/acao-lips-sense-*` (12),
`/acao-jayremove-*` (4), `/remove_*` (7), `/magic-shadow-*` (6),
`/fio-a-fio-*` (3), `/contato-*` (3), mais avulsas.

É esse número que decide a arquitetura — na mão não dá.

### ❓ Bloqueado nas respostas do Lucas

1. **A tag entra por onde?** No print de "Novo webhook" só aparecem Nome,
   Etapa de entrada, Responsável, Domínios liberados e **Rótulo de origem** —
   **não vi campo de tag**.
   - Se o rótulo de origem servir como tag → **uma chave só** resolve (a chave
     padrão já está construída) e a página manda o identificador.
   - Se a tag for amarrada ao webhook → **70 webhooks**, um por formulário.
2. **Dá pra criar webhook por API?** Se der, criamos os 70 sem digitar.
3. **As tags do Clint dão pra exportar?** Precisamos do par formulário → tag.
4. **O CRM lê campos extras no envio** (`utm_source`, `tag`)? Com quais nomes?
5. **Etapa de entrada e Responsável são por webhook** — se for uma chave só,
   todo lead cai na mesma etapa. Isso serve?
6. **Limite de envios por chave** — com 70 formulários numa chave só, importa.

### O que já está pronto do nosso lado

- Envio pelo servidor com `Origin`/`Referer` (resolvido, ver seção do dia 11)
- **Chave padrão do CRM** em Configurações → Integrações (a chave da página
  vence a padrão) — já cobre o cenário "uma chave só"
- Coluna **CRM** na tela de Leads + botão **Reenviar**
- Aviso no dashboard quando lead recente não chegou no CRM

## 🚨 URGENTE — a Vercel está barrando visitante (13/08)

Uma cliente mandou print de `ERR_HTTP_RESPONSE_CODE_FAILURE` ao abrir
`/beautyempreenda` pelo Instagram. **Não é o formulário.** É a Vercel:

```
403 Forbidden
X-Vercel-Mitigated: challenge
```

Peguei acontecendo em TODAS as páginas testadas (`/beautyempreenda`,
`/contato-instagram`, `/acao-mshadow`, `/basic-nanofios`, `/stbrows`,
`/campanha-vogue`) e minutos depois parou — é **intermitente**.

O navegador de dentro do Instagram não completa o desafio anti-robô, então a
página nem abre. **Enquanto isso estiver ligado, lead do Instagram se perde sem
deixar rastro** — nem chega no portal.

**Ação (só o James consegue)**: Vercel → projeto `jay-academy` → **Firewall** →
conferir **Attack Challenge Mode**. Se estiver ligado, desligar. O acesso à
Vercel a partir do Claude Code não está autorizado.

---

### ✅ 11/08 — CRM recebendo lead (RESOLVIDO)

James: *"funcionouuu"*.

O que destravou, na ordem em que foi descoberto:

1. **Envio pelo servidor** (`/api/elementor-form`), não pelo navegador — POST
   com JSON dispara verificação prévia e o navegador barrava calado.
2. **Origin e Referer da página de origem** no envio pro CRM. Ele decide pela
   lista de *"Domínios liberados"* olhando de qual site veio; do servidor a
   requisição chegava **sem site nenhum** e a chave com lista preenchida
   recusava. Foi a última peça.
3. **Domínios liberados** preenchidos no CRM com `jayacademy.com.br`,
   `www.jayacademy.com.br`, `jay-academy.vercel.app` (ou em branco).

⚠️ **Regra pro futuro**: se um serviço externo filtra por domínio e a gente
manda do servidor, tem que anunciar o domínio de origem — senão ele recusa sem
dizer por quê.

**Ponta solta**: falta colar a chave nas outras páginas. Cada página tem a sua
(bloco Webhook em `/lps/<slug>` ou `/wp-pages/<domain>/<slug>`).

**Limpar**: leads de teste que eu criei — "TESTE PORTAL" em `/acao-mshadow`.

### 🚨 11/08 — eu quebrei os formulários do WP tentando consertar o webhook

Sequência do estrago, pra não repetir:

1. Injetei nas páginas do WP (`app/p/[slug]`) um script que **segurava o
   submit e mandava direto pro CRM**. Isso sequestrou formulários que
   funcionavam — James viu na hora: *"a animação que ele tinha antes mudou tb,
   não era assim"*.
2. Como a chave dele responde 404, o envio falhava e a pessoa via só *"Não
   conseguimos enviar agora"*: *"os formulários não estão sendo permitidos
   serem enviados!"*.
3. Tentei estreitar pra `form.elementor-form` — **não adiantou**: os
   formulários dele SÃO do Elementor (varri as 72 páginas do sitemap pra
   achar a dele, já que ele tinha fechado o link).

**Solução**: LP e página do WP usam a MESMA ponte
(`montarGuardaDeFormularios`), que manda pro `/api/elementor-form` — o
servidor guarda o lead, dispara o webhook da página, chama o CRM e devolve a
mensagem de sucesso. A ponte sai de fininho se alguém já tratou o submit.

⚠️ **Regra**: nunca segurar o submit pra falar com serviço de fora. Manda pro
nosso servidor e deixa ele falar com o mundo — e nunca trocar o comportamento
de um formulário que já funciona.

Conferido em produção, em `/acao-mshadow`: `200 POST /api/elementor-form` e
*"Recebido com sucesso!"* na tela. Ficou um lead "TESTE PORTAL" pra apagar.

⚠️ **Ainda pendente**: a chave do CRM responde 404 (testada direto, e chave
inventada dá o mesmo). Mas agora **o lead não se perde**: fica no portal mesmo
se o CRM recusar.

### 🚨 11/08 — os formulários das 4 LPs de venda estavam QUEBRADOS

James mandou print do **HTTP 405** ao enviar um formulário. Investigando,
descobri que era muito pior que um detalhe do webhook:

```
window.jQuery              -> undefined
window.elementorProFrontend -> undefined
```

O jQuery e o Elementor **não carregam** nas LPs (nenhum asset dá erro — eles
simplesmente não executam). Sem eles, ninguém intercepta o envio: o formulário
faz POST na própria URL e a página, que só responde GET, devolve **405**.

⚠️ **Isso estava em produção sem webhook nenhum configurado. Todo lead das 4
páginas de venda se perdia** — NanoFios, Profissão Remove, Fio a Fio, Lips
Sense. Reproduzido no navegador antes e depois.

**`montarGuardaDeFormularios()`** agora vai em TODA página servida pelo
`serve-lp`, com ou sem webhook. Ela intercepta o submit, manda pro
`/api/elementor-form` (que já guardava o lead e dispara o webhook da página) e
mostra a resposta na tela.

Não atropela nada: se outro script já tratou o envio (`defaultPrevented`) ou se
o formulário tem destino próprio (Hotmart), a ponte não encosta —
`mesmaPagina()` decide, e é testada executando a função.

O `/api/elementor-form` agora também dispara **a chave do CRM**, do servidor,
e grava o resultado em `webhook-log:<slug>` — que aparece em "Últimos envios"
na tela da página.

Conferido de ponta a ponta em `/basic-nanofios`: antes `405 POST
/basic-nanofios`; agora `200 POST /api/elementor-form`, lead gravado e
*"Recebido com sucesso!"* na tela. Leads de teste removidos depois.

### ⚠️ 11/08 — o "Tirar" do webhook não tirava

James: *"não está sendo possível remover ou trocar a webhook"*.

O botão de remover tinha `name="codigo" value=""` — **o mesmo nome da caixa de
texto**. FormData aceita nomes repetidos e `.get()` devolve o PRIMEIRO, que era
o texto da caixa. Ou seja: clicar em "Tirar" regravava o mesmo código.

Agora o botão manda `acao=remover`, num campo de nome próprio, e a action
grava vazio quando vê isso. Depois de remover, a caixa fica **vazia e aberta** —
quem tirou quase sempre quer colar outro em seguida; fechar dizendo "instalado"
seria mentira.

`lib/webhook-form.test.ts` (4 testes) guarda a regra, inclusive um que
demonstra o bug antigo: dois campos `codigo` e o `.get()` pegando o primeiro.

Conferido no navegador em `/lps/metodo-shadow-pro`: colar → **Tirar** deixa o
arquivo em `{}` → colar outra chave grava a nova → trocar de novo grava a
terceira.

⚠️ **Regra**: botão que submete formulário **nunca** repete o `name` de um
campo do mesmo formulário.

### ⚠️ 11/08 — envio pro CRM: chave, servidor e diagnóstico

James colou a variante "formulário pronto" do CRM e o formulário apareceu solto
no rodapé: *"NÃO QUERO ISSO APARECENDO"*. Depois, sobre eu mandar pedir outra
variante ao Lucas: *"pra que eu preciso pedir algo pro Lucas? Eu pedi pra você
ajustar"*. **Certo nas duas.** A chave `pk_…` já vinha no código colado.

`lib/webhook-codigo.ts` (15 testes): `extrairChave()` acha o `pk_…` em
qualquer coisa (código, URL, ou a chave sozinha) e `montarScriptDeEnvio()`
escreve o envio. **Nada visível entra na página.**

#### O envio passa pelo NOSSO servidor (`/api/crm-envio`)

⚠️ Direto do navegador **não funciona**: POST com JSON dispara a verificação
prévia (preflight), e se o CRM não liberar o domínio ali, o navegador barra
antes de sair — o lead some **sem erro na tela**. Confirmado no navegador. Pelo
servidor não existe essa regra.

#### Três cuidados no script

1. **Manda uma cópia, não sequestra o submit** — se outro script já tratou
   (Elementor), o fluxo original segue.
2. **Só segura o envio quando iria pro vazio** (formulário sem `action`) — era
   a causa do **HTTP 405**.
3. **Sem regex dentro do script gerado**: o escape de barra invertida se perdia
   no template e o normalizador do Elementor virou classe de caracteres,
   silenciosamente. Agora `limpaNome` e `soDigitos` usam string pura, e os
   testes **executam** essas funções em vez de procurar texto no script.

#### O diagnóstico volta pro painel

`webhook-log:<pagina>` guarda os 10 últimos envios (só página, status e
motivo — nada do lead) e a tela da página mostra em português:
`explicarEnvio()`.

#### ⚠️ ESTADO ATUAL: a chave não é reconhecida

Testado contra o CRM de verdade:

```
POST /api/integrations/site/lead/pk_GFNMm_kOuM_H0kto  -> 404 {"ok":false}
POST /api/integrations/site/lead/<chave inventada>    -> 404 {"ok":false}
caminhos errados (/api/leads/…, /api/site/lead/…)     -> 307 (redirect)
```

O caminho certo responde **JSON**, os errados redirecionam — ou seja, **o
endereço está certo e é a chave que o CRM não acha**. Por isso o cadastro dele
não chegou. Não é código do portal: é a chave (regenerada, de outro ambiente ou
copiada pela metade). **Pendente: James conferir a chave no CRM.**

### 11/08 (parte 4) — unificação: uma lista, um webhook, um editor

James: *"faça tudo"* e *"todas têm que ter o editor exatamente igual"*.

#### Uma lista de páginas

A barra lateral tinha 5 entradas. Fui ver o que o "tipo"
(website / landing page / formulário) muda no código: **nada**. Nem publicação,
nem serving, nem edição — só decidia em qual lista a página aparecia. Por isso
publicar com o tipo errado fazia a página **sumir** da lista onde ele procurava,
e ele lia isso como bug de publicação. Agora: **Todas as páginas** +
**Formulários** (que é outra ferramenta — ali se CRIA um formulário).

#### Webhook em toda página

Mesmo componente e **mesmo store** (`lp-form-config:<slug>`) nas LPs e nas
páginas do WP — não existe "o webhook da LP" e "o da página do WP". Injetado
antes de `</body>` nos dois caminhos de servir (`serve-lp.ts` e
`app/p/[slug]/route.ts`).

#### Editor: agora alcança as páginas do repositório

`EditorShell` já era o mesmo pras LPs do KV e pras páginas do WP. O que faltava
era chegar nas de `lp-html/`. Agora chega: `resolveLpHtml()` faz a versão
editada no painel passar na frente do arquivo do repositório.

⚠️ **As 4 do Elementor ficam de fora, de propósito.** `ehExportElementor()`
detecta (>50 ocorrências de "elementor" no HTML) e desvia. Motivo: elas têm
**60–80 scripts** que montam carrossel, popup e o próprio formulário DEPOIS do
carregamento. O editor salva o corpo como está no momento — o estado já mexido
pelo JS — e recarregar isso duplica elemento e mata o formulário. Numa página de
venda, é perder lead. A tela explica isso em vez de só esconder o botão.

⚠️ **O override é silencioso e precisa de aviso.** Depois de salvar pelo editor,
mexer no arquivo e dar push **não muda mais nada** na página no ar. Por isso o
bloco **"Versão no ar"** aparece com o alerta e o botão **"Voltar pro original
do repositório"** (`voltarProOriginalAction` → `resetEmbeddedHtml`).

Conferido de ponta a ponta: editor abre nas 4 de HTML limpo (200) e desvia nas 4
do Elementor (307); gravar override muda a página servida; "voltar pro original"
devolve o arquivo do repositório.

### ⚠️ Incidente 11/08 — limpeza de disco apagou arquivo do projeto

O PC estava com **0 MB livre** (de 237 GB) e eu rodei uma limpeza de caches. No
comando que apagava pastas de build eu incluí `dist` — e `dist` existe DENTRO
de cada pacote do `node_modules` **e** dentro de
`public/lp/profissao-remove/wp-includes/js/dist/`.

Estragou duas coisas:

1. **node_modules do portal** — reinstalado, build e 128 testes de volta ao
   normal. Os outros projetos da Desktop podem estar iguais: `npm install` na
   pasta resolve.
2. **`hooks.min.js` e `i18n.min.js` da LP Profissão Remove**, que está NO AR.
   Restaurados com `git checkout`. Árvore limpa, nada foi commitado quebrado.

⚠️ **Regra que fica**: nunca apagar por NOME de pasta (`dist`, `build`, `cache`)
numa varredura recursiva. Esses nomes existem dentro de dependências e dentro de
assets de página. Limpar só caminho conhecido e explícito, e conferir
`git status` depois — foi ele que mostrou o estrago.

## 🔌 Sessão 2026-08-11 — integração com o CRM: construída e DESFEITA

Terminou em nada de código, e é assim que tinha que ser. Fica registrado pra
ninguém refazer.

### O que aconteceu

Passei o dia construindo um sistema de integração dentro do portal, em três
versões, cada uma corrigindo a anterior:

1. **Saída** (portal → CRM), com destinos cadastrados. James: *"a intenção é
   sair do Clint, a webhook tem que ser NOSSA"*.
2. **Entrada + saída**, dois conceitos. James: *"faz um negócio só, não cria
   dois não"* — e mandou ler a documentação do Clint.
3. **Uma coisa só**, no fluxo do Clint, e depois adaptada ao formato real do
   JAY.O (chave `pk_`, telefone obrigatório, erros traduzidos).

Aí o James falou com o Lucas e a conclusão foi outra: **o CRM é quem cria e
administra os webhooks**. O portal não precisa de tela, nem de rota, nem de
chave guardada. Só precisa **mandar o lead pra URL que o CRM der**.

**E isso já existia e já funcionava** — é o mesmo campo que hoje aponta pro
Clint:

- `/forms/[id]` — formulários do portal
- `/leads`, seção **"Webhooks das LPs"** — as LPs de `lp-html/`

Trocar a URL do Clint pela do JAY.O é o trabalho inteiro.

### Tudo foi apagado

`lib/integracoes*`, `lib/campos-recebidos*`, `lib/lead-campos`,
`lib/lead-de-formulario`, `app/api/receber/`, `app/settings/integracoes/`,
`components/integracoes-workspace`. Os arquivos que eu tinha tocado
(`forms-store`, os 3 caminhos de formulário, `settings/page`) voltaram por
`git checkout 60bcea9`. Zero resíduo.

### O que sobrou de útil (fatos verificados, não código)

- **As 4 LPs no ar já mandam `nome`, `email` e `whatsapp`** — nomes que o
  endpoint do JAY.O aceita. Não precisa renomear campo nenhum.
- ⚠️ **Os `utm_*` das LPs Elementor vão aninhados dentro de `raw`.** Se o CRM
  precisar do `utm_source` como origem do negócio, é preciso subir eles pro
  topo do payload em `api/elementor-form`. **É a única mudança de código que
  pode ser necessária.**
- O JAY.O CRM está no ar (`crm.sistemajayo.com`) e tem uma **API completa** por
  trás (`/api/crm/contacts`, `/leads`, `/notes`, `/tags`, `/pipeline`,
  `/stage`, `/status`, `/owner`) com `Authorization: Bearer`. Dá pra puxar
  dados do CRM pro portal um dia — não é o assunto de agora.
- O `jayo-crm-0.3.17.zip` é uma **extensão do Chrome** pro WhatsApp Web, não o
  CRM. Assunto separado.
- 🐛 Achei e consertei (e depois revertei junto) um detalhe do `addSubmission`:
  ele empilha sem checar id. Não é problema hoje porque cada lead grava uma vez.

### A lição

Antes de construir, perguntar **quem é o dono da peça**. O webhook é do CRM.
Três reconstruções aconteceram porque eu assumi que era nosso.

---

### Parte 7 — Baixar a imagem pelo visualizador

Botão **Baixar** no visualizador, e o cabeçalho agora mostra a **medida real** do
arquivo (`1536 × 2752 · 139 kB`) — é ela que diz se a imagem serve pra impressão
ou só pra web.

- Baixa o arquivo **original**, sem redimensionar nem recomprimir. Conferido
  byte a byte: sha256 e tamanho idênticos ao arquivo do repositório.
- ⚠️ `<a download>` sozinho não serve: o atributo é **ignorado quando o arquivo
  mora em outro domínio** (Supabase), e o navegador abre a imagem em vez de
  baixar. Então busca o arquivo, salva do blob, e só cai pra "abrir em outra
  aba" se o CORS barrar.
- Nome de arquivo limpo: `03b7af09fe79-desktop-james-olaya-lips-sense-1-514e94fd61.jpg`
  vira `desktop-james-olaya-lips-sense-1.jpg`.

### Parte 6 — "76 páginas, 46 álbuns": uma foto agora vive em vários álbuns

James contou os álbuns e viu que faltavam 30. Causa única, no modelo de dados:
**uma mídia só podia pertencer a UM álbum**. Como a mesma foto serve dezenas de
páginas (logo, fundo, foto do professor), cada importação *roubava* a foto da
página anterior — e a página cujas imagens eram todas compartilhadas terminava
com zero e sumia da galeria (álbum do WP vazio fica escondido).

- `MediaItem.albuns?: string[]` — como no app de Fotos, uma foto está em quantos
  álbuns for. `pageId` continua sendo o **álbum principal** (o que "Mover pra"
  escreve); registro antigo sem `albuns` é lido como um álbum só.
- As regras moram em **`lib/media-albuns.ts`** (fora do `media-store`, que é
  `server-only`), com 11 testes — é a lógica que decide se uma foto aparece ou
  some. `unirAlbuns` SOMA, `moverPara` substitui (mover é escolha do usuário),
  `tirarAlbum` não tira a foto dos outros álbuns.
- `organizeImportedMediaByPage` reconstrói tudo a partir do **HTML guardado de
  cada página**, que é a fonte da verdade sobre quais imagens ela usa. Tinha um
  segundo bug ali: o regex só pegava `https://…`, e depois da saída do Blob o
  HTML foi reescrito pra caminho local (`/wpmirror/…`) — não casava nada.
- Flag da migração foi pra **v3** e perdeu a condição "existe imagem solta": as
  imagens já tinham álbum, só tinham UM, o errado. A v2 nunca consertaria isso.
- O botão **Reconferir imagens** agora também reconstrói os álbuns do WP e diz
  quantas páginas ficaram **sem nenhuma imagem na biblioteca** — essas são outro
  caso (nunca tiveram os assets localizados), e agora dá pra ver quantas são.

### Parte 5 — "não quero imagens faltando" (1016 arquivos varridos, 941 na galeria)

James: *"todas as imagens de todas as lps, e de todas as que ainda vão ser
criadas de todas as maneiras, estejam aqui"*.

O manifesto varria **só `public/lp/`** e ainda pulava `wp-content`. Ficavam de
fora 590 arquivos: as fotos da Profissão Remove (que moram justamente em
`wp-content/uploads/`), PMU CLASS, Magic Shadow, JAY.O Laser, as páginas
recriadas e o espelho do WordPress. Agora varre `public/` inteiro.

- **`scripts/gerar-manifesto-midia.mjs`** (era `-lps`) → `lib/midia-assets.json`.
  16 álbuns. Dois deles — **Arquivos de sistema** e **Espelho do WordPress** —
  existem só pra nada faltar e ficam **por último** na galeria (`rank()` em
  `lib/media-pages-store.ts`).
- **Sincronia automática**: o manifesto carrega uma *marca* (sha1 de url+tamanho
  de tudo). Mudou a marca, a `/midia` sincroniza sozinha no primeiro acesso
  (`sincronizarSeMudou`). Ninguém mais depende de clicar num botão — era essa a
  parte "de todas as maneiras". Quando nada mudou, custa UMA leitura.
- **Conserto das imagens quebradas do WP**: o arquivo espelhado se chama
  `<hash12 do sha1 da URL original>-<nome>-<sufixo>`, e a mídia importada tem id
  `<hash16 do mesmo sha1>`. Os 12 primeiros caracteres casam os dois — então dá
  pra apontar as importadas que ficaram órfãs do Blob/Supabase morto pro arquivo
  local de `public/wpmirror/`, **sem reimportar nada e sem esperar o Blob
  resetar**. Também é isso que impede o espelho de duplicar cada foto.
- **Arquivo apagado do repositório sai da galeria** — miniatura quebrada pra
  sempre é, na tela, a mesma coisa que faltar. Só mexe no que a sincronia criou
  (id `lp:<url>`).

#### As miniaturas do WordPress (⚠️ a regra que já apagou foto de verdade)

O WP guarda a mesma foto em 4–5 tamanhos (`foo-300x200.jpg`). Mostrar as cinco
não é "não faltar nada", é a mesma imagem cinco vezes atrapalhando. Ficou só a
maior — **75 colapsadas**. A regra mora em **`scripts/variantes.mjs`**, separada
e testada (`variantes.test.mjs`), porque é a única do manifesto que pode sumir
com material, e sumiu duas vezes durante a escrita:

1. `-(\d+)x(\d+)` comeu **`garantia-rosa-9x16.webp`** — proporção de tela, não
   miniatura. Corrigido pra `\d{2,4}`.
2. Tirar o hash do espelho da chave fundiu o **`modulo-07` de duas páginas
   diferentes** num só. O hash identifica a URL de origem e tem que ficar; só o
   sufixo aleatório sai (aí sim é reimportação do mesmo arquivo).

Auditoria depois do conserto: dos 75 descartados, 31 são miniatura de verdade e
44 são reimportação do mesmo hash. **Zero suspeitos.**

### Por que as imagens das LPs nunca apareciam

A biblioteca só conhecia **dois caminhos de entrada**: o import do WordPress e o
upload manual. As imagens das páginas que a gente monta são **arquivos
commitados em `public/lp/...`** — não passam por nenhum dos dois. Por isso a
galeria só tinha material com etiqueta "WP".

- `scripts/gerar-manifesto-lps.mjs` roda no **`prebuild`** e gera
  `lib/lp-assets.json` (426 arquivos, 48 KB). ⚠️ **Não trocar por leitura de
  disco em runtime**: em produção `public/` é servido pela CDN e pode não estar
  no sistema de arquivos da função.
- `lib/media-lp-sync.ts` → botão **Sincronizar LPs** em `/midia`. O id de cada
  mídia é `lp:<url>`, então rodar de novo **não duplica**.
- `lib/media-nomes.ts` — `limparNome()` decodifica entidade HTML (era o
  `&#8211;` que aparecia cru na tela) e `escolherCapa()` pega a **maior** imagem
  do álbum, descartando ícone/logo/arquivo minúsculo (antes vencia a primeira da
  lista, o que dava aquela capa de despertador borrado). 8 testes em
  `lib/media-nomes.test.ts`.

### O layout (commit `8a24ef9`)

- Capa de álbum **quadrada, sem moldura nem fundo de cartão** — a foto é o
  objeto. Uma lasquinha de 3px atrás do rodapé imita a pilha do iOS: é o único
  enfeite da tela, e é de propósito.
- Grade de álbuns `auto-fill minmax(150px,1fr)` → 2 colunas no celular, 7 no
  desktop. **Não aumentar esse mínimo**: com 178px o celular caía pra 1 coluna.
- Dentro do álbum, a parede de fotos perdeu legenda e cartão: quadrados de 104px
  com 3px de respiro. **A densidade é a interface.** Vídeo e arquivo mantêm
  ícone + nome porque um quadrado preto não se lê.
- Clique numa foto abre visualizador em tela cheia — Esc, setas do teclado,
  trava de rolagem, e as ações (copiar link, mover de álbum, excluir).
- **Vocabulário**: "página" virou **"álbum"** em todo texto visível. "Páginas"
  na barra lateral quer dizer página publicada do site — colidia.

---

## 🐛 Sessão 2026-08-10 (parte 3) — as 2 sugestões abertas da caixa de ideias

James: *"pegue as que estão marcadas como aberto e as conclua, primeiro olhe
todo o codigo para ver c há bug"*. Eram **MOBILE** e **ajustar bug I.A
pmuclass**. ⚠️ As sugestões de verdade moram no **KV de produção** — auditar o
arquivo local não serve de nada.

### MOBILE — página WP não tinha "ver no celular"

Só as LPs do painel tinham. Criada `app/wp-pages/[domain]/[slug]/celular/` com
atalho na página publicada e cartão na não-publicada.

Dois bugs achados no `components/preview-celular.tsx` no caminho:

1. O menu de dobras enchia de lixo — o WP usa id de máquina (`mwAQ`). Agora só
   entra id que pareça palavra: `/^[a-z][a-z0-9-]{3,}$/`.
2. **O `onLoad` do React no `<iframe>` não basta**: com o `src` já no primeiro
   render, o load pode disparar antes do React pendurar o handler, e as dobras
   nunca eram lidas. Tem um `useEffect` que tenta 20× a cada 250ms. **Não
   substituir por um `onLoad` só.**

### I.A do PMU CLASS — 2 dos 4 modelos da corrente não existem mais

Provado **sem chave de API**, consultando o catálogo público da OpenRouter
(`/api/v1/models`, 399 modelos): 2 dos 4 ids da corrente tinham sumido — o chat
caía direto pro fallback ou pro erro.

- `lib/chat-models.ts` — corrente num lugar só.
- **`npm run checar-modelos`** valida a corrente contra o catálogo e sai com
  erro se um id morreu. Rodar isso quando a I.A "parar de responder".
- Verificado em produção: `200 | 1820ms | {"reply":"ok","model":"google/gemma-4-31b-it:free"}`.

### O bug do seed (o terceiro, que ninguém tinha pedido)

`listSuggestions()` fazia `if (!stored?.length) → devolve SEED e regrava`. Como
`[]` também é "sem length", **apagar todas as sugestões ressuscitava as 4 de
exemplo**. Conserto de uma linha, apoiado no fato de que `kvGet` devolve `null`
pra chave que não existe e `[]` pra lista vazia:

```ts
const stored = await kvGet<Suggestion[]>(KEY);
if (stored) return stored;   // [] é truthy: lista vazia continua vazia
```

---

## 🏛️ Sessão 2026-08-10 (partes 1–2) — layout N nas 5 formações presenciais

Depois de recusar as rodadas A–E e F–J, James escolheu a **opção N** ("cartões
brancos no preto") e mandou aplicar nos 5 cursos. Fonte da verdade visual:
`lp-html/academy.html`. Gerador: `scratchpad/formacoes-n.mjs` →
`lp-html/formacoes/*.html` + `public/lp/academy/formacao.css`.

Regras que ele fixou e **não devem ser desfeitas**:

- Capa **grande** no topo — `min(600px, 84vw)`. O arquivo tem 900px de largura,
  então 600px de CSS dá densidade 1,5. (Eu tinha dito que 450px era o teto;
  estava errado.)
- **A caixa de texto vem SEMPRE acima da foto.** Não voltar a alternar
  lado — *"para não confundir"*.
- Mistura de branco e preto, imagens grandes.

### Fotos: uma por curso, sem repetir

*"essas imagens estão se repetindo em todas as paginas / não quero isso!"* e
depois *"tem Pixel, que é brows e lips. Você tem que pegar imagem de boca
também… Dá uma procurada aí, imagem de shadow. Não faz a mesma coisa."*

- Acabou o pool rotativo: cada módulo tem `foto` explícita, e o gerador
  **quebra a build** se a mesma foto aparecer em dois cursos.
- O material de boca/shadow existia — só não estava em `lp/academy/`, e sim nas
  LPs dos outros cursos e no `wpmirror/`. Copiado pra
  `public/lp/academy/reais/tecnicas/` com `PROCEDENCIA.txt`.
- **Legenda tem que bater com a foto**: ele pegou uma foto de JAY.O PIGMENTOS ao
  lado de texto sobre protocolo regenerativo. A foto saiu.

### Ainda em aberto nas formações

- **Jay Beauty está magra** (3 imagens, sem resultados) — falta foto de
  design/henna/laminação.
- **Nano tem só 2 pares antes/depois** contra 3 dos outros.
- **Divergência de nível**: as capas oficiais dizem "INICIANTE" pra
  Brows/Pixel/Nano; os cartões da `/academy` dizem "Especialização"/"Avançado".
  Hoje ganha o cartão — decisão do James.

---

## 🧰 Sessão 2026-08-05 (parte 2) — ferramentas de trabalho

Não é conteúdo de LP: é infraestrutura pro trabalho do dia a dia.

### "Ver no celular" no painel ⭐ (o que ficou de mais útil)

- Rota **`/lps/[slug]/celular`** — serve pra **qualquer LP** do painel.
- Atalho **"Ver no celular"** no bloco Atalhos da página da LP, logo abaixo de
  "Abrir página".
- `components/preview-celular.tsx`: moldura de iPhone 13, tela **390×844 de verdade**,
  zoom que encolhe só a MOLDURA até caber na janela (o layout não muda), botão
  "Tamanho real", recarregar, abrir em aba, e **atalho por dobra lido da própria página**.
- Usa caminho relativo (`/slug`) de propósito: além de funcionar no localhost e em
  produção, **mesma origem é o que permite ler as dobras** pra montar os atalhos. LP em
  outro domínio ainda funciona, só avisa que os atalhos não vão.
- A versão antiga (, chumbada na Academy) foi
  REMOVIDA em 06/08: duplicata rende confusão, e a do painel serve pra todas as LPs.

### `scripts/` — caixa de ferramentas (`npm run foto` e `npm run cortar`)

Nasceu porque nesta sessão foram escritos e jogados fora 7 scripts descartáveis.

- **`npm run foto <slug>`** — print em 1440×900 e 390×844 (iPhone 13, 2×).
  `--dobras` / `--dobra <id>` / `--so <tamanho>` / `--url <base>`. Saída em `tmp/fotos/`.
  Resolve três armadilhas: espera `document.fonts.ready` (senão o print sai com fonte de
  sistema), liga as animações `.surge` (que começam invisíveis) e **volta ao topo antes
  de cada recorte** — rolar + `captureBeyondViewport` se somam e o recorte sai na dobra
  errada, bug que chegou a enganar uma revisão.
- **`npm run cortar --de X --para Y --formato 3:4`** — `--largura` é **teto, não
  promessa**: o script se **recusa a ampliar** e avisa. A regra que o James cobrou em
  05/08 virou código. `--evitar-topo` / `--evitar-baixo` cortam tarja de export do Canva.
  No fim informa até que tamanho de card a imagem aguenta em retina.
- Sem dependência nova: `puppeteer-core` + `sharp` que já estavam instalados.

### Como conferir o painel sem o login do James

Em dev a `AUTH_SECRET` cai no default de `lib/auth-secret.ts`. Dá pra assinar um
`jay_session` com `jose` e setar o cookie no puppeteer — foi assim que a tela nova foi
conferida. **Só funciona no localhost**: em produção a env é obrigatória.

---

## 🎬 Sessão 2026-08-05 — LP Academy: abertura em lettering e as fotos de aula

> Continuação dos ajustes da ata de 04/08. Contexto detalhado, decisões em aberto e
> armadilhas: `notas/lp-academy-ata/RETOMAR-AQUI.md`.

- **Hero desfeita**: o título voltou pra "Micropigmentação de alto nível". O boas-vindas
  que a ata pediu saiu da hero e virou uma dobra própria.
- **Nova dobra 0, `.abertura`**: lâmina preta de 100vh antes da hero. "Bem-vindo à /
  Jay Academy" em duas linhas, escrita letra a letra.
  - ⚠️ **Primeira versão foi reprovada e refeita na mesma sessão.** Ela amarrava a
    animação ao scroll: 220vh de corrida e a escala do bloco seguindo a rolagem. O James:
    *"ficou meio bugado… não é para ser uma intro, é como se fosse uma hero mesmo, eu
    estou tentando passar o mouse e está dando zoom"*. Qualquer roçada na roda mexia no
    tamanho da frase, e a lâmina ainda comia duas telas de rolagem antes da hero.
  - **Como ficou:** 100vh cravado (o topo da hero é exatamente a altura da viewport), a
    página rola normal por cima. Sem `sticky`, sem palco intermediário, **sem nenhum
    listener de scroll**. A escrita acontece sozinha ao carregar, em CSS — o JS só quebra
    as linhas em letras e carimba o `animation-delay` de cada uma (~1,9s no total).
  - O "crescer até tomar a tela" virou um `scale` .88 → 1 na entrada, uma vez só.
  - As letras se sobrepõem na cascata (.045s de atraso contra .72s de animação); sem isso
    vira fade em bloco, que é outra coisa.
  - `prefers-reduced-motion` desliga as três animações e a frase já aparece pronta.
- **Emenda da abertura com a hero degradada dos dois lados** (pedido do James). Havia uma
  linha horizontal na divisão: a abertura é preto chapado e o topo da hero já entra no
  morno do halo — `rgb(5,4,3)` virava `rgb(14,11,7)` de um pixel pro outro. Agora
  `.abertura::after` esquenta descendo e `.hero::before` escurece subindo, calibrados pra
  fechar no mesmo tom. ⚠️ O celular precisou de override próprio dentro do
  `@media (max-width: 768px)`: lá a hero é foto sangrada com scrim e o topo dela já é
  quase o preto da abertura, então os valores do desktop recriavam a linha ao contrário.
  Conferido por amostragem de pixel em 390, 1024, 1440 e 1920 — sem degrau maior que 1.
- **As 3 fotos da dobra 3 agora são coloridas** — o item mais cobrado pelo James (4 vezes).
  Não havia original colorido no projeto (todas as versões no git já eram cinza desde o
  commit `c778578`).
  - ⚠️ **1ª troca reprovada.** Usei frames de vídeo do design `DAHIKhsXzBk` "TRECHOS DE
    AULA". Coloridos e reais, mas o James: *"não gostei das imagens, achei que faltou
    qualidade nela e ficaram com muitos pixels"*. Frame de vídeo já nasce mole e
    comprimido (teto de 1080 de largura) e ainda estava sendo ampliado pra encher o card,
    que renderiza a ~910px em retina.
  - **O que ficou:** foto de ensaio profissional, do design `DAHAkyAhyOI` "PROVA SOCIAL
    ALUNOS". As páginas têm tarja de comentário por cima, então foi feita uma **cópia**
    (`DAHRbRpyTkU`, renomeada pra "TEMP - fotos limpas p/ LP Academy (pode apagar)"), as
    tarjas foram apagadas lá e as páginas exportadas em 2160×2700. O design original do
    James não foi tocado.
  - **Regra que sai daqui:** cortar no aspecto do slot e REDUZIR até a resolução real do
    arquivo original. Nunca entregar upscale. Saídas: 1100×1467, 1000×1250, 1050×1260.
  - **"A sala" trocada de novo, agora por escolha do James.** Ele aprovou a foto mas pediu
    pra ver mais opções. O filão bom é o design irmão `DAHE-SWJM00`, que usa o ensaio
    profissional das turmas (`LIPSSENSE-04-2026-*`, `vogue-01-2026-*`), todos em
    **4000×6000** — a melhor fonte de foto de turma do acervo. Montei uma página de
    comparação com 4 opções no 3:4 do card; ele escolheu a **C** (turma em volta da maca,
    instante mais aberto, uma aluna filmando). Saída 1400×1867. Andaime já apagado.
  - A legenda de "A sala" foi reescrita junto: falava em "bancadas montadas", que era a
    foto anterior. **Trocou a foto, relê a legenda.**
- **Preview de celular** (depois movido pro painel, ver sessão parte 2) → a LP de verdade
  rodando num iPhone 13 (390×844), com atalho pra cada dobra, recarregar e "Tamanho real".
  O aparelho se encolhe sozinho até caber na janela; a tela por dentro continua 390×844.
- **Fase 2 — mobile, os defeitos medidos e corrigidos:**
  - Cards de benefícios: em 2 colunas o 3º item abria a fileira de baixo mas herdava
    filete e recuo de 2ª coluna (18px pra dentro + linha vertical órfã); o 2º não fechava
    na borda; sem filete entre fileiras; alturas 67×87. Até 1180px passou a mandar a
    posição na fileira; até 768px virou uma coluna com o device das `.etapa`.
  - `max-width: 13ch` (desenho das 4 colunas do desktop) quebrava as frases em 3 linhas
    com 200px de vazio → 24ch + corpo de 17px.
  - `.cabeca-dupla .titulo-lamina { max-width: 15ch }` prendia o título da experiência em
    181px, 52% da coluna → trava removida no mobile. Experiência 3→2 linhas, método 5→4,
    e a foto de cada dobra subiu pra primeira visualização.
  - Varreduras: nenhuma grade com defeito de fim-de-fileira em 390/900; nenhum bloco de
    texto abaixo de 80% da coluna por trava de desktop; ritmo vertical já consistente
    (58px por dobra, 70px no manifesto e no fechamento, `.faixa` 20..370 em todas).
  - A dobra `#experiencia` está atendida. Eu tinha levantado "carrossel pras 3 fotos"
    como pendência, mas a ata não pede isso — ela só fala em "reorganizar" e "corrigir
    posição de títulos e imagens", que é o que foi feito. Carrossel a ata pede uma vez
    só, nos depoimentos (item 8), e esse o James deixou parado: "depois fazemos".
- Conferido em desktop (1440) e mobile (390) por screenshot, com `puppeteer-core` +
  o Chrome instalado — o projeto já tem a dependência.
- Pendente: aval do James no desktop antes da Fase 2 (mobile).

---

## 🖼️ Sessão 2026-07-31 (parte 5) — carrossel de resultados em 4:5

- O carrossel “Resultados reais” agora usa somente arquivos originados em
  `tmp/PAGINA FIO A FIO/OK_RESULTADOS`.
- A proporção predominante do acervo foi identificada como **4:5**. Foram selecionadas as 7 imagens desse
  grupo e geradas em `public/lp/fio-a-fio-realista-v2/resultados-4x5/` com 900×1125 px.
- As imagens usam enquadramento integral (`contain`) e os cards acompanham 4:5 no desktop e mobile;
  nenhuma parte das sobrancelhas é removida pelo carrossel.

---

## 📱 Sessão 2026-07-31 (parte 4) — revisão mobile integral da V2 Fio a Fio

- A V2 recebeu contenção horizontal reforçada (`max-width`, `overflow-x: clip`, `min-width: 0`) para
  impedir arraste lateral acidental sem bloquear a rolagem interna dos carrosséis.
- Hero recalibrado para 320–680 px: enquadramento de James/sobrancelha, altura fluida, logo, títulos,
  subtítulos, lista, CTA e faixa de estatísticas agora seguem uma escala específica para telas estreitas.
- Enquadramento do hero refinado novamente após revisão visual: a arte fica ancorada à direita com zoom
  progressivo de 108–115%, deixando James maior sem cortar os ombros e preservando a sobrancelha no quadro.
- Ajuste fino posterior: a arte do hero mobile foi deslocada 8 px para a direita, sem mudar zoom ou altura.
- A dobra do professor passou para fundo marfim, integrando o contorno claro do PNG; James foi alinhado à
  direita, com texto escuro e dourado de maior contraste. No desktop, texto e retrato ocupam lados opostos.
- Corrigida a cascata responsiva dessa dobra: abaixo de 900 px a grade agora usa uma única coluna real,
  impedindo a coluna desktop vazia de comprimir os textos no mobile.
- O retrato do professor agora sangra até a borda direita da seção em todas as larguras, compensando
  dinamicamente a margem do container no desktop e os gutters de 20/18 px em tablets e celulares.
- Ritmo vertical e legibilidade refinados em todas as seções: manifesto, fórmula, pilares, treino,
  currículo, acesso, professor, oferta, garantia, FAQ e fechamento.
- Carrosséis agora deixam uma margem/preview consistente, usam cards proporcionais à viewport e entregam
  o gesto horizontal nativo no touch; o arraste manual por pointer ficou restrito a mouse/caneta.
- Cards de treino deixaram alturas rígidas e passaram a usar proporções responsivas; módulos ganharam
  alvos de toque maiores; preço e CTA foram reorganizados para leitura clara em 320–380 px.
- CTA fixo respeita `safe-area-inset` do iPhone. Preferência `prefers-reduced-motion` pausa autoplay dos
  carrosséis e vídeos, e estados de foco visível foram adicionados aos elementos interativos.
- QA com user-agent de iPhone: rota e assets críticos responderam 200 com MIME correto; JavaScript e
  pares de `<style>` validados, `git diff --check` limpo, **104 testes aprovados** e build concluído.

---

## 🧵 Sessão 2026-07-31 (parte 3) — nova V2 do Fio a Fio Realista

- Criada a prévia isolada `/fio-a-fio-realista-v2`, servida por
  `app/fio-a-fio-realista-v2/route.ts` a partir de `lp-html/fio-a-fio-realista-v2.html`.
  A página oficial `/fio-a-fio-realista-by-james-olaya` permaneceu sem alterações.
- A nova LP foi reconstruída em HTML/CSS/JS limpo, inspirada no sistema cinematográfico dark + gold do
  Shadow PRO, com ameixa e rosé como apoio para acomodar as artes do curso.
- `tmp/fioafioHERO.png` virou o hero responsivo; a identidade `id fio a fio realista.png` foi tratada com
  transparência e aplicada estrategicamente no hero, no método, no currículo, na oferta e no fechamento.
- Criada `public/lp/fio-a-fio-realista-v2/` (54 arquivos, ~22 MB): 16 resultados e 21 antes/depois
  convertidos para WebP quadrado com foco nas sobrancelhas, 7 treinos, 3 vídeos selecionados e assets de
  apoio do curso.
- A narrativa nova inclui hero, manifesto técnico, dois carrosséis contínuos, fórmula do realismo,
  pilares, treino, 12 módulos, acesso, certificado, professor, oferta, garantia, FAQ e CTA final.
- A V2 usa `noindex,nofollow,noarchive`, não entrou no sitemap e preserva o checkout Hotmart
  `T98532267X?checkoutMode=10&off=tlrmqecy`.
- QA: rota oficial e rota V2 responderam 200; imagens e vídeos críticos responderam com MIME correto;
  JavaScript validado, `git diff --check` limpo, **104 testes aprovados** e build de produção concluído.

---

## ✨ Sessão 2026-07-31 (parte 2) — `/basic-magic-shadow` renomeada publicamente para Shadow PRO

- A URL, slug, arquivo HTML, pasta de assets, checkout, preço, módulos e estrutura visual foram mantidos.
- O logo do hero agora usa o oficial `public/lp/shadow-pro/logo-shadow-pro.webp`; dimensões intrínsecas
  e texto alternativo foram atualizados para Shadow PRO.
- Título, descrição, Open Graph, hero, chamada de resultados, 11 textos alternativos, oferta e mensagem
  do WhatsApp foram renomeados de Basic Magic Shadow para Shadow PRO.
- Criada `public/lp/basic-magic-shadow-v2/shadow-pro-social.jpg` (1200×630, 89 KB) com James, o fundo
  original e o logo Shadow PRO; substitui a imagem social antiga, que tinha a marca anterior impressa.
- QA HTTP local: rota, logo e arte social responderam 200 com os tipos corretos. Após remover comentários,
  CSS e JS da auditoria, nenhuma referência pública ao nome anterior permaneceu; ocorrências restantes são
  somente nomes técnicos de caminhos preservados para não quebrar assets.
- Validação final concluída: **104 testes aprovados**, `git diff --check` limpo e build de produção do
  Next.js compilado com sucesso.

---

## 🏠 Sessão 2026-07-31 — home pública e identidade administrativa

- A antiga `app/page.tsx`, que enviava usuários autenticados ao dashboard e visitantes ao login, foi
  substituída por `app/route.ts`: `/` agora entrega diretamente o HTML do site institucional
  `lp-html/jamesolaya.html`, mantendo a URL raiz sem redirecionamento.
- `/login` continua sendo a entrada explícita do painel; `/dashboard` permanece protegido e, sem
  sessão, redireciona para `/login?redirect=%2Fdashboard`.
- A conta principal `suporte@jamesolaya.com.br` agora usa o nome fixo **Administrador**. Sessões antigas
  com nome legado são normalizadas durante a leitura do JWT, sem exigir logout; o KV é corrigido no próximo
  login/leitura de usuários e o nome dessa conta não pode mais ser editado pelo dashboard.
- No menu lateral, o papel `senior` passou a aparecer como “Administrador principal”.
- QA local: `/` 200 com o título do site James Olaya; `/login` 200 com o formulário; `/dashboard` 307
  para o login. `npm run build` concluído com sucesso.

---

## 📱 Sessão 2026-07-30 (parte 19) — overflow lateral móvel corrigido

- `html` e `body` agora têm largura máxima de 100%, fundo escuro e bloqueio de overflow/overscroll
  horizontal; navegadores com suporte usam `overflow-x: clip`.
- Filhos diretos do `body` ficam limitados à largura da viewport, eliminando o espaço preto à direita
  ao arrastar no Safari móvel sem impedir a rolagem interna do carrossel.

---

## 🖼️ Sessão 2026-07-30 (parte 18) — foto antes/depois substituída

- A imagem `88648505-051D-441F-A0E1-97437117E682.JPG`, publicada como `ad-07.webp`, foi substituída
  por `tmp/basic-magic-shadow/OK_ANTES:DEPOIS/imagemantesdepoisnova.png`.
- A nova versão foi exportada em WebP 900×900, qualidade 88 e 96 KB, preservando o enquadramento
  quadrado e removendo o ícone que aparecia no canto inferior esquerdo.

---

## ➕ Sessão 2026-07-30 (parte 17) — fórmula vertical do método

- O bloco “O método é simples” passou a exibir Distribuição, Saturação, Acabamento e Degradê limpo
  em quatro linhas independentes.
- Os dois sinais de soma e o sinal de igualdade ficam centralizados entre as etapas, formando uma
  sequência vertical legível no desktop e no celular.

---

## 💬 Sessão 2026-07-30 (parte 16) — WhatsApp e oferta refinada

- O último CTA agora abre o WhatsApp `+55 19 97163-4567` em nova aba com a mensagem
  “Oi, gostaria de mais informações sobre o curso Shadow Pro.” já preenchida.
- Adicionado CTA flutuante de WhatsApp, exibido somente após cerca de 1,25 tela de rolagem; responsivo,
  acessível e com animação suave que respeita `prefers-reduced-motion`.
- A faixa vermelha “🔥 OFERTA” foi removida do card de preço. “CONDIÇÃO PROMOCIONAL” passou a aparecer
  dentro do card em um selo dourado de destaque; preço, checkout e demais informações foram mantidos.
- A rota local respondeu `200`, os dois links de WhatsApp e o novo texto foram confirmados no HTML
  servido; suíte completa com **104 testes aprovados** e `git diff --check` sem erros.

---

## ▶️ Sessão 2026-07-30 (parte 15) — movimento robusto no celular

- Carrossel “Você também pode”: velocidade passou de pixels por frame para **38 px/s por tempo real**,
  então redução de frame rate por economia de bateria não reduz o movimento quase a zero.
- Toques em telas móveis não alternam mais o estado de pausa; “clique para pausar” fica apenas em
  dispositivos com mouse preciso. `IntersectionObserver`, `visibilitychange` e `pageshow` retomam o loop.
- Vídeo da ficha: `preload="auto"`, `muted`, `playsinline` e `webkit-playsinline`; ao entrar na viewport,
  o script reforça `defaultMuted` e chama `play()`.
- Se Safari, preferência do usuário ou economia de bateria rejeitar o autoplay, aparece um botão
  acessível “Toque para reproduzir”. Ele some assim que o vídeo entra em `playing`.
- QA móvel headless: carrossel avançou 127 px/2,4 s; vídeo `readyState=4`, tocando; pausa forçada exibiu
  o fallback, e o toque retomou a reprodução.

---

## 🌟 Sessão 2026-07-30 (parte 14) — novo hero responsivo

- `tmp/Generated image 1.png` substituiu o `hero-scene.webp`: versão desktop 1677×938 em WebP, 78 KB.
- Criado recorte dedicado `hero-scene-mobile.webp` (1100×835, 64 KB) preservando James e a sobrancelha
  no banner estreito; ativado abaixo de 600 px.
- QA visual headless: 1440×900 e 390×844. Desktop mantém texto na área escura e James inteiro à direita;
  mobile mantém os dois elementos visuais acima do conteúdo, sem cortes importantes.

---

## 👤 Sessão 2026-07-30 (parte 13) — nome do professor reposicionado

- “James Olaya” agora aparece em destaque imediatamente abaixo de “Seu professor”.
- Removido o bloco inferior com “James Olaya / Fundador / Método Shadow PRO” e todo o espaço que ele
  ocupava; o CTA agora vem logo após as credenciais.
- CSS órfão de `.bio__sign` removido; alinhamento central preservado no mobile.

---

## ↕️ Sessão 2026-07-30 (parte 12) — ficha técnica alinhada

- “Você vai dominar a técnica.” agora começa obrigatoriamente em uma nova linha.
- No mobile, o espaço entre os grupos 01–04 e 05–07 foi igualado aos **22 px** usados entre os demais
  pontos; assim, o intervalo 04→05 segue o mesmo ritmo visual.

---

## 🪶 Sessão 2026-07-30 (parte 11) — peso do vídeo da ficha técnica

- `ficha-shadow.mp4` entrou com **21 MB** (720×900, 6,5 Mbps, com trilha de áudio) para rodar em
  `autoplay`/`loop`/`muted` num quadro de no máximo 320 px. O `preload="metadata"` não segura nada:
  o autoplay baixa o arquivo inteiro, então o celular puxava 21 MB logo antes da dobra da oferta.
- Reencodado para **1,8 MB** (−91%): 640×800 (2× o tamanho exibido), H.264 CRF 26 `preset slow`,
  **sem áudio** (o elemento é mudo) e `-movflags +faststart`. Mesma duração; comparação 2× nos fios
  da sobrancelha não mostra perda visível.
- Não há `ffmpeg` nem Homebrew nesta máquina — usei o binário do pacote npm `ffmpeg-static`
  instalado **fora do repo** (no scratchpad da sessão), sem tocar no `package.json`.
- Verificado em produção com Chromium headless a 390 px: `readyState=4`, `paused=false`,
  `videoWidth=640`, tocando em loop.
- `.gitignore` passou a ignorar `.claude/` e `tmp/`, que ficavam soltos como untracked toda sessão.

---

## ↵ Sessão 2026-07-30 (parte 10) — quebra no título do hero

- “(sem depender de sorte)” agora usa `display:block` e sempre começa em uma linha própria, mantendo
  tamanho, itálico e cor anteriores.

---

## 🔍 Sessão 2026-07-30 (parte 9) — “Cicatrizados reais” reformulada

- As três imagens da seção foram trocadas, na ordem solicitada: `0823D46E...`, `IMG_3653` e `IMG_4882`.
- A primeira e a terceira reutilizam os recortes 900×900 já aprovados do carrossel. `IMG_3653` ganhou
  um recorte exclusivo mais fechado em `public/lp/shadow-pro/cicatrizados/img-3653.webp`, centralizado
  nas duas sobrancelhas.
- Texto de abertura ficou mais curto e hierárquico; os três atributos agora usam cards completos.
- Desktop: grade de três cards. Mobile: três linhas horizontais com foto, número, atributo e explicação,
  eliminando o texto espremido em três colunas.
- QA visual headless em 390 px concluído; assets carregaram em 900×900.

---

## ✨ Sessão 2026-07-30 (parte 8) — oferta e CTA reformulados

- Value stack passou de linhas soltas para um card único; nomes e valores riscados agora têm colunas
  próprias no desktop e duas linhas organizadas no mobile.
- Card de preço ganhou mais hierarquia, respiro, borda luminosa e separação clara entre ancoragem,
  parcelamento, valor e pagamento à vista.
- `R$ 10,03` saiu da Cormorant e passou para **Poppins 800**, com algarismos tabulares, moeda separada e
  menor espaçamento entre dígitos para leitura imediata.
- CTA virou “Quero me inscrever agora”, com seta, brilho deslizante e pulso de luz dourado. As animações
  respeitam `prefers-reduced-motion`.
- QA visual headless em 390 px: seção com 390×1461, sem overflow; textos, preços e botão sem cortes.

---

## 🖼️ Sessão 2026-07-30 (parte 7) — carrossel reconstruído com `OK_RESULTADOS`

- A seleção anterior do carrossel “Você também pode” estava incorreta e foi removida integralmente.
- Nova fonte única: as **10 imagens** existentes em `tmp/basic-magic-shadow/OK_RESULTADOS/`.
- Gerados 10 WebPs em `public/lp/shadow-pro/resultados/`, todos quadrados 900×900 e com as sobrancelhas
  centralizadas. Sete usaram recorte por atenção; `7E2280...`, `IMG_3608` e `IMG_3653` receberam recortes
  manuais por serem fotos mais abertas.
- O carrossel agora tem duas metades idênticas de 10 imagens, preservando o loop infinito.
- Os assets antigos não foram apagados porque continuam usados em outras seções da LP; saíram somente
  deste carrossel.

---

## 🎓 Sessão 2026-07-30 (parte 6) — certificado correto do Shadow PRO

- `public/lp/shadow-pro/certificado.webp` foi substituído pela arte
  `tmp/SHADOWPRO_ONLINE - CERTIFICADO PMUCLASS.png`, que identifica corretamente o curso **Shadow PRO**.
- Exportação WebP em 1600×1131, qualidade 92, 63 KB; o PNG original em `tmp/` foi preservado.
- O HTML continua usando o mesmo caminho do asset; alt atualizado para “Certificado Shadow PRO”.
- Resolvida a pendência histórica: o certificado anterior exibia “Basic Magic Shadow”.

---

## 🎬 Sessão 2026-07-30 (parte 5) — vídeo na ficha técnica

- A imagem central `ficha-brow.webp` do bloco “Tudo o que você precisa…” foi substituída pelo vídeo
  `3AAAEF40-C542-4684-AC37-6F5FA5B0C5C9.MP4`, publicado como
  `public/lp/shadow-pro/ficha-shadow.mp4`.
- O vídeo roda com `autoplay loop muted playsinline`, sem controles; `ficha-brow.webp` permanece como
  poster enquanto o MP4 carrega.
- A moldura, proporção 4:5 e cantos dourados foram preservados; CSS compartilhado entre imagem e vídeo.
- O MP4 original tem cerca de 20 MB. O conversor nativo não aceitou um contêiner de saída compatível
  nesta máquina, então o original foi preservado sem perda de qualidade.

---

## 🏛️ Sessão 2026-07-30 (parte 4) — novas fotos nos 4 pilares

- As fotos do bloco “Os 4 pilares do Método” foram trocadas, na ordem pedida, por `IMG_3653.JPG`,
  `0823D46E-585F-44CF-9BB4-5CBD54761F93.JPG`, `62CC35C3-3A30-4497-9222-4D5B14613E1E.JPG` e
  `IMG_4882.JPG`.
- Foram geradas versões WebP quadradas de 900×900 em `public/lp/shadow-pro/pilares/` (67–127 KB);
  originais em `tmp/basic-magic-shadow/OK_RESULTADOS/` preservados.
- Removido o traço decorativo interno acima de “O cicatrizado bonito”
  (`.temple__beam::before`); moldura e ornamento inferior preservados.

---

## 🖼️ Sessão 2026-07-30 (parte 3) — curadoria visual da `/metodo-shadow-pro`

- Eyebrow do carrossel: **“Prova social” → “Você também pode”**.
- Naquela rodada, o carrossel havia sido reduzido de 20 para 14 imagens únicas. **Seleção substituída
  integralmente na parte 7** pelas 10 fotos da pasta `OK_RESULTADOS`.
- `res-02.webp` removida também da seção “Cicatrizados” e excluída de
  `public/lp/shadow-pro/alunas/`, portanto deixa de existir em toda a LP e no endereço público após deploy.
- `res-03`, `res-05` e as demais imagens pedidas apenas para o carrossel continuam nas outras composições
  da página onde já eram usadas.

---

## 🔗 Sessão 2026-07-30 (parte 2) — slug `/metodo-shadow-pro`, GTM próprio e qualidade do CAPI

**Renomeação de slug** (`metodo-shadow-pro-2` → `metodo-shadow-pro`). O "-2" vinha da recriação: a página
WP original foi excluída e a LP nasceu nesse slug. Mesmo padrão do `basic-magic-shadow-v2`:
- `git mv` do HTML e da rota; **novo** `app/metodo-shadow-pro-2/route.ts` com redirect **308**.
- 5 referências atualizadas: `lp-html-registry.ts` (slug, htmlFile **e** `lpHtmlRedirects`),
  `meta-tracking.ts` (`PIXEL_SLUGS` — esquecer aqui derrubaria o Pixel da página), `app/sitemap.ts`,
  `reserved-slugs.ts` (novo **+ o antigo**, que o redirect ocupa) e `CLAUDE.md`.
- `lib/page-catalog.test.ts` é a rede de segurança: confere registro × arquivos reais.

**GTM-NGVQTHXT** adicionado ao `GTM_BY_SLUG` (4º container por página). Nada de colar snippet no HTML —
o `withTracking` injeta head + noscript e limpa qualquer container antigo.

**Meta CAPI — o aviso de IPv6 do Events Manager NÃO tem correção nossa.** Investigado:
`dig AAAA www.jayacademy.com.br` → vazio, e a **Vercel não suporta IPv6 em domínio custom**
(https://vercel.com/docs/domains/troubleshooting). Não existe AAAA pra apontar. A própria Meta diz que
avisos não acionáveis podem ser ignorados. ⚠️ Não reinvestigar.
O `client_ip_address` já era enviado. O que faltava mesmo era qualidade de correspondência:
- front (`meta-tracking.ts`) passou a mandar **`_fbp`/`_fbc`** no `userData`; se o `_fbc` ainda não virou
  cookie, é derivado do `fbclid` da URL (`fb.1.<ts>.<id>`). O `_fbp` é gravado pelo `fbevents.js`, que é
  async — por isso o envio espera 1,2s quando o cookie ainda não existe.
- `app/api/meta-capi/route.ts`: `userData` virou **allowlist `{fbp, fbc}`** (o corpo vem do browser; sem
  isso dava pra injetar `em`/`ph` falsos e envenenar a correspondência da conta).
- `lib/meta-capi.ts` passou a reusar o **`clientIp()`** do `rate-limit-core` (cobre `x-real-ip` também) e
  omite o IP quando ele seria `"unknown"`.
Verificado em browser headless: o POST para `/api/meta-capi` sai com `fbp` e `fbc` preenchidos.

---

## 📱 Sessão 2026-07-30 — UX mobile da `/metodo-shadow-pro-2` (Shadow PRO)

James abriu a LP no celular e mandou 7 prints. Todos apontavam a mesma coisa: **a foto do procedimento é o
produto** e estava sendo cortada, encolhida ou coberta por tarja/badge/legenda. Sessão de CSS mobile, troca
de imagem e ordem de seção — a copy dos argumentos não mudou.

O que foi feito em `lp-html/metodo-shadow-pro-2.html`:
1. **Hero** — banner de `64vw/max 380px` → `76vw/max 440px` e `background-position` de `82%` → `92% top`.
   Aumentar a altura corta MAIS na horizontal (o `cover` escala pela altura), por isso as duas coisas andam
   juntas; a `92%` o James fica inteiro. O `padding` do `.hero__in` virou `calc(min(76vw,440px) - 46px)` —
   antes ignorava o `max-height` e desalinhava perto de 600px de largura.
2. **Banner da sobrancelha** (`.prova::after`) — `center 32%` → `left 32%`: a sobrancelha fica no terço
   esquerdo da `prova-editorial.webp` e estava sendo comida pelo recorte central.
3. **4 pilares** — `pilar1..4.webp` → `alunas/res-09/08/05/10.webp`; no mobile o `.tcol__shaft` virou
   quadrado e o `.tcol__b` **saiu de dentro do shaft** (agora é irmão dele, com `flex:1` pra alinhar as
   bases douradas). No desktop nada mudou: `.tcol` ganhou `position:relative` e o `.tcol__b` continua
   absoluto, só que ancorado a `bottom:13px` (a altura da base) em vez de `bottom:0` do shaft.
4. **Ficha técnica** — `bp-brow.webp` → `alunas/res-03.webp` com `object-position:center 34%` (corta a
   máscara cirúrgica que aparecia embaixo); a regra `.bp-plate::after` (legenda "FIG. 01 · SHADOW NATURAL
   CICATRIZADO") foi apagada. Os 7 pontos numerados continuam.
5. **Resultados reais** — a regra `.carousel__track figure::after` (tarja "Aluna Jay Academy") saiu; título
   virou "Resultados reais de quem aplicou o método" e o subtítulo perdeu o "de alunas". A seção **subiu
   para a 3ª posição** (logo depois da `.prova`), levando junto o "Antes e depois" — ordem hoje:
   hero → prova → resultados → antes/depois → problema → … → certificado → oferta.
6. **Antes e depois** — o quadrado saiu do `img` e foi para o card (`.ba__item{aspect-ratio:1}` + img
   absoluta), padrão que o arquivo já usa em `.col`/`.tcol__shaft`/`.proofz__hero`. A legenda
   "Antes · Depois" foi **para o topo** do card: a metade de baixo é o "depois" e não pode ter tarja.
7. **Cicatrizados (SEM FILTRO · RAW)** — herói `s4` → `alunas/res-02`, medalhões `s3/s2/s1` →
   `res-05/res-03/res-10`, e o `transform:scale(1.4)` do `.proofz__coin img` saiu (ampliava tanto que só
   sobrava pele). Nenhuma imagem nova precisou ser gerada.

**Ajustes seguintes na mesma sessão:**
- As 8 legendas "Antes · Depois" saíram (e as regras de CSS delas) — o James pediu a grade mais clean;
  o próprio corte quadrado já separa o antes (em cima) do depois (embaixo).
- A dobra **"Por que a maioria erra"**, a única longa 100% texto, ganhou uma ilustração: a prancha de
  treino em pele sintética (degradê ponto a ponto) que o James deixou em `tmp/ERROS.png`. Virou
  `public/lp/shadow-pro/mapa-degrade.webp` e entra como `<figure class="diagfig">` entre o subtítulo e a
  lista dos 3 erros, num card claro com os cantinhos dourados **reusados** do `.bp-plate` (seletores
  estendidos, sem duplicar CSS).
  - O PNG tinha 819×819 e 567 KB, mas **70% era branco vazio** (a arte só ocupa `y 272-513`). Cortado para
    faixa horizontal 739×361 → 900×440 em WebP q78 = **30 KB**.
  - ⚠️ `width:100%` **sem `height:auto`** deixou o atributo `height="440"` valer e a arte saiu esmagada;
    peguei no primeiro render headless. Vale pra qualquer `<img>` com width/height explícitos neste arquivo.

- **Zoom travado na página**: `maximum-scale=1.0, user-scalable=no` no `<meta viewport>`,
  `touch-action:manipulation` + `text-size-adjust:100%` no `body` (mata o zoom de duplo-toque) e um
  script no rodapé cancelando `gesturestart/change/end` e `touchmove` com mais de um dedo —
  **o Safari do iOS ignora `user-scalable=no` desde o iOS 10**, o meta sozinho não resolve.
  Só nesta LP; é uma escolha do James, e vale lembrar que travar zoom atrapalha acessibilidade.
- **FICHA TÉCNICA**: a `res-03` tinha uma máscara cirúrgica na base. Em vez de empurrar com
  `object-position`, gerei um recorte dedicado `public/lp/shadow-pro/ficha-brow.webp`
  (crop 544×680 da `res-03` → 700×875, 36 KB) com a sobrancelha centralizada; o `object-position:center 34%`
  foi removido.

**Rodada de oferta honesta (mesma sessão):**
- 🚨 **A LP anunciava um preço que não era o cobrado.** Ela dizia 12x R$ 20,37 / R$ 197,00, mas o botão
  leva ao checkout `E98531587I?off=k2warcrt` — **o mesmo link da `/basic-magic-shadow`** — que cobra
  **12x R$ 10,03 / R$ 97,00** e exibe o produto "Basic Magic Shadow". Descoberto ao comparar as duas LPs.
  Decisão do James: **alinhar a LP ao checkout** (R$ 97). ⚠️ As duas LPs dividem o mesmo produto Hotmart;
  mexer no preço de uma tem que considerar a outra.
- **Contadores removidos** (barra do topo e caixa de preço), junto com o JS de countdown e o
  `shpro_deadline` no `localStorage`. Eram 30 min que reiniciavam sozinhos a cada visitante.
- **Urgência reescrita** sem prazo inventado: "Condição promocional: o valor pode subir sem aviso.
  Entrando hoje, você trava esse preço." + ancoragem **de R$ 1.985,00** (soma real dos 5 itens).
- **Value stack** em "A oferta completa": 5 itens com valor riscado (997+397+97+297+197) + os 2 itens que
  a lista antiga prometia e não estavam no stack (certificado e desconto Jayloja) — não podiam sumir calados.
- **Seção "Da tentativa à decisão" removida** inteira, com o CSS `.tecnica*`/`.shift*` que ficou órfão.
- **"É pra você / Não é pra você"** deixou de ser o `.split` (foto de fundo + faixa diagonal que cortava o
  texto no celular) e passou a usar o **`.forwho`, que já existia no CSS e nunca tinha sido usado**.
  Todo o CSS `.split*` saiu. A página deixou de baixar `prova-editorial.webp` uma segunda vez.
- **Listas desalinhadas**: a causa era o `.wrap.center` — o texto dentro dos `<li>` flex herdava
  `text-align:center` e quebrava centralizado. Resolvido com `text-align:left` + `align-items:flex-start`.
- **Logo** `SHADOW PRO` (de `tmp/`) no topo do hero, no lugar do título tipográfico → `logo-shadow-pro.webp`
  (24 KB, com alpha). ⚠️ O override `margin-left:0` do desktop **tem que vir depois** da regra base no
  arquivo — mesma especificidade, quem vence é a ordem; na primeira tentativa o logo ficou centralizado.

⚠️ **Pegadinha nova**: `lib/serve-lp.ts` tem um `diskCache` em memória — **editar o HTML de uma LP não
aparece no `npm run dev` sem reiniciar o servidor**. Perdi um ciclo de screenshots achando que o CSS não
tinha aplicado.

Verificação (headless a 390px e 1440px, via playwright no scratchpad): 40 figures no `#carTrack` com as duas
metades de 20 idênticas, 8 `.ba__item`, 0 "Aluna Jay Academy", 0 "FIG. 01", 0 "de alunas", checkout Hotmart
intacto (×2), 0 `GTM-`, 30/30 imagens em 200, sem rolagem horizontal real (o `scrollWidth` de 410 é o track
do carrossel, `body` tem `overflow-x:hidden` e `scrollX` fica 0). 104/104 testes passando.

---

## 🖼️ Sessão 2026-07-29 (parte 7) — mais prova visual na `/metodo-shadow-pro-2` (Shadow PRO)

James pediu para pegar a copy da LP do **Shadow PRO** e reforçá-la com as fotos de resultado que só existiam
na `/basic-magic-shadow`. Decisões dele: editar a `/metodo-shadow-pro-2` no lugar (sem slug novo), criar
**seção nova de antes-e-depois + carrossel maior**, e usar **legenda neutra "Aluna Jay Academy"** (as fotos são
de alunas do curso Basic — não afirmamos que fizeram o Shadow PRO).

**Diagnóstico**: o carrossel de "Resultados reais" tinha 20 `<figure>` mas **só 10 imagens únicas** (a lista era
duplicada só para o loop infinito) e a página **não tinha nenhum antes-e-depois**.

**O que mudou em `lp-html/metodo-shadow-pro-2.html`** (52 inserções, 2 remoções — arquivo único):
1. **Carrossel 10 → 20 imagens únicas**: as 10 `res-01..10.webp` foram intercaladas com as 10 originais de
   `/lp/shadow-pro/`, e o grupo foi duplicado **exatamente** (40 figures).
   ⚠️ A duplicação exata é obrigatória: o auto-scroll faz `scrollLeft -= scrollWidth/2` — metades diferentes = salto visível.
2. **Seção nova "Antes e depois"** entre a prova social e `#oferta`: grid `.ba` com as 8 fotos `ad-01..08.webp`,
   legenda "Antes · Depois", CTA "Quero esse padrão no meu trabalho". Reusa as classes existentes
   (`.sec`, `.wrap.center`, `.eyebrow`, `.sec-title`, `.meandro`, `.sec-sub`, `.cta`) — nasceu no mesmo visual dourado/escuro.
   CSS novo `.ba/.ba__item` colado depois das regras do `.proofz`; 4 colunas no desktop, 2 em `@media(max-width:900px)`.
3. **Legenda neutra**: `.carousel__track figure::after{content:"Aluna Jay Academy"}` (era "Aluna Shadow PRO") — vale para as 40.
4. `.sec-sub` do carrossel passou a citar o volume: "Dezenas de trabalhos reais de alunas — …".

**Assets** (novos, versionados): `public/lp/shadow-pro/alunas/` — 18 WebP (8 `ad-*`, 10 `res-*`) gerados com
`sharp@0.34.5` (já estava em `node_modules`) a partir dos JPG de `public/lp/basic-magic-shadow-v2/`.
- Os JPG originais **não foram tocados** — a `/basic-magic-shadow` continua servindo deles.
- **Pegadinha de peso**: os 18 JPG somavam **4,8 MB**. Na primeira conversão (1100 px / q80) deram 1,87 MB, ainda
  demais. Como essa LP **não tem lightbox** (o maior display é ~300 px), 900 px / q74 é suficiente: **1,29 MB no total**.

**Verificação**: dev :4000 HTTP 200; no HTML servido — 40 figures / **20 URLs únicas** no `#carTrack`, as duas
metades **byte-idênticas** (diff), 8 `.ba__item`, 0 referência a `basic-magic-shadow-v2`, 18/18 imagens novas em 200,
checkout Hotmart intacto (2 ocorrências). Testes: **104/104**.

**Nota**: a `/metodo-shadow-pro-2` **está na allowlist do Meta Pixel** (`lib/meta-tracking.ts:41`) — o `fbq` no HTML
servido é da política por página, não veio dessa mudança. Sem GTM nessa página, como esperado.

---

## ✍️ Sessão 2026-07-29 (parte 6) — copy da `/basic-magic-shadow`: CTA imperativo + fim da escassez

James pediu duas adaptações na LP `lp-html/basic-magic-shadow.html` (só copy, zero CSS/JS estrutural):

**1. Os 12 CTAs viraram imperativos.** Eram desejos em 1ª pessoa ("EU QUERO",
"EU QUEROOOOOOOOOOOOOO!", "ONDE EU PASSO O CARTÃO?"); agora são comandos, mantendo a
irreverência da página (decisão do James: nada de tom corporativo):

| Antes | Depois |
|---|---|
| EU QUERO | COMECE A FATURAR MAIS HOJE |
| ACABARAM MINHAS DESCULPAS (×2) | PARE DE INVENTAR DESCULPA / DÊ O PRÓXIMO PASSO NA CARREIRA |
| ONDE EU PASSO O CARTÃO? | PEGA O CARTÃO E VEM COMIGO |
| QUERO SER A PRÓXIMA A TER SUCESSO! | SEJA A PRÓXIMA A FATURAR ALTO |
| ESTOU DISPOSTA A PAGAR AGORA! | INVISTA NA SUA EVOLUÇÃO AGORA |
| EU QUEROOOOOOOOOOOOOO! | COBRE O QUE VOCÊ MERECE COBRAR |
| QUERO APRENDER ISSO PELO AMOR DE DEUS | APRENDA ISSO DE UMA VEZ POR TODAS |
| PELO AMOR DE DEUS! ONDE EU PASSO O CARTÃO? | CHEGA DE PENSAR — VEM APRENDER |
| TOQUE AQUI E COMPRE AGORA (botão verde) | GARANTA SEU ACESSO AGORA |
| ACHO QUE VOU INFARTAR! ONDE EU PAGO? | NÃO PENSE DUAS VEZES, GARANTA JÁ |
| QUERO MINHA VAGA AGORA! | GARANTA SUA VAGA AGORA |

`FALE CONOSCO NO WHATSAPP` ficou como estava (já imperativo). URL do checkout Hotmart
intocada (`E98531587I?checkoutMode=10&off=k2warcrt`).

**2. Escassez → faturamento / aprendizado / evolução.** As 3 menções de "promoção acabando":
- marquee (`TEXTO_MARQUEE`): `PROMOÇÃO VAI ACABAR A QUALQUER MOMENTO ✦` → `MAIS FATURAMENTO ✦ MAIS TÉCNICA ✦ MAIS EVOLUÇÃO ✦`
- rótulo do contador (`.urgencia-txt`): `POSSO GARANTIR ESSA PROMOÇÃO POR APENAS:` → `SUA EVOLUÇÃO PODE COMEÇAR EM:`
- texto de contador zerado (`encerra()`): `Última chance — oferta encerrando` → `Sua evolução não espera — comece agora`

O **contador de 15 min continua** (decisão do James) — só o texto ao redor mudou.

**Pegadinha de layout**: os CTAs vivem numa caixa de largura fixa (`--btn-larg`) e o texto
quebra dentro dela. O maior texto novo tem 33 caracteres contra 42 do antigo, então não há
risco de estouro. O botão verde usa `--btn-larg-destaque` a 18px: 24 caracteres (era 25).

**Verificação**: dev :4000 → HTTP 200; HTML renderizado com os 12 CTAs novos, 0 ocorrências
das 3 frases de escassez, GTM-W394J499 presente (script+noscript), link Hotmart intacto;
104/104 testes verdes.

---

## 🎯 Sessão 2026-07-29 (parte 5) — um container de GTM POR PÁGINA

James pediu containers próprios em duas LPs: **GTM-W394J499** na `/basic-magic-shadow` e
**GTM-NB2WK5SJ** na `/fio-a-fio-realista-by-james-olaya`. Cada um vale só na sua página.

**O que mudou:** o modelo "1 container global + allowlist de slugs" virou **mapa slug → container**
(`GTM_BY_SLUG` em `lib/google-tag.ts`). Adicionar LP agora é **1 linha no mapa**:

| Página | Container |
|---|---|
| `/magicshadow` | `GTM-TVLJSVJZ` (container do marketing/Gabriel) |
| `/basic-magic-shadow` | `GTM-W394J499` |
| `/fio-a-fio-realista-by-james-olaya` | `GTM-NB2WK5SJ` |
| resto | nenhum — o GTM é removido ao servir |

- `lib/google-tag.ts`: `GTM_SLUGS` (array) → **`GTM_BY_SLUG`** (`Record<slug, containerId>`);
  `slugHasGoogleTag()` → **`gtmIdForSlug()`** (usa `Object.hasOwn`, então slug da URL não alcança
  o `Object.prototype`); `withGoogleTag(html)` → **`withGoogleTag(html, gtmId)`**. `GTM_ID`
  segue exportado como o container padrão do marketing (é o citado no CLAUDE.md).
- Saiu a migração cega do `OLD_GTM_ID` (`GTM-NN5KDTCB` → novo): com dois containers em jogo, um
  replace de ID é armadilha. `withTracking` agora **sempre** faz `stripGoogleTagManager` e só
  então injeta o container do slug (se houver) — nunca sobra container a mais nem o antigo.
- Novo `lib/google-tag.test.ts` (10 casos): mapa, `Object.prototype`, posição do snippet
  (loader no topo do `<head>`, noscript logo após o `<body>`), idempotência, HTML sem head/body,
  e "limpar + injetar deixa exatamente 1 loader e 1 noscript" partindo do container antigo embutido.
- Comentário do `app/layout.tsx` atualizado (falava de `GTM_SLUGS`).

**Verificado:** 104/104 testes, `tsc --noEmit` limpo, build ok. Runtime (dev na 4000 + produção,
10 páginas cada): `/basic-magic-shadow` → 1 loader + 1 noscript do `GTM-W394J499`;
`/fio-a-fio-realista-by-james-olaya` → 1+1 do `GTM-NB2WK5SJ` e **zero** `GTM-NN5KDTCB` (o embutido
do WP sumiu, era o risco); `/magicshadow` → só TVLJSVJZ; as outras 7 → zero `gtm.js`. Em todas,
Pixel `1841776429524244` (nas 7 de curso) e GA4 `G-N93TQZV050` intactos.

**Como adicionar container numa próxima LP:** 1 linha em `GTM_BY_SLUG` + 1 asserção em
`lib/google-tag.test.ts`. Não precisa tocar em `withTracking` nem nas rotas.

⚠️ **Pendência pro James:** essas LPs já disparam o Pixel DSTV pelo portal. Se um container
(W394J499 / NB2WK5SJ) tiver tag de Meta Pixel configurada dentro dele, a página conta PageView
**duas vezes** — foi exatamente o que o TVLJSVJZ faz na `/magicshadow` (injeta o `935630436819595`).
Conferir as tags dos containers no GTM.

---

## 🎯 Sessão 2026-07-29 (parte 4) — Tracking deixou de ser global

**Antes:** `withTracking()` colava o MESMO stack (GTM + GA4 + Pixel + CAPI) em toda página
pública, e as 62 páginas migradas do WP ainda traziam pixels do Pixel Cat gravados no HTML.

**Política agora (decisão do James), declarada em código:**

| Tag | Onde vale | Allowlist |
|---|---|---|
| **Pixel DSTV `1841776429524244`** | só as 7 LPs de **curso online** | `PIXEL_SLUGS` em `lib/meta-tracking.ts` |
| **GTM-TVLJSVJZ** | só a `/magicshadow` | `GTM_SLUGS` em `lib/google-tag.ts` |
| **GA4 `G-N93TQZV050`** | todas | — (fluxo "site" do jayacademy.com.br, código 4463452239, coleta ativa) |

As 7 de curso: `basic-magic-shadow`, `basic-nanofios`, `curso-online-profissao-remove`,
`fio-a-fio-realista-by-james-olaya`, `metodo-shadow-pro-2`, `pdv-lips-sense-technique`, `pmuclass`.

**Como:** novo `lib/tracking-clean.ts` (funções PURAS, 10 testes em `tracking-clean.test.ts`):
`stripGoogleTagManager` (casa pelo `gtm.js`/`ns.html`, então pega qualquer container) e
`stripPixelInits(html, keepIds)` (remove `fbq('init')` fora da allowlist + os `tr?id=` deles;
não toca no stub do `fbq` nem nos `track()`, então nada quebra). `withTracking` passou a
receber `slug` e **limpa antes de injetar** — os 3 pontos de chamada (`serve-lp.ts` e as duas
em `app/p/[slug]/route.ts`) repassam o slug. `withGa4Legacy` virou `withGa4Site` (não é
legado: é a medição em uso, confirmada no painel do GA4).

**Por que limpar e não só parar de injetar:** 3 LPs (`basic-nanofios`,
`fio-a-fio-realista-by-james-olaya`, `pdv-lips-sense-technique`) têm GTM **embutido** com o
container ANTIGO `GTM-NN5KDTCB`; o `withGoogleTag` reescrevia pro novo ao servir. Sem a
limpeza, elas voltariam a carregar o container velho.

**Verificado em runtime** (Chrome real, beacons contidos por `MAP www.facebook.com 127.0.0.1`):
- `/basic-magic-shadow`: PageView, ViewContent, InitiateCheckout, WhatsApp no DSTV, CAPI com o
  mesmo eventID — e o pixel `935630436819595` **desapareceu** (era o GTM que o injetava).
- `/inmersion-pelo-a-pelo` (não-curso): **zero** requisições pro Facebook.
- `/magicshadow`: GTM ativo — e ele injeta o `935630436819595` por conta própria. Ou seja:
  **a única página com GTM segue disparando o pixel do container**, o que é configuração
  dentro do GTM, não código.

**⚠️ Efeitos colaterais aceitos:** 67 páginas não-curso perderam o pixel — inclusive as
`/acao-*` e `/campanha-*`, que são de anúncio (param de alimentar remarketing/conversão do
Meta). E sem GTM elas perdem o GA4 do marketing (`G-K3K6P8N1E9`) e conversões de Google Ads
do container; o GA4 `G-N93TQZV050` segue medindo visitas. O beacon interno `/api/track`
continua em todas — o analytics do painel não foi afetado.

**Quarto ponto de injeção, achado só na conferência pós-deploy:** o `app/layout.tsx` (layout
RAIZ do React) também colava o GTM — logo o **painel admin inteiro** e a `/apresentacao-pmu`
carregavam o container, fora do `withTracking`. Removido. A `/magicshadow` não usa esse
layout (é route handler), então segue com GTM.

**Nota de método:** a primeira varredura contou 5 "pixels" na `fio-a-fio-realista` que eram
**nomes de arquivo de vídeo do Instagram** com 16 dígitos. Virou caso de teste — a limpeza só
casa `fbq('init')` e `tr?id=`, nunca número solto no HTML.

---

## 🛒 Sessão 2026-07-29 (parte 3) — Auditoria dos links de checkout Hotmart

Conferência dos 5 cursos online contra os links oficiais passados pelo James. Regra: todo
checkout precisa de **`checkoutMode=10` + o `off=` da oferta certa** (faltando qualquer um,
o checkout embutido/oferta quebra).

### Estado das 5 LPs (todas com 1 link Hotmart; os outros CTAs são âncoras `#VALOR`/`#preco`)
| Curso | Arquivo | Antes |
|---|---|---|
| Basic Magic Shadow | `lp-html/basic-magic-shadow.html` | ✅ `E98531587I?checkoutMode=10&off=k2warcrt` |
| Basic Nano Fios | `lp-html/basic-nanofios.html` | ❌ faltava `checkoutMode=10` (2 CTAs) |
| Fio a Fio Realista | `lp-html/fio-a-fio-realista-by-james-olaya.html` | ✅ `T98532267X?checkoutMode=10&off=tlrmqecy` |
| Lips Sense | `lp-html/pdv-lips-sense-technique.html` | ✅ `Y98532335W?checkoutMode=10&off=jxkw3xrd` |
| Profissão Remove | `lp-html/curso-online-profissao-remove.html` | ✅ `G106407672I?checkoutMode=10&off=umo46sbb` |

### Corrigido (commit `cd0cfc3`, já em produção)
- `lp-html/basic-nanofios.html` — os 2 CTAs ganharam `checkoutMode=10`.
- `lib/lp-content-store.ts` — hero slide do Lips Sense no PMU CLASS estava com o link pelado
  `pay.hotmart.com/Y98532335W`; agora completo. (O KV `lp-content:pmuclass` não tinha cópia
  salva, então o default do arquivo valeu — confirmado no `/api/lp-content/pmuclass`.)
- `public/pmuclass/assets/index-BNudAzTv.js` (bundle da SPA, **não há fonte no repo** — edição
  por substituição literal de string): Nano Fios ganhou `off=rckismlc`, Lips Sense ganhou
  `checkoutMode=10&off=jxkw3xrd` (3 lugares) e o card `lips-sense-technique` deixou de apontar
  pro placeholder `seu-link-aqui`.

### Pendências conhecidas (não são bug de agora)
- Sobram **4 `pay.hotmart.com/seu-link-aqui`** no bundle do PMU CLASS, em cursos de demonstração
  que não existem (`microblading-avancado`, `microblading-eyeliner`, `nanoblading-masterclass`,
  `labial-expert-pro`) — sem link oficial pra colocar.
- O prompt do chat do PMU CLASS cita `go.hotmart.com/Y98532335W?ap=61e1` pro Lips Sense — host e
  parâmetros diferentes do checkout do site. Conferir com o James se é intencional.
- `/metodo-shadow-pro-2` aponta pro checkout do **Basic Magic Shadow** (`E98531587I`) —
  confirmado pelo James como **intencional por enquanto**.

---

## 🔒 Sessão 2026-07-29 (parte 2) — Varredura de segurança (foco: edição externa)

**A LP em si está limpa:** HTML estático do repo (só muda por commit+push), sem form, sem
iframe, todo `target="_blank"` com `rel="noopener"`, um único `<script src>` externo (gtag).

### ⚠️ Descoberta que muda o modelo de ameaça das server actions
No Next 16 a action **não** é despachável em qualquer rota: o
`server-reference-manifest.json` lista os `workers` (rotas) autorizados por ID. Testado em
produção: postar o ID da `uploadImageAction` em `/` ou `/login` → **404 "Server action not
found"**; postar nas 3 rotas que a importam (`/lps/[slug]/build`, `/lps/[slug]/edit-visual`,
`/wp-pages/[domain]/[slug]/edit`) → **307 pro /login** (middleware). Ou seja: **anônimo não
alcança server action de rota admin**. O risco real das actions sem guarda era o `viewer`
(role read-only) conseguir escrever.

### Corrigido
- **`uploadImageAction`** (`app/wp-pages/[domain]/[slug]/edit/upload-action.ts`) — era a
  única action de escrita sem checagem própria: agora `requireAdmin()` + rate-limit 60/min.
- **Login sem rate-limit** (`app/login/actions.ts`) — força bruta na senha do senior era
  ilimitada: agora 10 tentativas / 5 min por IP.
- **`connectLp`** (`lib/connect-lp.ts`) — grava dentro de `lib/landing-pages.ts`; o `escape()`
  não tratava quebra de linha (injeção de código no arquivo TS). Agora `requireAdmin()`,
  controles achatados em espaço, `slug` por regex, pasta sem `..`, `devUrl` só http(s).
- **`middleware.ts`** — tinha o próprio fallback `"jayacademy-dev-secret…"`; passou a
  importar `AUTH_SECRET` de `lib/auth-secret.ts` (que falha rápido na Vercel sem a env).
- **`/api/track`** — sem same-origin, qualquer site inflava as visitas de qualquer slug:
  agora `isSameOrigin(req, true)` (`allowEmpty` porque o beacon keepalive às vezes vai sem Origin).
- **`submitFormAction`** (`app/f/[slug]`) — só tinha honeypot; ganhou 15/min por IP.
- Novos helpers em `lib/rate-limit.ts`: **`rateLimitByIp`** + **`clientIpFromHeaders`**
  (server action não tem `Request`; o IP sai do `headers()`). `rateLimit` delega pro novo.

### Recomendação que NÃO é código
O maior vetor de "edição externa" da página é o **GTM (GTM-TVLJSVJZ)**: ele injeta JS
arbitrário em todas as LPs (foi ele que colocou o pixel `935630436819595` lá). Quem tiver
acesso à conta pode trocar o link do checkout ou capturar leads **sem deploy**. Revisar
acessos + 2FA no Google Tag Manager e no Meta Business.

**CSP:** decisão do James de manter sem, pra não arriscar o rastreamento.

---

## 🆕 Sessão 2026-07-29 — v2 do Basic Magic Shadow vira a oficial + auditoria do Pixel

### A v2 assumiu `/basic-magic-shadow`
- `lp-html/basic-magic-shadow-v2.html` → `lp-html/basic-magic-shadow.html` (o export do
  Elementor foi aposentado; recuperável no histórico do git). Ele ainda puxava 10 assets de
  `jayacademy.com.br` — agora a página é 100% self-contained.
- `app/basic-magic-shadow/route.ts` perdeu o `delazy: true` (pipeline só faz sentido pro HTML do WP).
- `app/basic-magic-shadow-v2/route.ts` virou **redirect 308** pro slug oficial; registrado em
  `lpHtmlRedirects`. A entrada do registro perdeu a duplicata e aponta `assetsDir` pra
  `public/lp/basic-magic-shadow-v2/` — pasta mantida com o sufixo pra não reescrever 42 refs.
- `public/lp/basic-magic-shadow/` (432 KB, assets só da v1) apagado.
- **Escopo:** só o portal. `jayacademy.com.br` continua no WordPress (Cloudflare + PHP) — a
  troca de DNS segue pendente, então o público que chega pelo domínio ainda vê a página velha.
- Sem `canonical`/`og:url` de propósito: apontar pro domínio hoje mandaria o Google preferir
  a versão do WordPress. Adicionar quando o DNS virar.

### Auditoria do Meta Pixel 1841776429524244 (runtime, Chrome real)
Script descartável com `puppeteer-core` (o mesmo que entrou pra feature "Copiar de uma URL"),
com `--host-resolver-rules=MAP www.facebook.com 127.0.0.1` pra não sujar a conta com evento de teste.

- ✅ **PageView, ViewContent, InitiateCheckout (clique Hotmart) e WhatsApp (clique wa.me)**
  todos disparando no pixel certo, cada um com `eventID` próprio.
- ✅ O POST pro `/api/meta-capi` usa o **mesmo `eventID`** do PageView (dedup correta).
- ⚠️ **`META_ACCESS_TOKEN` NÃO existe nas envs de produção** (`vercel env ls production`) →
  `sendMetaCapiEvent` faz no-op silencioso: **o CAPI de servidor não está mandando nada pro
  Meta hoje**. Só o pixel de browser rastreia. Pra ligar: criar a env com um token de acesso
  do Events Manager. `/settings` mostra isso na linha "Meta CAPI (servidor)".
- 🔎 O **GTM (GTM-TVLJSVJZ) injeta um segundo pixel, `935630436819595`**, que espelha todos os
  eventos (incluindo os automáticos, Scroll/SubscribedButtonClick). O terceiro pixel que roda
  no WordPress (`872802227099574`) **não** existe no portal.
- 🐞 **Pegadinha pra próximas auditorias:** em Chrome **headless** o `fbevents.js` carrega,
  processa os `fbq()` e não emite beacon nenhum pro `/tr` — comprovado também contra a página
  do WP em produção, que rastreia normalmente. **Auditoria de pixel exige `headless: false`.**

---

## ✅ Feature "Copiar de uma URL" — CONSTRUÍDA + ENDURECIDA (24/07), falta James retestar

> **24/07:** James copiou a Wikipedia no QA → veio SEM ESTILO. Rodei **3 auditorias adversariais** (o "READY TO MERGE" da 1ª rodada era só lógica interna — faltou testar site real). Achados corrigidos TODOS:
> - **Segurança:** S1 remove `<script>`/handlers da cópia (XSS same-origin), S2 bloqueia SSRF (IPs internos), S3 rejeita não-HTML/gigante (OOM).
> - **Fidelidade:** F1 absolutiza URLs no import (era a raiz — a troca não batia em URL relativa) + F5 delazy + F6 decode `&amp;` → **cópia carrega da origem e renderiza com estilo**; F3 pega CSS "disfarçado" (Google Fonts/load.php) por tag, F4 localiza fontes/bg em CSS externo, F8 segue @import, F7 detecta charset (anti-mojibake).
> - **Casos-limite:** C1 slug não-latino vira hash (não colide em "home"), C2 redirect usa host final, C3 slug reservado não publica invisível, C5 chrome multiplataforma. + D1 (erro console smart-summary, pré-existente).
> - **Provado no site real (Wikipedia):** CSS absoluto, load.php capturado p/ localizar, scripts removidos, imgs absolutas. 76/76 testes, tsc limpo, `next build` OK.
> - Achados/plano: `docs/superpowers/plans/2026-07-24-copiar-url-hardening.md`. **Retestar:** re-copiar `https://pt.wikipedia.org/wiki/Sobrancelha` no localhost → agora vem com estilo.



**Status: 9/10 tasks construídas + revisadas + polidas. Revisão final do branch = READY TO MERGE.** Falta só a T10 (QA hands-on do James + checkpoint Vercel). Branch **`feat/copiar-qualquer-url`** (17 commits acima da `main`; **`main` intocada, NADA pushado**).

**Verificado:** 50/50 testes lib, `tsc --noEmit` limpo, `next build` de produção OK. Revisão final (opus): traçou salvar→servir `/p/[slug]`→publicar→catálogo→lista→editar; **funciona ponta a ponta pra web, zero regressão no WP**, `domain` ampliado flui seguro por todos os consumidores, sem colisão de chave KV, armadilha do `relocate` guardada. Sem Critical/Important. Notas de segurança: SSRF mitigado por admin-only; JS copiado roda na origem (mesmo modelo do WP mirror atual).

**▶️ COMO TESTAR (quando o James voltar):** `git checkout feat/copiar-qualquer-url` → `npm run dev` (porta 4000) → logar admin → `/wp-pages` (agora "Páginas copiadas") → botão "Copiar de uma URL" → colar (a) 1 site estático, (b) 1 WordPress externo, (c) 1 SPA React (marcar "forçar navegador robô" se vier vazio) → conferir: salvou, etiqueta "Copiada da web · <host>", abre no editor, publica, renderiza em `/p/<slug>` com assets locais.

**⏳ Depois do QA:** merge na `main` + push (checkpoint headless na Vercel — se não rodar no grátis, decisão: headless só no PC + cópia simples na Vercel; ver spec §10.1).

**Detalhe histórico do que foi construído (T1–T9) abaixo mantido pra referência.**

---

## ⏸️ Histórico da construção — Feature "Copiar de uma URL"

**Método:** subagent-driven (1 implementer + 1 reviewer por task, TDD). Ledger: `.superpowers/sdd/progress.md`.

**O que é:** destravar o "Copiar de uma URL" (o `importByLinksAction`, cujo botão foi removido em 17/07) pra aceitar **qualquer endereço**, com navegador robô pros sites pesados, reusando o pipeline de localização. Reorganização de IA: "Páginas WP" → "**Páginas copiadas**" (WP + web com etiqueta de origem). Decidido tudo com o James via brainstorming (visual companion).

**Documentos (ler pra retomar):**
- Spec: [docs/superpowers/specs/2026-07-23-copiar-qualquer-url-design.md](../docs/superpowers/specs/2026-07-23-copiar-qualquer-url-design.md)
- Plano (10 tasks TDD): [docs/superpowers/plans/2026-07-23-copiar-qualquer-url.md](../docs/superpowers/plans/2026-07-23-copiar-qualquer-url.md)
- Ledger de progresso: `.superpowers/sdd/progress.md` (gitignored)

**⚙️ Onde está o código:** branch **`feat/copiar-qualquer-url`** (`git checkout feat/copiar-qualquer-url`). **`main` intocada, NADA foi pushado** (tudo local).

**✅ Feito (com implementer + reviewer subagente por task, testes verdes):**
- T1 `deriveWebSlug` (slug do caminho inteiro + fallback `home`) — `lib/web-slug.ts`
- T2 `extractAssetUrls` genérico (qualquer host) — `lib/wp-localize-core.ts`
- T3 `looksEmpty` (detecta casca de SPA) — `lib/fetch-any-url.ts`
- T4 `fetchAnyUrl` + `renderHeadless` (híbrido: fetch → navegador robô; Chrome local / `@sparticuz/chromium` na Vercel) — `lib/headless-fetch.ts`, deps `puppeteer-core`+`@sparticuz/chromium` instaladas. Smoke local OK.

**⏭️ Próximo (retomar na T5):**
- T5: ampliar store `domain: WpDomain→string` + `sourceKind`/`sourceUrl` (`wp-content-storage.ts`, `wp-localize.ts`, `page-summary.ts`)
- T6: `pageOriginLabel` + trocar 4 ternários hardcoded (**fix crítico "não-WP virando WP"**: wp-page-card:41, search-modal:78, lixeira:100, wp-pages/[domain]/[slug]/page:68)
- T7: fonte `web-mirror` no catálogo · T8: `importByLinksAction` branch web · T9: UI (recriar `import-by-link.tsx` + sidebar "Páginas copiadas") · T10: QA local + checkpoint headless na Vercel
- **Como retomar:** `git checkout feat/copiar-qualquer-url` → ler o plano → `task-brief` da T5 → seguir subagent-driven (implementer+reviewer por task).

**⚠️ Riscos anotados:** headless na Vercel ainda NÃO validado (checkpoint na T10 — se não rodar no grátis, decisão: headless só no PC + cópia simples na Vercel). Rota `/wp-pages` NÃO é renomeada (só o rótulo) pra não quebrar ~12 arquivos.

---

## 🆕 Sessão 2026-07-23 — Recuperação de histórico + hook anti-perda

**Problema:** o James notou que de 17/07 até 23/07 houve bastante progresso, mas **nada foi salvo** nas notas nem na memória. Diagnóstico: o salvamento do progresso era 100% **manual** (regra "atualizar progresso-atual.md ao fim de cada sessão") e **não existia nenhum hook** configurado nos `settings.json` → quando uma sessão terminava abrupta (fechar app / `/clear` / compactação de contexto), o passo era pulado. O trabalho **existe no git**, só não estava curado nas notas.

**Correção 1 — hook automatizado (nunca mais depender de lembrar):**
- Hook `Stop` + `PreCompact` em `.claude/settings.json` (projeto) que, quando arquivos do projeto (`lp-html/`, `app/`, `lib/`, `components/`) mudaram mais recentemente que `notas/progresso-atual.md`, **injeta um lembrete** pra atualizar as notas antes de encerrar/compactar. Dispara no máximo 1x por sessão. Regra de conteúdo: **só progresso do projeto**, nada de fora.

**Correção 2 — histórico 18→22/07 reconstruído do git (abaixo).**

### 🆕 LP Basic Magic Shadow **v2** (18–20/07) — NOVA LP
Nova LP paralela: [lp-html/basic-magic-shadow-v2.html](../lp-html/basic-magic-shadow-v2.html) · rota [app/basic-magic-shadow-v2/route.ts](../app/basic-magic-shadow-v2/route.ts) · registrada em [lib/lp-html-registry.ts](../lib/lp-html-registry.ts) · assets em [public/lp/basic-magic-shadow-v2/](../public/lp/basic-magic-shadow-v2/).
- **18/07:** cópia fiel do WP em vanilla (rota paralela) → tornada funcional sem mexer no design → UX/diagramação + correção do "play travado" do vídeo.
- **20/07:** carrossel do hero (bolinhas, autoplay no toque, 2 por vista) · pause dos depoimentos no mobile · diagramação do hero no mobile + varredura geral · **aplicado Feedback MAGIC SHADOW (12 prints)** → antes-depois-01..09, resultado-01..10, módulos (higiene/pele) · vídeo **full-screen autoplay mudo** (`video-352.mp4`) + enxugou Procedimentos · removeu o play e moveu o logo pra depois de "TRANSFORME suas clientes".

### 🖤 Site institucional **jamesolaya** (21/07) — recriado
Recriação do site institucional no **sistema dark cinematográfico** (ver [[projeto_jamesolaya]]): [lp-html/jamesolaya.html](../lp-html/jamesolaya.html) · rota [app/jamesolaya/route.ts](../app/jamesolaya/route.ts) · registrado em [lib/landing-pages.ts](../lib/landing-pages.ts) · assets (hero-dream, retrato, clínica, academy, logo oficial) em [public/lp/jamesolaya/](../public/lp/jamesolaya/).

### 🛠️ Fix dashboard (21/07)
Clicar num deploy abre **a página alterada**, não a raiz. Novo [lib/deploy-target.ts](../lib/deploy-target.ts) + [components/admin-feeds.tsx](../components/admin-feeds.tsx) + `lib/suggestions-store.ts`.

### 📱 Fio a Fio realista (22/07)
Hero **mobile full-bleed** em [lp-html/fio-a-fio-realista-by-james-olaya.html](../lp-html/fio-a-fio-realista-by-james-olaya.html) + `public/lp/fio-a-fio-realista/hero.webp`.

### ⏳ Em andamento (23/07, não-commitado)
Working tree com assets novos de **jamesolaya** (img1..N) + pastas soltas ("fio a fio realista"/"lips sense"/assets/Pinterest.mp4) — trabalho do dia ainda por commitar. **Atenção:** as pastas soltas na raiz do portal parecem material de trabalho, não do deploy — confirmar com o James antes de commitar/apagar.

---

## 🆕 Sessão 2026-07-17 (parte 8) — Contagem de páginas no dashboard + índice leve

**Bug reportado:** dashboard mostrava só **12 páginas** em `/paginas` e **0** em `/wp-pages`, escondendo as ~82 páginas migradas (o KV tinha 96/70 publicadas, confirmado por `?wpcheck=1`).

**Causa raiz:** `loadAllContents()` (lib/wp-content-storage.ts) fazia **um único `kvMget` de todas as ~96 chaves**; cada valor carrega o `fullHtml` (~250KB) → ~24MB de resposta que **estoura o limite do Vercel KV (Upstash) e lança**. O `catch` de `kvMget` em `lib/storage.ts` **mascarava como "tudo null"** → `listSaved/listPublished` retornavam `[]` → o catálogo perdia todas as `wp-mirror`. As 3 telas quebravam juntas. O `?wpcheck=1` só funcionava porque lê em lotes de 8.

**Correções (commit `602540d`, deploy como dono):**
- `lib/storage.ts`: `kvMget` lê em **lotes de 10**; `catch` de `kvMget`/`kvKeys` agora **loga** em vez de mascarar silenciosamente.
- `lib/wp-content-storage.ts`: **índice leve** `wp:summary:<domain>:<slug>` (resumo `SavedSummary` sem `fullHtml`). `saveContent` grava o resumo, `deleteContent` remove. `listSaved/listPublished/listTrashed` leem o índice (1 `kvGet` pequeno) em vez de ~24MB. Fallback correto (leitura em lotes) enquanto o índice não existir. `rebuildSummaryIndex()` reconstrói. (`listPublished` agora retorna `SavedSummary[]` — só o sitemap usava, e só de `publicSlug`/`slug`.)
- `/api/wp-localize?rebuildindex=1`: popula o índice uma vez após deploy (rodado → **96 indexadas**).
- Dashboard: removido número morto `totalPages`; StatCard "Páginas publicadas" já usa `counts.byStatus.published`. `/paginas`: rótulo "X páginas · Y publicadas em N tipos".

**Resultado em produção:** `/paginas` = 93 páginas · **75 publicadas** · chip "Página migrada · 81"; dashboard "Páginas publicadas" = **75** (bate com /paginas); `/wp-pages` = Total **91** / Publicadas **70**. Contagem de "publicadas" única e consistente. (75 catálogo vs 70 migradas: ~7 migradas têm slug shadowado por LP do repo — o catálogo conta a que está de fato no ar.)

**Escopo NÃO feito (usuário adiou):** paginação das listas longas, gestão unificada em /paginas, resolver colisões de slug.

---

## 🆕 Sessão 2026-07-17 (parte 7) — Preparação final pro desligamento do WordPress

Pergunta do usuário: "por que ainda existe a separação 'Páginas WP' no painel se a migração já aconteceu?" **Resposta da auditoria: a migração das PÁGINAS está completa** (95 copiadas no KV, 61 publicadas, 68/68 URLs do sitemap respondendo na Vercel). O rótulo `wp-mirror` não é resto de migração — é o mecanismo de serving/edição dessas páginas. O que ainda falava com o WP ao vivo era só a seção "Importar do WordPress" do painel. Limpeza feita:

**🧹 Painel:**
- **Seção "Importar do WordPress" REMOVIDA** de `/wp-pages` (e com ela `fetchAllWpPages` no render). Deletados os componentes órfãos: `import-by-link`, `wp-triage-tables`, `wp-page-row`, `copy-now-button`. `/wordpress` agora redireciona pra `/wp-pages` (sem âncora). Libs de import/localize (`lib/wp-api`, `wp-fetch-page`, `wp-localize*`, `import-actions`) mantidas — o pipeline de localização ainda as usa.
- **Rótulos renomeados**: "Cópia WordPress" → **"Página migrada"** (`lib/page-catalog-core.ts`, badge + chips em `/paginas`); card mostra "Migrada do WordPress"; título do painel: "Páginas migradas".

**✅ Verificador pré-desligamento (`/api/wp-localize?wpcheck=1`, admin, somente leitura):**
JSON que separa **asset REALMENTE carregado** (`src=`/`srcset`/`url()`/`og:image` apontando pro WP → quebra ao desligar) de **ref de config inerte** (`elementorFrontendConfig.urls.*`/`ajaxurl`/`uploadUrl`/`lottie` → o browser não requisita). Campo `bloqueadores` = páginas PUBLICADAS com asset carregado; `ok:true` só quando esse array zera. (Rodar de novo sempre que importar/editar algo.) A 1ª versão dava falso-positivo contando o config do Elementor — corrigido.

**🔎 Rodada de verificação em produção (17/07):** wpcheck achou **7 bloqueadores reais**:
- **5 = só bandeiras do gtranslate** no conteúdo do KV (`//jayacademy.com.br/wp-content/plugins/gtranslate/flags/svg/*.svg`) — magic-shadow, magic-shadow-v2, masterclass-prime-lips, pmu-pro, up-fio-a-fio-magic-shadow. **RESOLVIDO** via novo one-shot `?fixwpflags=1` (dry-run + `&confirm=1`/header anti-CSRF) que reescreve pra `/wp-plugins/gtranslate/` (SVGs já espelhados). 7 chaves do KV corrigidas. wpcheck caiu pra 2.
- **2 = vídeos MP4** (lips-sense-avancado + `-2`): 4 vídeos (`mofu-1/2`, `bofu-1/2`, 69–82 MB) servidos de `jayacademy.com.br/wp-content/uploads/2026/04/`. **RESOLVIDO removendo a seção de vídeos.** Histórico da decisão: (1) tentou hospedar no storage S3 atual → FALHOU (Supabase free tier limita **50 MB/arquivo**, 413 EntityTooLarge); (2) usuário optou por host externo, mas o **YouTube bloqueou por música autoral** → decisão final: **remover os vídeos da página**. Feito via `?fixlipsvideos=1&remove=1` (novo one-shot) que remove a `<section id="videos">` inteira que contém os vídeos (depth-matched, robusto às 2 estruturas `ls-videos`/`lv-reels`); 4 seções removidas (2 por página: `fullHtml` + `content`), páginas íntegras (CTA Hotmart preservado).

**✅ RESULTADO: `?wpcheck=1` → `ok: true`** (0 bloqueadores, 0 assets do WP em qualquer página publicada). **O WordPress pode ser desligado** após o backup (item 2 do checklist).

**⚙️ Deploy/build — atenção:** o build do Vercel FALHA com "AUTH_SECRET não configurada" quando o commit/push é atribuído a autor que não é o dono do projeto no Vercel. **Push tem que ser como o dono `James Olaya <suporte@jamesolaya.com.br>`** (identidade git do repo ajustada pra isso) + push com o PAT `token_mktjamesolaya2` (em `.env.local`). Com atribuição errada, o build sobe sem as envs de produção.

**🖼️ Últimas refs de asset apontando pro servidor WP (fora do KV):**
- `lp-html/fio-a-fio-realista-by-james-olaya.html`: bandeiras do gtranslate espelhadas em `public/wp-plugins/gtranslate/flags/svg/` (refs `//jayacademy.com.br/...` reescritas). Restam só strings de config escapadas do Elementor (inofensivas, não carregam nada).
- **Bundle do PMU CLASS** (`public/pmuclass/assets/index-BNudAzTv.js`): tinha ~27 imagens de runtime servidas pelo WP (galerias + og). **Todas espelhadas** em `public/pmuclass/wp-uploads/{main,lp}/...` (5MB) e o bundle reescrito pra paths locais. ⚠️ Se o PMU CLASS for rebuildado a partir do fonte (outro repo), reaplicar essa troca de prefixo (`https://(lp.)jayacademy.com.br/wp-content/uploads/` → `/pmuclass/wp-uploads/{main,lp}/`).

**⚖️ Decisões do usuário nesta sessão:**
- **Homepage `/`: MANTER como está** (lobby admin) — deixou de ser bloqueador; é decisão consciente.
- Painel: manter gestão separada das páginas migradas; só a importação sai.

**📋 Checklist pra desligar o WordPress (ações do usuário):**
1. Abrir `/api/wp-localize?wpcheck=1` logado como admin → precisa retornar `ok: true`.
2. **Backup do WP antes de desligar**: dump do banco + pasta `wp-content/uploads` (não há cópia local das origens no repo).
3. Confirmar envs na Vercel: `AUTH_SECRET`, `SENIOR_PASSWORD`, `KV_*`, storage; recomendado `CRON_SECRET`.
4. Trocar o DNS de `jayacademy.com.br` / `lp.jayacademy.com.br` pra Vercel (checklist da sessão de 16/07 parte 3).
5. Só então desligar o servidor WordPress.

---

## 🆕 Sessão 2026-07-17 (parte 6) — Correção do backlog: segurança P0, tracking CAPI, caixa de leads

Os itens que a revisão geral (parte 5) mandou pro backlog foram **corrigidos**. Commits `5d385db`…`9bf3bb6` (6 blocos). Decisão: cadastro público → só o senior cria contas.

**🔒 Segurança P0 (`5d385db`):**
- `lib/auth-secret.ts`: segredo do JWT compartilhado; **fail-fast** se rodar na Vercel sem `AUTH_SECRET` (antes: fallback público forjável em auth.ts + middleware).
- **Senha do senior fora do fonte** (`@Suporte123` removido) → env **`SENIOR_PASSWORD`** (setada na Vercel pelo Lucas). Sem ela em produção, login por senha do senior desabilitado.
- **Cadastro público REMOVIDO** (`app/cadastro`, `signUpAction`, `signUp`): qualquer um criava viewer com acesso ao painel. Agora `adminCreateUser` + form em `/settings/users` (só senior cria).

**🛡️ Hardening de endpoints (`1af523d`):**
- `lib/rate-limit{,-core}.ts`: limiter por IP via KV (`kvIncr`+expire, sem dep externa; no-op no dev) + helpers testados (3 testes).
- Rate-limit + cap de payload em `elementor-form`, `wp-form-submit`, `track`, `chat-pmu`, `meta-capi`.
- **`/api/meta-capi` blindado**: allowlist de eventName + same-origin + rate-limit (fecha envenenamento de conversão).
- `elementor-form`: catch loga (não perde lead silenciosamente). `wp-localize` destrutivos (supaclean/supafix) exigem header `x-portal-op: confirm` (anti-CSRF).

**📊 CAPI por-visita (`ed2531b`):** `buildPixelInitScript` gera o eventId **no browser** (era fixo no build → Meta deduplicava todos num único PageView nas 8 LPs estáticas). O CAPI agora é disparado pelo cliente via `/api/meta-capi` com o mesmo id → dedup correta, página segue cacheável. Removido o CAPI server-side.

**📥 Caixa de leads (`5c5522e`):** nova tela **`/leads`** — inbox de todos os leads (`form-submissions:*`) com origem por página, filtro, busca, **export CSV** e status de webhook. **Webhook por LP estática** (`lib/lp-form-config`, lido pelo elementor-form) configurável na própria tela — antes só existia se a LP tivesse gêmea no KV. Item na sidebar.

**🔐 Headers + env (`9bf3bb6`):** `next.config` com nosniff/Referrer-Policy/HSTS global + X-Frame-Options só no admin (sem CSP estrita p/ não quebrar Pixel/GTM/Hotmart). `.env.example` documenta AUTH_SECRET/SENIOR_PASSWORD/CRON_SECRET.

**⚙️ Envs a garantir na Vercel:** `AUTH_SECRET` (já existia), `SENIOR_PASSWORD` (setada nesta sessão). Recomendado setar `CRON_SECRET` (hoje os crons ficam abertos sem ela).

**Ainda no backlog (não-P0):** otimizar mídia dos SPAs (magicshadow 170MB/pmuclass/laser — refs em bundles hasheados); backup automático + export externo; homepage `/` (segue lobby admin — bloqueador conhecido pré-DNS).

---

## 🆕 Sessão 2026-07-16 (parte 5) — Desempenho + diagramação (revisão geral)

Revisão geral do projeto (3 auditorias: segurança, código/perf, produto/UX) → o usuário priorizou **desempenho + diagramação**. Commits `9c4a165`…`7590c8e` (6 blocos).

**Desempenho:**
- **Poda de deploy**: `public/hf-src/` (10MB, 0 refs) removido + 6 arquivos órfãos (`lib/discover-lps.ts`, `components/{topbar,wp-saved-card,collapsible-section,detected-folder-card}.tsx`, `page-builder/public-renderer.tsx`) + `.vercelignore` (notas/ fora do deploy).
- **Serving unificado** ([lib/serve-lp.ts](../lib/serve-lp.ts)): os 10 route handlers de LP (~250 linhas duplicadas) viram stubs de 3 linhas. HTML de disco cacheado em memória. **Cache-Control racional**: disco (muda em deploy) = `s-maxage=3600`; KV editável (magicshadow/laser) = `s-maxage=60`. Fim do `no-store` do magicshadow e do `15s` do laser. Paridade byte-a-byte confirmada.
- **CAPI não-bloqueante**: `sendMetaCapiEvent` via `after()` em vez de `await` — some do TTFB o round-trip ao Facebook.
- **Beacon de visita** nas 8 LPs de lp-html (antes: 0 visitas no painel) — `buildVisitBeacon` client-side injetado pelo serveLp; registra em `/api/track`. **Agora as LPs aparecem no analytics.**
- **Mídia → webp**: 11 imagens pesadas (heros/provas de lips-sense, profissao-remove, wpmirror) via sharp q82: **34.1MB → 1.2MB (−96%, −33MB no deploy)**. Refs atualizadas (incl. escapadas), originais removidos, paridade visual confirmada por screenshot nas 4 LPs.
- **Painel N+1**: `kvMget` (batch) em [lib/wp-content-storage.ts](../lib/wp-content-storage.ts) → `listSaved/listPublished/listTrashed` fazem **1 kvKeys + 1 kvMget** em vez de 1+~70 kvGet por render.

**Diagramação:**
- `wp-triage-tables`: era a única tabela com `overflow-hidden` (clipava no mobile) → `overflow-x-auto`. `min-w-0` em 11 telas do painel. Confirmado via CDP a 390px: **`bodyOverflow=false` em todas** as telas.

**⚠️ FORA DE ESCOPO desta sessão (registrado no backlog — ver `backlog-proximos-passos.md`):** correções de **segurança P0** e **caixa de leads** que a auditoria achou. Os itens críticos:
- 🔴 **Senha do senior hardcoded** (`@Suporte123` em [lib/auth.ts:47](../lib/auth.ts)) — mover pra env/KV.
- 🔴 **AUTH_SECRET com fallback público** — se produção subir sem a env, JWT forjável como senior. Fazer **fail-fast** no boot.
- 🔴 **/cadastro público** cria viewer que vê dashboard/analytics/volume de leads — fechar (convite/aprovação).
- 🟠 **CAPI em página `force-static`**: eventId fixado no build → Meta deduplica TODOS os visitantes num único PageView. As 8 LPs de venda reportam ~1 PageView. **Corrigir com eventId por-visita client-side + CAPI via beacon** (mesma infra do /api/track).
- 🟠 `/api/meta-capi` aberto (envenenamento de conversão); sem rate-limit nos forms públicos; GETs destrutivos (supaclean) via cookie = CSRF.
- 🟡 **Caixa de leads das LPs**: os leads de `form-submissions:wp:*` não têm tela em `/forms` (só contagem + "recentes" no dashboard). Falta inbox filtrável + export CSV + webhook por LP estática.
- SPAs (magicshadow 170MB/pmuclass/laser) com mídia pesada não otimizada — refs em bundles hasheados, exige cuidado.

---

## 🆕 Sessão 2026-07-16 (parte 4) — Dashboard melhorado + catálogo de tipos de página

O portal tinha 6 padrões de página pública sem visão unificada — e as **8 LPs de venda de `lp-html/` (o trabalho diário) eram invisíveis no painel**. Commits `50eec20`…`391f60a`.

**Taxonomia unificada (sem novo store — agregação em memória):**
- [lib/lp-html-registry.ts](../lib/lp-html-registry.ts): registro versionado das 8 LPs de `lp-html/` + 2 redirects 308. **Regra: criou/removeu route handler de lp-html → atualiza o registro** (o teste `lib/page-catalog.test.ts` FALHA se dessincronizar).
- [lib/page-catalog.ts](../lib/page-catalog.ts) (+ `page-catalog-core.ts` puro/testável): `buildPageCatalog()` agrega LPs do painel + WP + builder + forms + registro. Fontes: `lp-html | embedded-kv | builder | wp-mirror | react | redirect`. Detecta **colisão de slug entre camadas** (handler dedicado sombreia catch-all silenciosamente — agora aparece com alerta).
- Campo `contentSource` em `LandingPage` substitui os slugs hardcoded que decidiam o editor em `/lps/[slug]` (fallback heurístico pra registros antigos do KV).

**Painel:**
- **Nova tela `/paginas`** ("Todas as páginas"): tabela com fonte/categoria/status, chips de filtro com contagens, busca, ações abrir/editar/gerenciar, alerta de colisão. Sidebar: grupo "URLs" → "Páginas". Busca ⌘K acha as LPs de lp-html.
- **Dashboard**: 4 StatCards reais (Publicadas com delta real do activity log — **fim do "+ 4 esta semana" fake** —, Leads com delta 7d, Visitas do analytics-store, Erros), seção "Leads recentes" (novo `listAllSubmissions` em forms-store cobre `form-submissions:*` incl. `wp:<slug>`), seção "Páginas por tipo" com chips → /paginas.
- **/lps**: seção "LPs do repositório" (cards read-only das 7 de venda, com visitas/leads).
- **/settings**: fim dos "planejado" falsos — mostra auth própria, storage ativo por env, deploy real.

**Verificado:** 11 testes verdes; typecheck limpo; todas as telas admin 200 (QA local com sessão dev via proxy); rotas públicas smoke 200 inalteradas. **Legado:** `public/recriadas/inmersion-pelo-a-pelo` está EM USO (o HTML referencia esses assets — não remover); todos os `public/lp/*` referenciados.

---

## 🆕 Sessão 2026-07-16 (parte 3) — Prontidão pra troca de domínio (jayacademy.com.br → Vercel)

Verificação profunda pré-migração (3 frentes: superfície do app, sitemap do WP vivo, auditoria runtime das LPs) e correções. Commits `5c318c6`…`342c258` +404 branded.

**Consertado (já estava quebrado em produção!):**
- **Blob Vercel morto** (`hasn2c5edrrndxdo` → 403): ~440 refs de fontes woff2, ekiticons, flags do campo de telefone e fundos, dentro de 38 CSS do `/wpmirror/` → **99/107 assets recuperados** em [public/wpmirror/blobfix/](../public/wpmirror/blobfix/) (fontes do WP vivo; Playfair da Google Fonts; ekiticons/cross-out do SVN oficial; flags do jsdelivr). 8 fundos irrecuperáveis (não existem em lugar nenhum) tiveram as regras CSS mortas removidas. **0 refs ao blob no repo.** Tipografia/ícones das 4 LPs /wpmirror voltaram.

**Blindado pra migração:**
- **Forms popup Elementor (15/LP)**: postavam pro `admin-ajax.php` do WP (morreria). Novo [app/api/elementor-form/route.ts](../app/api/elementor-form/route.ts) recebe o POST nativo do Elementor Pro, grava em `form-submissions:wp:<slug>` (painel /forms) e reusa webhook/redirect da página KV gêmea. `ajaxurl` reescrito nas 5 LPs. Testado end-to-end.
- **Assets runtime dos plugins**: dialog/lightbox/swiper/font-awesome (elementor/-pro) + intl-tel-input (utils.js, bandeiras) espelhados em [public/wp-plugins/](../public/wp-plugins/); `urls.assets`/`pluginDir` reescritos. **0 refs remotas de plugin nas 5 LPs.**
- **Cobertura do sitemap**: one-shot `?publishsitemap=1` publicou as **61 páginas** do KV nos slugs originais → **68/68 URLs do site atual respondem 200 na Vercel** (servidas pelo `/p/[slug]` com delazy+tracking; assets delas seguem no Supabase, decisão da parte 1).
- **SEO/acabamento**: `app/robots.ts`, `app/sitemap.ts` (dinâmico: LPs + `listPublished()`), 404 branded (`not-found.tsx` + `notFoundResponse()` no `/p/[slug]`, já que o catch-all não deixa o not-found.tsx renderizar), `PMU_LINK` relativo.

**QA visual final (passo F, 16/jul):** screenshots das 5 LPs em produção (desktop 1280 + mobile 390) confirmaram tipografia restaurada pós-blobfix (Playfair/Poppins/Montserrat renderizando, não fallback do sistema), heros, carrosséis e CTAs intactos; amostra de 2 páginas KV publicadas (`/pmu-pro`, `/compra-aprovada-obrigado`) renderizando ok com assets do Supabase. **Plano A–F 100% concluído.**

**⚠️ CHECKLIST DA TROCA DE DNS (quando decidir apontar):**
1. **Pendência consciente: homepage** — a raiz `/` hoje é o lobby do painel admin (decisão do Lucas em 16/jul: resolver antes do apontamento; a página "inicio" do WP existe no KV, basta decidir servir).
2. Na Vercel (projeto jay-academy): Settings → Domains → adicionar `jayacademy.com.br` (apex) **e** `www.jayacademy.com.br` (redirect www→apex).
3. No registrador do domínio: apontar A/ALIAS do apex e CNAME do www conforme a Vercel instruir.
4. Baixar/exportar o que mais importar do WordPress ANTES de desligar o servidor dele (uploads já espelhados; considerar dump do banco por segurança).
5. Pós-apontamento: rodar o QA (`qa-migration.mjs` + `coverage-check.mjs` no scratchpad da sessão, adaptando a base URL pro domínio) e conferir os redirects 308 dos slugs antigos do fio a fio.
6. O cron diário (`/api/cron/publish`) e os endpoints one-shot continuam funcionando — nada muda.

---

## 🆕 Sessão 2026-07-16 (parte 2) — 5 LPs otimizadas + slugs espelhando o WordPress

**Contexto:** o portal vai substituir o site WordPress em breve → os slugs precisam ser idênticos aos de jayacademy.com.br e as LPs 100% independentes do WP. A basic-magic-shadow (otimizada em 15/jul) virou o padrão replicado. Commits `d5690ce`…`a6b1998`.

**Aplicado às 4 LPs restantes** (nanofios, fio-a-fio, pdv-lips, curso-remove):
- **Rotas**: pipeline `delazyBackgrounds(delazyHtml())` + strip `<base>` + viewport (igual a `app/basic-magic-shadow/route.ts:21-34`).
- **Higiene do HTML**: 56/38/19/0 srcs corrompidos (lixo SVG WP Rocket) limpos; **Pixel FB/fbevents/plusempresas hardcoded REMOVIDOS** (tracking 100% via `withTracking`, dedup Pixel/CAPI correta agora); 3 vídeos por página → `preload="none" data-lazysrc` + snippet IntersectionObserver (`data-bms-lazyvideo`).
- **Slug fio a fio**: conteúdo agora em **`/fio-a-fio-realista-by-james-olaya`** (slug do WP; arquivo renomeado em lp-html/). `/metodo-fio-a-fio-by-james-olaya` e `/fio-a-fio-realista` → redirect 308.
- **Profissão Remove — independência do WP**: 282 assets (~30 MB) baixados pra `public/lp/profissao-remove/` (estrutura de path preservada → `url()` relativos dos CSS continuam válidos): wp-content/wp-includes + flagcdn + cloudfront + os 3 mp4 (kiturbanique/kithenna/kitjaycademy). 6 assets que já davam 404 no próprio WP recuperados do SVN oficial do plugin (elementskit) e jsdelivr (intl-tel-input).
- **⚠️ CHECKOUT CORRIGIDO no Remove**: era `pay.hotmart.com/N98636819X` (produto errado!) → `G106407672I?checkoutMode=10&off=umo46sbb` (lista oficial conferida com o James — os outros 4 já estavam certos).

**QA (local + produção)**: 5 slugs com 0 srcs corrompidos, 0 plusempresas, exatamente 1 `fbq('init')` (o canônico injetado), 0 assets de wp-content/flagcdn/cloudfront remotos, checkout oficial em cada página, 482 assets locais HEAD 200, redirects 308 ok, screenshots desktop+mobile conferidos.

**Mantido de propósito**: metas canonical/og:url/schema apontando pra jayacademy.com.br (o domínio será deste app); as 5 strings de config do Elementor (`elementorFrontendConfig`) que citam wp-content (idênticas à referência, não são assets carregados); os 8 backgrounds do Blob morto em regras CSS mortas (sem impacto visual).

---

## 🆕 Sessão 2026-07-16 — Saída do Supabase (assets locais na Vercel)

**Motivo:** a conta free do Supabase (`brbpjjqigpmxombzbxiu`, mktjamesolaya@gmail.com) estourou a cota de Cached Egress (10 GB/5 GB) e entrou em *grace period* — depois disso o bucket responderia **402** e as 4 LPs de produto quebrariam. Auditoria confirmou: Supabase era **só storage de mídia** (bucket público `media/wpmirror`, espelho de assets do WP), nunca banco/auth/SDK.

**O que foi feito** (commits `a0a0704`, `7ac9aac`, `a6e567d`):
- **571 assets (~87 MB) baixados** do bucket pra [public/wpmirror/](../public/wpmirror/) — agora servidos como estáticos pela CDN da Vercel (conta no Fast Data Transfer, 34/100 GB — folga).
- **URLs reescritas** (`https://brbpjjqigpmxombzbxiu.supabase.co/.../wpmirror/` → `/wpmirror/`) nas 4 LPs (`basic-magic-shadow`, `basic-nanofios`, `metodo-fio-a-fio`, `pdv-lips-sense`) + partials `_videos.html`/`_modulos.html` + 1 CSS com URL interna. **0 refs supabase** em lp-html/.
- **Novo one-shot admin**: `/api/wp-localize?supascan=1` (audita URLs Supabase em TODO o KV) e `?supafix=1` (reescreve prefixo pra /wpmirror/). Mesmo padrão do `?relocate=1`. ⚠️ NÃO usar `?relocate=1` pra isso — ele sobe pro storage atual (que era o próprio Supabase).
- **Cache das LPs**: `s-maxage` 60→3600 nas 8 rotas de LP (HTML só muda em deploy, que purga a CDN) — corta Function Invocations/Fluid CPU.
- **QA**: HEAD-check dos 578 assets /wpmirror/ em local e produção + screenshots headless desktop/mobile das 4 LPs. Tudo 200, visual OK.

**Desfecho (decisão do Lucas na mesma sessão): Supabase FICA, só para as páginas antigas.**
O supascan mostrou que ~70 páginas antigas do KV + `media:items` + ~900 `wpasset:*` referenciam **7.115 arquivos (~880 MB)** do bucket — inviável de colocar no repo. Como o vilão do egress eram só as 4 LPs de venda (migradas), a conta volta ao free sozinha no próximo ciclo (grace period vai até 07/ago/2026). Então:
- **Backup completo do bucket** feito: 8.190 arquivos / 1.027 MB / 0 falhas em `~/PROJETOS_DEV/backup-supabase-wpmirror` (fora do repo). Restauração de qualquer página antiga = copiar arquivos pra `public/wpmirror/` + push.
- **`?supafix=1` NÃO foi rodado** (de propósito): as páginas antigas continuam apontando pro Supabase, que segue no ar.
- **Envs `S3_*` PERMANECEM na Vercel** (páginas antigas + uploads continuam no Supabase; `?supalist=1`/`?supaclean=1` dependem delas).
- **Limpeza autorizada e executada**: `?supaclean=1&confirm=1` deletou **1.093 órfãos (147,8 MB)** — objetos que NENHUM valor do KV referenciava (duplicatas de re-upload). Bucket final: 7.097 arquivos / 879 MB. Dry-run conferido antes; tudo coberto pelo backup.
- Novos one-shots admin em `/api/wp-localize`: `?supascan=1` (audita refs Supabase no KV), `?supafix=1` (reescreve pra /wpmirror/ — só usar se um dia decidir desligar o Supabase de vez; antes disso, subir os assets referenciados pra `public/wpmirror/`), `?supalist=1` (lista bucket via S3), `?supaclean=1[&confirm=1]` (deleta órfãos).

**Conhecido/aceito:** 8 URLs do **Blob antigo morto** (`hasn2c5edrrndxdo...403`) seguem no HTML de basic-nanofios (3) e pdv-lips-sense (5) — backgrounds em regras CSS mortas/cobertas pelo recolor recente, **sem impacto visual** (screenshots conferidos), quebrados desde a era do Blob bloqueado. Originais não recuperáveis (páginas WP deletadas). Blob Advanced Operations estourado na Vercel (2.2K/2K) reseta no próximo ciclo; nada grava mais no Blob rotineiramente. 18 paths referenciados no KV não existem no bucket (já estavam mortos — nomes com sufixo do Blob antigo).

---

## 🆕 Sessão 2026-07-03 — Método Shadow PRO: redesign premium dobra-a-dobra (CONCLUÍDO)

Continuação do overhaul. James pediu, seção por seção, "algo muito visual/forte/diferente", rejeitando layouts genéricos e repetição ("tudo igual"). Todas as dobras abaixo foram reformuladas com composições distintas entre si (evitar o "tudo dark+gold+serif+centralizado"). Arquivo: [lp-html/metodo-shadow-pro-2.html](../lp-html/metodo-shadow-pro-2.html).

**Dobras reformuladas (esta sessão + anteriores da mesma rodada):**
- **Prova** → faixa editorial full-bleed (macro sangrando + máscara + brilhos dourados).
- **Diagnóstico** → números-fantasma vermelhos + tag "✕ Erro comum" + fórmula.
- **Técnica** → retrato emoldurado com halo + lista "Na tentativa → Na decisão".
- **4 Pilares** → fachada de templo (colunas + entablamento "O cicatrizado bonito").
- **Blueprint** ("Tudo o que você precisa") → ficha técnica com grid, crosshairs e leader lines.
- **Para quem** → split diagonal (clip-path) é/não é pra você.
- **Bio ("Seu professor")** → **capa editorial**: retrato dupla-exposição (Higgsfield nano_banana_pro — rosto real do James + degradê de shadow dourado fundido no peito, `james-dx.webp`) sangrando pela direita + texto/creds/**assinatura** à esquerda.
- **Certificado** → substituído placeholder pelo certificado real emoldurado (inclinação, brilho, selo
  “Certificado oficial”, hover endireita). O primeiro asset dizia “BASIC MAGIC SHADOW”; a pendência foi
  resolvida em 30/07 com o certificado correto do **Shadow PRO**.
- **Resultados** → carrossel **igual ao "resultados reais" do fio a fio** (marquee auto-scroll + setas + fade + clique-pausa), adaptado ao dourado. Removidos prints ruins (r1 marca-d'água VOGUE, r3 grupo banco-de-imagem, r4 rosto pesado). Imagens limpas: f1-f3, r2/r5/r6 + **4 novas do acervo Magic Shadow** ([s1-s4.webp](../public/lp/shadow-pro/)).
- **Cicatrizados ("sem fantasia")** → **"prova sob lente"**: foto-herói + carimbo "Sem filtro · RAW" + 3 **medalhões circulares ampliados** (lupa) Degradê/Cor/Bordas. Trocou grid de 3 cards; imagens s4 (herói) + s3/s2/s1.
- **Emendas pretas entre dobras** aplicadas em TODAS (flat `--bg2` e radiais `.tecnica/.bio/.offer`), desktop + mobile.

**Assets novos:** `james-dx.webp` (dupla-exposição Higgsfield), `certificado.webp`, `s1-s4.webp` (macros shadow do acervo magicshadow). Todos em [public/lp/shadow-pro/](../public/lp/shadow-pro/).

**Workflow/lições reforçadas:** render local isolando a `<section>` (head+section num doc) via chrome headless + sharp pra conferir desktop (1360) e mobile (470) antes de push; `git add` arquivo-por-arquivo verificando `--cached --stat` (regra anti-"não subiu"); Higgsfield double-exposure ficou MUITO melhor que composição sharp manual (essa era sutil demais).

---

## 🆕 Sessão 2026-07-02 (parte 2) — Fio a Fio mobile + Método Shadow PRO (recriação + overhaul visual)

### Fio a Fio ([metodo-fio-a-fio-by-james-olaya.html](../lp-html/metodo-fio-a-fio-by-james-olaya.html)) — ajustes mobile
- Botão de idioma: `position:fixed`→`absolute` no mobile (não flutua mais, fica plotado no início).
- Seção "Vá muito além do shadow" (`.ffr-sh`): foto trocada `shadow.webp`→`fioafio.webp` (PC + mobile).
- 2º depoimento (`.ffr-dep__full`): adicionado frame de template de vídeo no mobile.
- ⚠️ **Lição/atrito:** James disse "sessão do shadow **no fio a fio**", eu editei a página Magic Shadow por engano. "sessão de X na página Y" = editar a seção dentro de Y, nunca a página X.

### 🌑 Método Shadow PRO — LP recriada do zero + turbinada
A página WP `/metodo-shadow-pro-2` foi **excluída e não pôde ser recuperada** → recriei como **LP custom dark+gold** e depois turbinei ("muito visual, faixas de sale, seja criativo").
- **Arquivo:** [lp-html/metodo-shadow-pro-2.html](../lp-html/metodo-shadow-pro-2.html) · **rota estática:** [app/metodo-shadow-pro-2/route.ts](../app/metodo-shadow-pro-2/route.ts) (mesmo padrão das outras LPs custom).
- **Assets:** [public/lp/shadow-pro/](../public/lp/shadow-pro/) — 16 webp copiados de `Magic Shadow 3/assets` via sharp (hero, f1-f3, prob, p1-p4, r1-r6, james).
- **Design:** Cormorant Garamond + Poppins · vars `--bg:#0a090c --gold:#d9b458 --card:#15121c` · Hotmart `E98531587I?checkoutMode=10` em todos os CTAs de preço.
- **Overhaul visual entregue:** barra de oferta sticky + **countdown** (localStorage `shpro_deadline`, 30min, atualiza `sbTimer`+`pcTimer`) · marquee de palavras-chave · problemas com tag "✕ Erro comum" · **oferta com badge 🔥 OFERTA (ribbon top-center) + countdown + faixa de urgência** · fix overflow dos 4 pilares (`min-width:0`) · **carrossel auto-scroll** nos resultados · checklist "Tudo o que você precisa" virou **grid de cards** com chips dourados · cicatrizados viraram **cards com selo "✓ Cicatrizado real"** + legenda de prova.
- ⏳ **Pendente:** seção de **certificado** (James vai buscar o certificado ORIGINAL dele → placeholder `.cert__card` aguardando). "Para quem" já está bom (2 colunas é/não é).
- 15 seções, conteúdo extraído da página quebrada ao vivo. `.meandro` (grego) foi escondido a pedido do James.

---

## Sessão 2026-07-02 (parte 1) — Lips Sense: fecha o redesign (oferta, bio, garantia rosa) + ajustes mobile

LP **PDV Lips Sense** ([pdv-lips-sense-technique.html](../lp-html/pdv-lips-sense-technique.html)) — **todas as seções** agora no tema grego/coral. Continuação da sessão 07-01.

**Seções finalizadas nesta rodada:**
- **Garantia ("Ainda está insegura?"):** banner **rosa** (Higgsfield: James sorrindo `Group 1.png` + selo 30 dias rosé + procedimentos). Selo recolorido com flux_kontext, composto com nano_banana_pro. Aplicado via `::before` (WP Rocket bloqueia `background-image` direto). Tampei o nome invertido no jaleco com patch sharp. Mobile: **arte 9:16 dedicada** ([garantia-rosa-9x16.png](../public/lp/lips-sense/garantia-rosa-9x16.png)) — James+selo em cima, texto sobre procedimentos embaixo (e-con-inner flex column justify-end).
- **Oferta ("Eu tenho uma condição especial"):** value-stack (selos dourados + âncoras riscadas R$12mil→R$1.997) + **tábua de mármore creme** (moldura dourada + meandro) com preço serif + CTA dourado (link Hotmart `Y98532335W` preservado).
- **Bio ("Quem será seu Professor"):** banner Higgsfield (James **sério** `cine_2` + fundo palestrando `palestra.jpg`, coral) via `::before` + **card de vidro escuro** (backdrop-blur + moldura dourada): estrelas + nome serif + bio + CTA.
- **Hero mobile:** arte **9:16** (Higgsfield: James + 2 modelos lábios vermelhos + folhas douradas, das refs `desktop-lips-technic` + `destaque`) no topo → **fumaça (mask-fade)** → **mármore roxo** (o `.lst` restaurado) com logo+título+CTA. Assets: [hero-9x16.png](../public/lp/lips-sense/hero-9x16.png), [professor.png](../public/lp/lips-sense/professor.png).

**Ajustes mobile (batch):**
- "Porque escolher": removidas as imagens de lábios no mobile (`overflow-x:hidden` virava `overflow-y:auto` = scroll trap).
- Módulos: celular centralizado (`.lipsmod__in align-items:center`).
- Resultados: pilastras (`.lcf__col`) não somem mais no mobile (eram `display:none`), reposicionadas ao lado da imagem.

⚠️ **Regra WP Rocket:** remove `background-image` (inclusive gradiente) de elementos → usar `background-color` sólido OU `::before`/`::after` (pseudos passam). Higgsfield só aceita imagem por **URL pública** (Supabase wpmirror já servem; assets locais → copiar pra `public/` + push antes de importar). James **rejeita rosto de IA** → sempre foto real como base.
⚠️ **Headless mobile:** renderiza layout viewport ~467px (escala do sistema) mesmo com window 390 → prints cortam à direita (artefato). Renderizar com `--window-size=470,...` pra ver sem corte.

---

## 🆕 Sessão 2026-07-01 — Lips Sense (`lp-html/pdv-lips-sense-technique.html`) redesign grego continua

Iteração visual-first com James na LP **PDV Lips Sense** (servida por [pdv-lips-sense-technique.html](../lp-html/pdv-lips-sense-technique.html) via rota estática; editar arquivo + push repo `jay-academy`). Metade de cima já era tema grego/coral; continuamos descendo.

- **Depoimentos** ("O que minhas alunas falam..."): Galeria de Musas (molduras douradas) → **painéis diagonais** (filmstrip skew -9° que expande no hover, lightbox YouTube). Commits `37b1f38`, e **`959ec2b` = FIX crítico**: a galeria renderizava INVISÍVEL (só coral vazio de 470px). Causa: painéis `flex:1 1 0` + imgs `position:absolute` (sem largura intrínseca) dentro de widget Elementor flex centralizado → **colapsava p/ largura 0**. Fix: `[data-id="8169d9f"]{width:100% !important}` + `.diagwrap{width:100%}`.
- **Módulos** ("Todos os módulos..."): carrossel Elementor genérico → **mockup de celular com stories passando** (padrão da fio a fio `_modulos.html`, tema plum/dourado). 8 módulos passam sozinhos (barras de progresso), esconde carrossel via `data-id="02f2b34"` + heading `18ccd2c`, revela `#lips-mod-wrap`. Commit `99fabe6`. ⚠️ Fundo precisou `!important` (Elementor tinha coral `!important` na seção) + `width:100%` (mesma lição do colapso). Mobile empilha + passa. **8 módulos, sem contagem de aulas/bônus na página (não inventar).**
- ⚙️ **Método de verificação usado:** headless Chrome (`chrome.exe --headless=new --screenshot`) + `sharp` (em `portal/node_modules`) pra cropar/amostrar pixels — confirma render real antes de entregar. Útil pra achar bugs de layout invisível. ⚠️ **Headless renderiza layout viewport ~467px mesmo com window 390** (escala do sistema) → prints de mobile cortam ~77px à direita (ARTEFATO, não overflow real; o viewport meta é `width=device-width`). Pra ver mobile sem corte, renderizar com `--window-size=470,...`.
- **Garantia ("Ainda está insegura?"):** novo banner **rosa** gerado no **Higgsfield** — James sorrindo (foto `Group 1.png` da PMU CLASS) segurando selo 30 dias rosé + fundo de procedimentos reais do projeto. Fluxo: recolori o selo (flux_kontext) → compus tudo (nano_banana_pro, refs por URL pública em `/hf-src/`) → asset final em [`public/lp/lips-sense/garantia-rosa.png`](../public/lp/lips-sense/garantia-rosa.png). Aplicado como **`::before`** da seção `f4f38fd` (o `background-image` direto NÃO vence o lazy-bg do WP Rocket; `::before` próprio sim). Tipografia: título Cormorant + parágrafo Poppins legível. Mobile: banner 16:9 no topo + texto no coral. ⚠️ Higgsfield só aceita imagem por **URL pública** — pra usar asset local do projeto, copiar pra `public/` e pushar antes de importar. James rejeita rosto de IA → usar foto real como base (edição/composição), não gerar rosto do zero.

**⏳ Ainda cru (default WP) na Lips, de cima p/ baixo:** Garantia ("Ainda está insegura?") · Oferta+Preço ("condição especial" / 12x) · Bio James ("Quem será seu professor") · Rodapé.

---

## 🆕 Sessão 2026-06-26 — Fix das páginas WP copiadas vindo quebradas

**Sintoma (James, screenshots):** páginas copiadas do WP vinham com **imagens quebradas** (ícone vazio) + **texto escuro no escuro** (sem estilo). Crítico porque vamos desligar o WP.

**2 causas raiz reproduzidas + corrigidas (commit `7407119`):**
1. **Imagens quebradas** — `setAttr`/`attr` do de-lazy ([`wp-localize-core.ts`](../lib/wp-localize-core.ts)) usavam regex de aspas ingênua (`["'][^"']*["']`). O `src` do placeholder lazy é um `data:image/svg` com **aspas simples por dentro** (`xmlns='...'`) → o regex parava na aspa interna e **corrompia a `<img>`**. Agora são quote-aware (`"[^"]*"|'[^']*'`) + lookbehind `(?<![-\w])` pra `src` não casar com o fim de `data-lazy-src`. (15/32 imgs quebravam.)
2. **Texto sem estilo** — o CSS minificado do WP Rocket (`/wp-content/cache/min/N/…`) é **volátil e dá 404 mesmo com o WP no ar** → ~metade do CSS do tema não localizava. Novo `deRocketUrl()` reconstrói a URL original (sem `/cache/min/N/`, que **continua viva**) e o `fetchAndStore` ([`wp-localize.ts`](../lib/wp-localize.ts)) usa como **fallback** quando o cache 404 (com a base correta pras `url()` de dentro do CSS). (9/9 CSS recuperados no teste.)

**Validado:** 2 testes novos (TDD) + 19 passando, tsc limpo, e simulação end-to-end na página real (`lp_pmu-upsell-basic-magic-shadow`): 32 imgs sem corrupção/placeholder, 9/9 CSS de cache recuperados, imagens vivas.

**⏳ PENDENTE pra valer em produção:** re-localizar as páginas já copiadas (que têm o HTML antigo quebrado salvo) — rodar o **backfill** (`/api/wp-localize`) ou `?relocate=1`. Páginas NOVAS copiadas já nascem certas. Páginas **deletadas do WP** que já tinham sido mal-localizadas podem precisar re-import (mas o re-fetch falha se deletadas — caso conhecido sem recuperação).

---

## 🆕 Sessão 2026-06-23 (noite) — Storage Blob→Supabase + Hotmart + mídia por páginas

**⚠️ MUDANÇA CRÍTICA DE INFRA — STORAGE:**
- O **Vercel Blob bateu o limite do plano grátis e foi BLOQUEADO** ("Limits reached") → TODAS as imagens localizadas pararam de carregar (403 "store is blocked"). Causa agravante: o localizador subia cada imagem **+ 4 variantes de tamanho** (4x desperdício).
- Migrado pra **Cloudflare R2 → NÃO (exige cartão, James não tem) → Supabase Storage** (sem cartão, S3-compatível).
- [`lib/storage.ts`](../lib/storage.ts): `blobUpload` agora é **genérico S3** via `aws4fetch` (dep nova). Envs na Vercel: `S3_ENDPOINT` (`https://brbpjjqigpmxombzbxiu.storage.supabase.co/storage/v1/s3`), `S3_REGION` (`us-west-2`), `S3_BUCKET` (`media`), `S3_PUBLIC_URL` (`https://brbpjjqigpmxombzbxiu.supabase.co/storage/v1/object/public/media`), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. Os valores são **lidos com `.trim()`** (uma quebra de linha colada quebrava a assinatura). Cai pro Blob se S3 não setado.
- Supabase: projeto `brbpjjqigpmxombzbxiu`, bucket **`media`** (público), região Oregon. Conta `mktjamesolaya@gmail.com`.

**Localizador atualizado** ([`lib/wp-localize.ts`](../lib/wp-localize.ts)):
- `localizePage` agora **normaliza antes de extrair** (de-lazy + `stripResponsiveImg` → **não baixa mais variantes**), aceita opts `{force, runCache, slugToPublic}`.
- `relocatePage`: migração Blob→Supabase de 1 página = **re-busca HTML fresco do WP** (urls do WP de volta, já que o guardado aponta pro Blob bloqueado) + `force` re-download. `fetchAndStore` ganhou flag `force`. `addManyMedia` virou **upsert** (atualiza url Blob→Supabase). Campo `relocatedAt`.
- ⚠️ **Migração só funciona se a página AINDA existe no WP** (re-fetch). Páginas WP deletadas (ex: fio-a-fio-realista lp deu 404) **não recuperam** (imagens presas no Blob bloqueado).

**Endpoints admin novos em [`app/api/wp-localize/route.ts`](../app/api/wp-localize/route.ts)** (abrir logado): `?testupload=1` (testa S3), `?mediastats=1` (hosts das urls), `?organize=1` (agrupa mídia por página de origem), `?relocate=1` (migra TODAS as 95 em lote, 1/req), `?relocateproducts=1` (migra+publica as 5 LPs de produto), `?hotmartscan=1`, `?pricecontext=1`, `?publishproducts=1`, `?fixfiofio=1`, `?freshfiofio=1&wpid=&wpdomain=` (re-importa fresco do WP).

**✅ HOTMART — 5 LPs publicadas (links+preços conferidos, imagens Supabase):**
| LP | URL | Preço | Link Hotmart |
|---|---|---|---|
| Basic Magic Shadow | /basic-magic-shadow | R$97 | E98531587I?off=k2warcrt |
| Basic Nano Fios | /basic-nanofios | R$297 | X98531821J?off=rckismlc |
| Lips Sense | /pdv-lips-sense-technique | R$597 | Y98532335W?off=jxkw3xrd |
| Profissão Remove | /curso-online-profissao-remove | R$997 | G106407672I?off=umo46sbb |
| Fio a Fio Realista | /fio-a-fio-realista | R$197 | T98532267X?off=tlrmqecy (re-importada fresca do WP id 27) |

**Biblioteca de mídia por páginas** ([`media-pages-store.ts`](../lib/media-pages-store.ts) + [`media-pages-workspace.tsx`](../components/media-pages-workspace.tsx)): coleções (`MediaPage`), `MediaItem.pageId`, imagens importadas do WP agrupadas pela página de origem (auto-migração 1x em `/midia`), busca de páginas, criar/mover. Auditoria de 3 agentes + vários bugs corrigidos (lixeira de forms apagava tudo, open redirect login, revalidate /wordpress no excluir).

**⏳ PENDENTE:**
- **Migração completa Blob→Supabase das ~90 páginas restantes** (só as 5 de produto foram migradas; rodar `?relocate=1` até 95/95 — mas páginas WP deletadas não recuperam).
- **Grupos de projetos no dashboard** (pastas com card gradiente) — começado: [`lib/project-groups-store.ts`](../lib/project-groups-store.ts) pronto, falta actions + UI.
- Triagem WP: busca + sem copiadas/ignoradas (feito). Dashboard recolhível + links WP (feito).

---

## 🧱 Estrutura atual de rotas

```
portal/app/
├── page.tsx                          → / lobby (logo orbital + botão "Acessar painel")
├── login/                            → autenticação
├── cadastro/                         → criação de conta (vira viewer por default)
├── dashboard/                        → /dashboard (greeting + stats + projetos + WP block + activity)
├── lps/
│   ├── page.tsx                      → lista de LPs
│   ├── new/                          → criar LP nova
│   ├── connect/[folder]/             → registrar pasta detectada
│   ├── [slug]/
│   │   ├── page.tsx                  → detalhe da LP
│   │   └── edit-visual/              → editor visual ✨
│   └── pmuclass/edit-content/        → editor específico do PMU CLASS
├── wp-pages/[domain]/[slug]/
│   ├── page.tsx                      → detalhe página WP
│   ├── edit/                         → editor inline (contentEditable + image replace) ✨
│   └── preview/                      → HTML completo em tela cheia
├── wordpress/                        → triagem 92 páginas + cópia
├── forms/
│   ├── page.tsx                      → lista de formulários
│   ├── new/                          → criar form
│   └── [id]/                         → editar form
├── f/[slug]/                         → form público (consumido por leads)
├── p/[slug]/                         → preview público
├── websites/                         → lista filtrada por tipo "website"
├── sugestoes/                        → sistema de sugestões
├── lixeira/                          → itens trashed
├── settings/
│   ├── page.tsx                      → settings gerais
│   └── users/                        → gestão de usuários (apenas senior)
├── analytics/                        → analytics (placeholder)
├── laser/                            → proxy/rota pra Jayo Laser
├── magicshadow/                      → proxy/rota pra Magic Shadow 3
└── api/
    ├── chat-pmu/                     → endpoint do AI chat
    ├── lp-content/[slug]/            → CRUD de conteúdo de LP
    └── wp-form-submit/               → submissão de forms WP
```

---

## 🔐 Sistema de autenticação

**Stack**: JWT (`jose`) + bcryptjs + cookie httpOnly `jay_session` (30 dias)

**3 roles**:
- `senior` — James hardcoded (`suporte@jamesolaya.com.br`, senha `@Suporte123`). Único que gerencia usuários.
- `admin` — pode editar/criar/excluir LPs e páginas. Não gerencia usuários.
- `viewer` — somente leitura.

**Helpers em [lib/auth.ts](../lib/auth.ts)**:
- `getCurrentUser()` — retorna sessão atual
- `requireAdmin()` / `requireSenior()` — guards pra Server Actions
- `canEdit(user)` / `isSenior(user)` / `isViewer(user)` — checks puros
- `signIn` / `signUp` / `signOut` / `updateMyName`
- `listUsers` / `setUserRole` / `deleteUser` (apenas senior)

**Persistência**: `data/users.json` via KV em [lib/storage.ts](../lib/storage.ts)

---

## 📦 Sub-projetos registrados

| Slug | Nome | Tipo | Porta dev | Stack | Status |
|---|---|---|---|---|---|
| `pmuclass` | PMU CLASS | website | 3001 | Vite + React 19 + Express + OpenRouter | published |
| `magic-shadow` | Magic Shadow 3 | lp | 5500 | HTML/CSS/JS puro | published |
| `laser` | Jayo Laser | lp | 8080 | TanStack Start + Radix UI | published |
| `teste` | Teste | lp | — | — | draft (de testes) |

Config: [lib/landing-pages.ts](../lib/landing-pages.ts) (estática) + [lib/lp-store.ts](../lib/lp-store.ts) (dinâmico via KV)

---

## 🗂️ Estado dos dados (`data/`)

**Gitignored** — não vai pro repo.

```
data/
├── lps_all.json                                   → LPs dinâmicas + overrides
├── users.json                                     → usuários cadastrados
├── wp-decisions.json (2 cópias?)                  → decisões da triagem WP
└── wp-content/                                    → 18 páginas WP copiadas
    ├── lp_inicio.json
    ├── lp_inmersion-pelo-a-pelo-*.json (6)
    ├── lp_peloapelo-sc.json
    ├── lp_pmu-upsell-*.json (2)
    ├── main_contato-inmersion.json
    ├── main_curso-online-profissao-remove.json
    ├── main_inicio.json
    ├── main_lips-sense-*.json (2)
    ├── main_pmu-class-super-oferta.json
    ├── main_pmu-pro.json
    └── main_up-pmuclass-1.json
```

---

## 🧩 Bibliotecas internas (`lib/`)

| Arquivo | O que faz |
|---|---|
| `auth.ts` | Auth completo (signin/signup/roles/JWT) |
| `storage.ts` | KV genérico (kvGet/kvSet via JSON local) |
| `landing-pages.ts` | Tipos + LPs estáticas + helpers de cor/status |
| `lp-store.ts` | CRUD dinâmico de LPs (`loadLps`, etc.) |
| `lp-content-store.ts` | Conteúdo editável das LPs |
| `connect-lp.ts` | Registrar pasta detectada como LP |
| `discover-lps.ts` | Scan de pastas em `jayacademy/` não registradas |
| `wp-api.ts` | REST API WordPress (lista 92 páginas) |
| `wp-fetch-page.ts` | Busca REST + HTML público |
| `wp-content-storage.ts` | CRUD de páginas WP copiadas |
| `wp-decisions.ts` | Persistência das decisões da triagem |
| `wp-categorize.ts` | Heurística `isCampaign()` + `suggestionForPage()` |
| `embedded-html-store.ts` | Armazena HTML embedded de páginas |
| `forms-store.ts` | CRUD do sistema de formulários |
| `suggestions-store.ts` | CRUD do sistema de sugestões |
| `activity-log.ts` | Log de ações (lido pelo activity feed) |

---

## 🎨 Componentes (`components/`)

**Layout**: `sidebar.tsx`, `sidebar-nav.tsx`, `topbar.tsx`, `dashboard-topbar.tsx`, `user-menu.tsx`

**LPs/WP**: `lp-card.tsx`, `lp-actions-menu.tsx`, `wp-page-card.tsx`, `wp-page-row.tsx`, `wp-saved-card.tsx`, `detected-folder-card.tsx`

**Editor**: `editor-shell.tsx`, `image-replace-modal.tsx`, `publish-button.tsx`

**Genéricos**: `collapsible-section.tsx`, `pending-button.tsx`, `empty-state.tsx`, `copy-now-button.tsx`, `copyable-url.tsx`, `edit-quick-link.tsx`, `editable-greeting.tsx`, `site-url-link.tsx`, `search-modal.tsx` (⌘K), `quick-actions.tsx`, `orbit-icons.tsx`, `wp-form-behavior.tsx`

---

## 🆕 Sessão 2026-06-01 (tarde) — Page Builder (Opção 3 da sugestão seed-3)

Implementada a 3ª das 3 ideias salvas em `suggestions-store.ts`: criar páginas do zero com blocos pré-feitos, sem WordPress nem React custom.

**Arquivos novos**:
- [`lib/page-builder-store.ts`](../lib/page-builder-store.ts) — Schema + CRUD + defaults + helpers de cor
- [`lib/builder-html-render.ts`](../lib/builder-html-render.ts) — Renderer HTML template puro (sem React, pra rota pública)
- [`components/page-builder/public-renderer.tsx`](../components/page-builder/public-renderer.tsx) — Renderer React (pra preview do editor)
- [`components/page-builder/builder-editor.tsx`](../components/page-builder/builder-editor.tsx) — Editor visual (Client Component)
- [`app/lps/[slug]/build/page.tsx`](../app/lps/[slug]/build/page.tsx) — Rota do editor
- [`app/lps/[slug]/build/actions.ts`](../app/lps/[slug]/build/actions.ts) — Server Actions (save + init)

**Arquivos modificados**:
- [`app/p/[slug]/route.ts`](../app/p/[slug]/route.ts) — Detecta builder page antes de WP. Renderiza HTML + Tailwind CDN + Google Fonts.
- [`app/lps/new/page.tsx`](../app/lps/new/page.tsx) — Checkbox "Construir com blocos" (default marcado). Cria builder page vazia + redireciona pro editor.
- [`app/lps/actions.ts`](../app/lps/actions.ts) — `createLpAction` aceita `useBuilder=1` form field.
- [`app/lps/[slug]/page.tsx`](../app/lps/[slug]/page.tsx) — Botão "Editar com blocos" (se já tem builder) ou "Construir com blocos" (se ainda não).
- [`data/lps_all.json`](../data/lps_all.json) — LP "teste" agora published com stack "Blocos (page builder)" pra servir de demo.

**Arquivos seed (demo)**:
- [`data/builder-page_teste.json`](../data/builder-page_teste.json) — Página demo com Hero + FAQ + CTA visível em `/p/teste`.

**7 tipos de bloco implementados** (em vez dos 5 originais):
1. `hero` — Eyebrow + título + subtítulo + bg image opcional + CTA
2. `testimonials` — Grid de cards com foto/nome/role/texto
3. `faq` — Accordion `<details>` nativo
4. `cta` — Bloco com gradient bg + título + botão branco
5. `pricing` — Grid de planos com plano destacado opcional
6. `text` — Markdown básico (`**bold**`, `_italic_`, `[link](url)`, `## H2`, `### H3`)
7. `image` — Solo + alt + caption opcional

**7 temas de cor** (accents): pink-orange, purple-fuchsia, amber-orange, gold-black, rose, blue-indigo, emerald. + toggle dark/light mode.

**Editor UX**:
- Sidebar esquerda: tema (accent + dark mode) + lista de blocos com botões reorder/duplicate/delete/add-below
- Centro: preview ao vivo dos blocos (Client Component usando o renderer React)
- Sidebar direita: painel de edição por tipo de bloco (campos específicos)
- Topbar: nome da LP + status de save + botão "Ver no ar" + botão Salvar
- Click no bloco no preview seleciona ele
- Aviso de "Não salvo" + confirm antes de sair

**Decisão técnica importante**: Next 16 bloqueia `react-dom/server` em route handlers. Fiz 2 renderers — um React pra preview no editor, um HTML template puro pra rota pública. Documentado em [`historico-decisoes.md`](./historico-decisoes.md).

**Tailwind via CDN no /p/[slug]**: pra MVP. Trocar por CSS extraído quando deployar em produção.

**Testado**: HTTP 200 em `/p/teste` (3902 bytes), contém "Teste do Page Builder", "tailwindcss" e "Funciona mesmo". TypeScript passa limpo.

---

## 🆕 Sessão 2026-06-15 — Polimento visual Magic Shadow (`public/magicshadow/`)

Iteração visual-first com James (editar `portal/public/magicshadow/` → push repo `jay-academy`). Tudo em `styles.css` + `index.html`:

- **Seção benefícios** ("O que as clientes ideais buscam"): linha dourada brilhante costurando imagem→texto (anel glow na imagem + linha que sai dela e corre por cima do título, com ponto de luz na junção).
- **Seção diferencial**: números 01–04 um pouco maiores.
- **Díptico PESO VISUAL | leves/elegantes/naturais**:
  - Kickers "— o que era —" / "— o que o mercado busca —" ancorados nos **cantos opostos do topo** (soltos do `__inner`; `__inner` perdeu `position:relative`, z-index segue via flex item).
  - "O PESO VISUAL" trocou outline vazado por **Poppins sólida** (PESO em dourado).
  - "leves, elegantes e naturais" menor + **escada descendo pra direita** (nth-child 2/3/4 indent progressivo).
  - Lado claro **ancorado pelo topo** (`align-items: flex-start`) pra intro travar; bloco título+lista desce via margin-top no nth-child(2).
  - Seção estendida (min-height até 1080px); frase de fechamento + botão **em fluxo** (grid-rows `1fr auto`); botão centralizado sobre a divisória; blocos preto/cream estendidos pra baixo.
  - **Cor dos blocos = cor real da imagem** (amostrei pixels via System.Drawing): escuro `#140D08`, claro `#EFE6D9`; os fades das colunas dissolvem no MESMO tom (sem emenda). ⚠️ há override inline no `<head>` do index.html (mobile <900px) que precisa acompanhar qualquer mudança dessas cores.
- ⚠️ **Mobile do díptico ainda não foi verificado a fundo** nesta sessão (James revisou desktop). Pendente checar empilhado.

---

## 🆕 Sessão 2026-06-15 (tarde) — Gestão WP estilo WordPress + IA + performance + mobile

**Área de gestão de páginas WP nova** (`/wp-pages`):
- Lista estilo WP: busca, filtros (status/categoria/domínio), seleção múltipla + ações em lote (publicar/despublicar/categorizar/lixeira). Componente [`wp-manage-list.tsx`](../components/wp-manage-list.tsx).
- "Gerenciar" no dashboard abre essa lista em **aba nova**; removido o "Ver as X restantes".
- Server actions: [`manage-actions.ts`](../app/wp-pages/manage-actions.ts) — quickPublish/Unpublish, publishAll/unpublishAll, bulk*, rename, duplicate, generateSummary.

**Detail da página WP** ([`page.tsx`](../app/wp-pages/[domain]/[slug]/page.tsx)) — segue o padrão da detail de LP:
- **Publicada** → gestão limpa: Editar(renomear)/Duplicar/Mover-lixeira + "Sobre essa página" + Atalhos (Abrir página, Editar visualmente). Webhook **só pra forms**.
- **Não publicada** → mantém categorizar + publicar.
- Componente [`wp-page-actions.tsx`](../components/wp-page-actions.tsx) (rename modal/duplicar/lixeira/despublicar).

**Resumo IA automático** — ao publicar, gera resumo (máx 3 linhas) via OpenRouter ([`ai-summary.ts`](../lib/ai-summary.ts) + [`page-summary.ts`](../lib/page-summary.ts)). Sem botão; fallback gera em background. ⚠️ Precisa `OPENROUTER_API_KEY` (só na Vercel; local não tem). Campo `summary` no `WpPageContent`.

**Performance**: fontes via `next/font` (sem render-block); `/p/[slug]` com `stale-while-revalidate` (nunca trava); code-split já ok por rota; force-dynamic mantido (auth).

**Mobile**: editores visuais (edit-visual, build, wp-edit) **bloqueados no mobile** com aviso ([`desktop-only-editor.tsx`](../components/desktop-only-editor.tsx)). Forms/texto livres (funcionam no touch).

**Fidelidade mobile WP**: confirmado que copiar→servir→editar preserva `<head>`/CSS/viewport (editor salva doc inteiro). Adicionada garantia de `<meta viewport>` no `/p`.

**Animações**: feedback tátil global nos botões (press scale + hover) no [`globals.css`](../app/globals.css).

**Pendente (precisa de você):** deploys + páginas-com-erro reais → precisa do **token Vercel** (deploys) + health-check (erro). Botões de animação e resumo IA: validar no ar.

---

## 🆕 Sessão 2026-06-15 (noite) — Roadmap de features (SEO/mídia/analytics/backup/agendamento)

Deploy `b63ba0a` no ar. **KV (Upstash) + Blob já provisionados e com nomes de env certos** (`KV_REST_API_URL/TOKEN`, `BLOB_READ_WRITE_TOKEN`) → **persiste em produção** (a história de "dados resetam" era desatualizada).

- **Sidebar nova** ([sidebar-shell.tsx](../components/sidebar-shell.tsx)): Home · grupo **URLs** retrátil (Websites/LPs/Forms) · Biblioteca de mídia · Analytics · Config · **colapsável**. Sugestões virou **lampadazinha no topbar**. (sidebar-nav.tsx removido)
- **SEO por página**: atalho "SEO da página" em Atalhos → modal ([seo-shortcut.tsx](../components/seo-shortcut.tsx) + [seo-editor.tsx](../components/seo-editor.tsx)) com preview Google/share. Injeta meta tags no `/p` (`applySeo`). Campos no `WpPageContent`.
- **Biblioteca de mídia** (`/midia`): [media-store.ts](../lib/media-store.ts)/[media-types.ts](../lib/media-types.ts) + [media-library.tsx](../components/media-library.tsx). Upload (Blob) + por URL, categorias, busca. **Integrada nos editores** via [media-picker.tsx](../components/media-picker.tsx) (page builder, trocar imagem, SEO).
- **Analytics** (`/analytics`): [analytics-store.ts](../lib/analytics-store.ts) + beacon em `/p` → `/api/track` (classifica origem). Leads **só em forms**. ⚠️ `/api/track` e `/api/cron` liberados no middleware.
- **Backup** (Config, só senior): [backup-store.ts](../lib/backup-store.ts) — snapshot de tudo, restaurar, baixar JSON.
- **Agendamento**: campos `scheduledPublishAt/UnpublishAt` + [schedule-control.tsx](../components/schedule-control.tsx) + worker `/api/cron/publish` + `vercel.json`. ⚠️ **Hobby = cron 1x/dia** (`0 9 * * *`); Pro → trocar pra `*/15`.
- Fix: hidratação dos cards do dashboard (stretched link).

**⚠️ Aprendizado:** `vercel.json` com cron `*/15` **rejeitava o deploy inteiro no Hobby** (sem aparecer na lista). Cron > 1x/dia exige Pro.

**Pulado do roadmap (decisão James):** #3 health-check, #5 templates, #6 domínios, #9 forms independentes, #10 integrações nativas.

---

## 🆕 Sessão 2026-06-16 — Importar por link + fim do /p/ + mobile

- **Importar por link** ([import-by-link.tsx](../components/import-by-link.tsx) + [import-actions.ts](../app/wp-pages/import-actions.ts)): cola URLs do WP → copia (REST por slug + fullHtml). Tem "publicar automaticamente". Botão no topo de Gerenciar páginas.
- **Páginas WP** virou item da sidebar (grupo URLs); bloco WP duplicado do dashboard removido; "Todos os projetos" mostra páginas WP **publicadas** (placed || published).
- **Fim do /p/** ⭐: páginas publicadas servem **no slug raiz** (`/metodo-fio-a-fio`) via [app/[slug]/route.ts](../app/[slug]/route.ts) (re-exporta o GET de /p). Middleware **invertido**: protege só os ADMIN_PREFIXES; resto público (slug raiz = público). `/p/` antigo ainda funciona (backward compat). URLs exibidas atualizadas pra sem /p/. ⚠️ Pra valer no domínio próprio: apontar jayacademy.com.br → portal (DNS) DEPOIS de importar tudo (senão WP some e dá 404 em páginas não importadas).
- **Mobile** ⭐ (desktop intacto, tudo via `lg:`): sidebar virou **gaveta** (☰ canto sup-esq, off-canvas + backdrop) — [sidebar-shell.tsx](../components/sidebar-shell.tsx); dashboard/headers/conteúdo com padding mobile + clearance do hamburguer (`pt-16`); ProjectRow/WpProjectRow só nome+status no mobile; tabelas com `overflow-x-auto`; **Atividade recente + Deploys movidos pra Configurações no mobile** ([admin-feeds.tsx](../components/admin-feeds.tsx)).
- Animação de entrada de página (fade) via [app/template.tsx](../app/template.tsx).
- ⚠️ Mobile é **primeira passada** — editores visuais/builder/modais/forms podem precisar de refino.

---

## 🆕 Sessão 2026-06-16 (tarde) — Novo vídeo de entrada do PMU CLASS

O site que o James vê em `jay-academy.vercel.app/pmuclass` é servido por `portal/public/pmuclass/` (cópia do build do app Vite) — **mesmo padrão do Magic Shadow**. O app fonte fica em `PMUCLASS/PMU-CLASS/` (repo `lafferreira91/PMU-CLASS`, mas o que está no ar vem do dist copiado pro portal, não desse repo).

- App PMU CLASS rebuildado (`npm run build`, base `/pmuclass/`) com o **novo intro cinematográfico** `cinema.mp4` (7.8MB) + áudio sincronizado `stvideo_audio.mp3` (substitui o `stvideo.mp4` antigo). Lógica do intro no [HeroCarousel](../../PMUCLASS/PMU-CLASS/src/App.tsx) (`fullVideo`/`canPlayIntro`, toca 1x por sessão via `sessionStorage`).
- Sincronizado `PMUCLASS/PMU-CLASS/dist/` → `portal/public/pmuclass/` (limpa + copia assets/videos/index.html).
- Commit `7c959a0` + push `main` → deploy automático Vercel.
- ⚠️ **Fluxo pra atualizar o PMU CLASS no ar**: rodar `npm run build` em `PMUCLASS/PMU-CLASS/`, copiar `dist/{assets,videos,index.html}` pra `portal/public/pmuclass/`, commitar e pushar o repo `jay-academy`. Os backups pesados em `src/assets/` (`stvideo_*_backup`, `_original`, `video james.MOV` etc., ~320MB) **não** são usados — só `cinema.mp4` + `stvideo_audio.mp3` entram no build.

---

## 🆕 Sessão 2026-06-22/23 — Díptico Magic Shadow: nova imagem + faixa preta

Iteração visual-first com James no díptico "PESO VISUAL" (dobra 8) de `portal/public/magicshadow/`.

- **Imagem trocada**: `sobrancelha-pesada.png` → **`case_sonia.jpeg`** (copiada de `Magic Shadow 3/assets/` pra `portal/public/magicshadow/assets/`). Mantido enquadramento `right center / cover` (testei zoom 168% mas James pediu pra voltar ao original).
- **Sombra reforçada**: overlay lateral do lado escuro subiu pra `0.96/0.8/0.48` + vinheta radial `::before` pra `0.76`.
- **Base/faixa = PRETO PURO `#000000`** (decisão firme do James — aprovado "ficou bom agr"). Antes era `#140D08` (amostrado da imagem antiga); testei `#1B1714` e `#3A2A1E` (tons da `case_sonia`) mas ele queria preto. ⚠️ Contraria a regra antiga de evitar `#000` no MS — não reverter. Anotado em [[projeto_magic-shadow]].
- Cache-buster do styles.css bumpado a cada push. Commits: `eb2349c` → `9d06d43` (main, deploy auto Vercel).

---

## 🆕 Sessão 2026-06-23 — Localizador de assets do WP (desconectar do WordPress)

**Problema (James):** páginas copiadas do WP vinham "incompletas" (imagens em branco) e dependiam do WP. Como vamos **desligar o WP**, isso não pode acontecer.

**Diagnóstico:** a "incompletude" eram imagens em **lazy-load** travadas no placeholder SVG (o `lazyload.min.js` do WP não roda direito no portal). Pior: a cópia puxa do WP **imagens (72) + CSS (26) + JS (15)** — todos absolutos pro `lp.jayacademy.com.br`. Quando o WP cair, a página perde imagem **e todo o visual (CSS)**. Decisão do James: **baixar TUDO**.

**Solução — localizador de assets:**
- [`lib/wp-localize-core.ts`](../lib/wp-localize-core.ts) — núcleo PURO (testável): `extractWpAssetUrls` (src/srcset/data-lazy-src/url()/JSON escapado do Elementor), `delazyHtml` (joga a imagem real no `src`, mata o placeholder → conserta a "incompleta"), `localizeHtml`/`rewriteUrls`/`rewriteCssUrls`. **13 testes** ([`.test.ts`](../lib/wp-localize-core.test.ts), `node --test`). Validado no HTML real: 127 assets, 0 refs WP, 0 placeholders.
- [`lib/wp-localize.ts`](../lib/wp-localize.ts) — orquestrador `localizePage(domain, slug)`: baixa cada asset (imagens→Blob + biblioteca de mídia cat. "Importadas do WP"; CSS/JS→Blob), **CSS recursivo** (url() de fontes/fundos por dentro), **dedup global via KV** (`wpasset:<hash>` → CSS/JS do Elementor baixado 1x pras 95 páginas), reescreve `fullHtml`+`content`, marca `localizedAt`. Concorrência 8, teto 25MB/asset.
- **Automático na cópia**: [`import-actions.ts`](../app/wp-pages/import-actions.ts) chama `localizePage` ao importar por link (não-fatal).
- **Backfill das 95 já copiadas**: [`app/api/wp-localize/route.ts`](../app/api/wp-localize/route.ts) — abrir `/api/wp-localize` logado como admin → tela que processa em lotes de 2 e **auto-avança (meta-refresh)** até 100%. Resumível (pula `localizedAt`). Modo 1 página: `?slug=X&domain=lp` (JSON). **Não é botão permanente.**
- Campos novos em `WpPageContent`: `localizedAt`, `localizeStats`. Categoria "Importadas do WP" em `media-types.ts`.

**⚠️ Fora de escopo (a pedido do James):** reescrever os **links** dos botões (ainda apontam pro WP) — fica pra depois. **Limitações:** vídeos >25MB e URLs WP que só aparecem em JSON não-padrão ficam externos. Cópia em massa antiga (`copyMarkedPagesAction`) não localiza inline (timeout) — backfill cobre.

**Status:** buildou + tsc limpo + 13 testes. ⏳ **Pendente: rodar o backfill no ar (James abre o link) + verificar `/basic-magic-shadow` apontando pro Blob.**

---

## ✅ Features completas

- [x] **Page Builder Webflow-style** (`/lps/[slug]/build`) — 7 blocos + 7 temas + editor com preview ao vivo · 2026-06-01
- [x] Auth com 3 roles (senior/admin/viewer)
- [x] Lobby + dashboard com stats e activity feed
- [x] Triagem WordPress (92 páginas, 2 domínios)
- [x] Cópia completa WP (REST + HTML público com CSS/imagens)
- [x] 18 páginas WP copiadas
- [x] Editor inline contentEditable para páginas WP
- [x] Modal de replace de imagem
- [x] Editor visual para LPs (`/lps/[slug]/edit-visual`)
- [x] Editor de conteúdo PMU CLASS (`/lps/pmuclass/edit-content`)
- [x] Sistema de status (draft/published/archived)
- [x] Lixeira com trashed flag
- [x] Sistema de formulários (criação, listagem, público em `/f/[slug]`)
- [x] Sistema de sugestões
- [x] Preview público (`/p/[slug]`)
- [x] Search modal ⌘K
- [x] Activity log lateral (admin/senior)
- [x] Gestão de usuários (apenas senior)
- [x] Quick actions no dashboard
- [x] Editable greeting
- [x] Auto-detect de pastas novas
- [x] Sidebar colapsável com lista de LPs

---

## 🚀 Deploy

- **Projeto Vercel**: `jay-academy.vercel.app` (account `mktjamesolaya2-5547s-projects`)
- **Mesmo projeto serve**: portal admin na raiz + PMU CLASS em `/pmuclass`
- **Git remote**: `github.com/mktjamesolaya2/jay-academy` (branch `main`)
- **Fluxo de deploy**: integração Vercel ↔ GitHub. **`git push origin main` → Vercel buildaautomático** e promove pra produção. Sem CLI manual.

### Como atualizar produção

```
cd portal
git add <arquivos>
git commit -m "..."
git push origin main
```

Em ~1-2 min sobe em `jay-academy.vercel.app`. Ver status em https://vercel.com/mktjamesolaya2-5547s-projects/jay-academy/deployments

### ⚠️ Limitações persistentes do deploy

- **Dados resetam a cada build**: filesystem do servidor Vercel é efêmero (`data/` local não vai pro Vercel). Pra persistir LPs/users/páginas builder em produção, precisa provisionar **Vercel KV** (Marketplace) + adicionar `KV_REST_API_URL` + `KV_REST_API_TOKEN` nas env vars.
- **AUTH_SECRET dev hardcoded**: setar var real em produção (jose JWT signing).
- **Senior hardcoded sempre disponível**: `suporte@jamesolaya.com.br` / `@Suporte123` funciona mesmo sem KV.

### Pendências de produção
  - [ ] Setar `AUTH_SECRET` real (hoje tem default dev) via dashboard Vercel
  - [ ] Provisionar Vercel KV via Marketplace + setar env vars
  - [ ] Conferir `vercel.json` (path rewrites pra `/pmuclass`, `/laser`, `/magicshadow`) — pode não existir ainda

### Último push pra produção (2026-06-01)

- **Commit**: `b477f15 Add page builder with 7 block types`
- **Inclui**: Page Builder completo (Opção 3) + sistema de notas
- **Build esperado**: ~1-2 min depois do push

## ⚠️ Bugs conhecidos / dívidas

- [ ] `revalidatePath` às vezes não atualiza browser — workaround: F5
- [ ] `data/wp-decisions.json` e `data/wp_decisions.json` (com underscore) — duplicação suspeita, conferir qual é o oficial
- [ ] `main_lips-sense-avancado-micropigmentacao-labial-estrategica-2.json` na raiz de `data/` (não em `wp-content/`) — pode ser leftover de teste

---

## 🔮 Próximos passos (ver `backlog-proximos-passos.md`)

Sessão atual (2026-06-01): **criar sistema de notas robusto pra não perder mais progresso.** Em andamento.

Depois disso, James decide qual é a próxima feature. Possíveis caminhos:
1. Polimento visual do portal (decisão de 2026-05-28: focar layout antes de features)
2. Implementar próxima feature do backlog
3. Deploy real em `jayacademy.com.br` (precisa decidir destino do WP atual)

---

## 📝 Como atualizar este arquivo

Ao fim de cada sessão:
1. Mover features novas pra "Features completas"
2. Atualizar "Estrutura atual de rotas" se criou rotas novas
3. Atualizar "Bibliotecas internas" e "Componentes" se criou arquivos novos
4. Anotar bugs descobertos em "Bugs conhecidos"
5. Atualizar "Última atualização" no topo
