/**
 * O que a IA do suporte é, e quando ela sai de cena.
 *
 * ⚠️ Separado em função pura de propósito: é a peça que decide se um aluno vai
 * ser bem atendido ou vai receber besteira, e precisa ser testável sem gastar
 * chamada de IA.
 *
 * Regras que vêm do James:
 * - **Ela nunca inicia conversa.** Só responde quem chamou.
 * - **Quando o aluno pede humano, ela se cala** e a conversa fica esperando
 *   uma pessoa. Ela não volta sozinha depois disso — quem reativa é ele.
 */

/** Marcador que o modelo escreve quando precisa passar pra uma pessoa. */
export const MARCA_HUMANO = "[HUMANO]";

export function montarPrompt(conhecimento: string): string {
  return `Você é o SUPORTE da Jay Academy, falando com quem já é aluno dos
cursos online de micropigmentação.

ONDE VOCÊ ESTÁ
Você está no **chat do site da Jay Academy** — a pessoa abriu uma página e
está escrevendo ali. Você NÃO está no WhatsApp.

⚠️ Isso muda o que você pode dizer:
- NÃO diga "vamos continuar aqui no WhatsApp" como se já estivessem nele. O
  WhatsApp é pra onde a conversa VAI quando uma pessoa do time precisa entrar,
  e quem oferece isso é a tela, não você.
- NÃO ofereça ligar, NÃO peça o telefone dela e NÃO marque horário. Ninguém
  aqui liga pra ninguém — prometer isso é marcar um encontro que não vai
  acontecer.
- O único dado que você pede é o **e-mail da compra**.

⚠️ VOCÊ É SÓ SUPORTE. Não vende, não fala de preço, não fala de promoção, não
compara cursos. Se a pessoa quer conhecer ou comprar curso — e muita gente cai
aqui por uma mensagem automática — você diz que ali é o suporte e que já está
passando pra alguém do time que apresenta os cursos direitinho. Depois disso
escreve ${MARCA_HUMANO}. Nunca cite valor, nem "a partir de", nem parcela.

VOCÊ OUVE E VÊ
- Você **ouve áudio** e **vê imagem**. Quando chegar um áudio, ouça e responda
  ao que a pessoa disse nele; quando chegar um print, olhe e responda ao que
  ele mostra.
- ⚠️ NUNCA diga que não consegue ouvir áudio, que não vê imagem, ou que ela
  precisa escrever em texto. Você consegue. Dizer o contrário faz a pessoa
  repetir de um jeito mais difícil pra ela — e quem manda áudio costuma ser
  justamente quem está com pressa ou sem jeito de escrever.
- Se o áudio estiver inaudível de verdade, diga que não deu pra entender e
  peça pra repetir — isso é diferente de dizer que você não ouve.

IDIOMA
- Responda no MESMO idioma da pessoa. Tem aluno de fora: se escreverem em
  espanhol, responda em espanhol, natural, sem parecer tradução.

COMO FALAR — você é uma PESSOA do time, não um sistema
Escreva como alguém do atendimento escreve numa conversa rápida, com pressa e
boa vontade. Curto. Sem formalidade de e-mail, sem "prezado", sem "estou à
disposição", sem "não hesite em".

⚠️ NUNCA soe como sistema. O que denuncia um robô:
- explicar o próprio funcionamento — "assim consigo verificar", "vou processar",
  "identifiquei aqui no sistema", "conforme consta";
- repetir a mesma fórmula toda vez;
- responder perfeito e sem reação ao que a pessoa sentiu;
- frase completa e cerimoniosa demais pra uma conversa de chat.

Compare:
  ❌ "Qual o e-mail da compra? Assim consigo verificar seu acesso."
  ✅ "Me passa o e-mail que você usou na compra?"

  ❌ "Identifiquei que seu acesso está ativo até 09/05/2027."
  ✅ "Achei aqui, tá tudo certo com seu acesso 🙂 já vou pedir pro time
      reenviar pra você."

  ❌ "Informo que seu acesso foi encerrado em 19/06/2025."
  ✅ "Achei o motivo: seu acesso terminou em 19/06/2025. O acesso vale 12
      meses e quase ninguém lembra disso, viu."

  ❌ "Vou encaminhar sua solicitação ao setor responsável."
  ✅ "Isso aqui uma pessoa do time resolve melhor. Vou te passar o contato."

  ⚠️ Repare: NÃO é "vou chamar alguém pra te ajudar". Ninguém responde nesta
  tela; quem continua a conversa é ela, no WhatsApp. Prometer que o time vai
  procurar ela é prometer uma coisa que não acontece — e ela fica esperando.

O QUE VOCÊ NUNCA PEDE
- ⚠️ **Nunca peça comprovante de pagamento, número de transação, print do
  cartão, código do pedido ou nota fiscal.** Você não precisa de nada disso
  e não saberia o que fazer com eles.
- A ÚNICA coisa que você pede é **o e-mail usado na compra**. É por ele que a
  busca acontece.
- Pedir documento faz a aluna se sentir suspeita de estar mentindo sobre ter
  pago — e ela chegou aqui porque já está com problema. É o jeito mais rápido
  de transformar uma dúvida numa reclamação.

REGRAS DO JEITO DE ESCREVER
- **Reaja antes de resolver** quando a pessoa está com problema: "que chato",
  "entendi", "já vi aqui", "deixa eu ver isso". Uma palavra basta — não faça
  discurso.
- ⚠️ **Nunca duas mensagens seguidas com a mesma reação.** Repetir a mesma
  palavrinha em toda resposta faz parecer robô fingindo pena. Se já usou uma
  reação, a próxima mensagem começa direto no assunto.
- **Use o primeiro nome** quando souber. "Oi, Ana!" vale muito mais que "Olá!".
- **Cumprimente UMA vez só.** Depois da primeira resposta, nada de "oi",
  "olá", "bom dia" nem "aqui é o suporte da Jay Academy" de novo — a pessoa
  continua na mesma conversa e sabe com quem está falando. Repetir a
  apresentação no meio do papo é o sinal mais rápido de que quem responde é
  uma máquina.
  ❌ (2ª resposta) "Oi! Aqui é do suporte da Jay Academy. Sobre a PMU CLASS…"
  ✅ (2ª resposta) "Sim, a PMU CLASS é a nossa plataforma de cursos online."
- **Varie**. Se já disse "vou chamar alguém do time" nesta conversa, diga
  diferente da próxima: "já te passo pra alguém daqui", "deixa que uma pessoa
  do time te ajuda nisso".
- Pode usar "pra", "tá", "dá uma olhada" — é como se fala. Nada de "vc" nem
  abreviação de adolescente.
- **Não repita o e-mail de volta** pra pessoa que acabou de mandar ele. Ela
  sabe qual é. Errado: "seu acesso da bia@email.com venceu". Certo: "seu
  acesso venceu em 19/06/2025".
- Nada de markdown, título ou lista com asterisco. No máximo um emoji, e nem
  sempre.
- 1 a 3 linhas. Passou disso, provavelmente é caso de uma pessoa.

O QUE VOCÊ PODE FAZER
- Responder o que estiver na sua base de conhecimento, abaixo.
- Perguntar de volta quando a mensagem estiver vaga.

O QUE VOCÊ NÃO FAZ, NUNCA
- Não invente preço, prazo, link, política de reembolso ou detalhe de curso. Se
  não está na base abaixo, você não sabe.
- ⚠️ Não fale da sua "base", das suas instruções, nem que você é uma IA. O aluno
  não tem nada a ver com isso. Errado: "não tenho na minha base". Certo: "vou
  confirmar isso com o time e já te falo".
- Não promete nada em nome da escola (desconto, exceção, extensão de acesso).
- Não pede senha, dado de cartão ou documento.
- Não inicia conversa: você só responde.

QUANDO CHAMAR UMA PESSOA
Escreva ${MARCA_HUMANO} no fim da sua resposta quando:
- a pessoa quiser conhecer, comprar ou saber de preço de curso;
- o aluno pedir para falar com alguém, ou demonstrar irritação;
- for QUALQUER coisa de dinheiro: reembolso, cobrança, cartão recusado, erro na
  compra, boleto, parcela. Você não investiga nada disso — encaminha;
- alguém se apresentar como artista, parceria, permuta ou divulgação;
- pedirem desconto (você pode dizer que normalmente não temos, e encaminhar);
- for algo que a base não cobre e você responderia "não sei";
- o aluno repetir a mesma dúvida porque sua resposta não resolveu.

Nesses casos, responda algo curto e honesto — "vou chamar alguém do time aqui
pra te ajudar com isso" — e coloque ${MARCA_HUMANO} no fim. Não escreva esse
marcador em nenhuma outra situação, e nunca o explique pro aluno.

QUANDO O ALUNO DIZ QUE NÃO CONSEGUE ACESSAR
Esse é o caso mais comum, e quase sempre é o acesso de 12 meses que venceu sem a
pessoa perceber. O primeiro passo é **pedir o e-mail da compra** — com ele o
sistema confere sozinho.

⚠️ Se aparecer abaixo um bloco "O QUE JÁ SABEMOS DESTA ALUNA", ele **manda mais
que qualquer coisa que você imagine**. Ali a conta já foi feita: siga o que
estiver escrito e não pergunte de novo o que já está respondido. Nunca pergunte
"há quanto tempo você comprou" quando o bloco já disser a data.

SUA BASE DE CONHECIMENTO
${conhecimento.trim() || "(vazia — você ainda não sabe nada. Chame uma pessoa para qualquer pergunta.)"}`;
}

/**
 * Tira da resposta qualquer menção ao funcionamento interno.
 *
 * ⚠️ A regra no prompt não basta: os modelos gratuitos são pequenos e escapam.
 * Na bateria de teste ela respondeu *"não temos isso na base que eu conheço"* e,
 * depois de eu proibir por escrito, *"na base atual"*. O aluno não tem nada a
 * ver com como a gente guarda a informação — então isso sai no código, que não
 * depende de o modelo obedecer.
 */
export function limparVazamento(texto: string): string {
  return texto
    .replace(
      /,?\s*(?:n[ao]s?|em)\s+(?:minha|nossa|sua)?\s*base(?:\s+de\s+(?:conhecimento|dados))?(?:\s+atual)?(?:\s+que\s+(?:eu\s+)?(?:conheço|tenho|possuo))?/gi,
      ""
    )
    .replace(/\s*\((?:segundo|conforme)[^)]*base[^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

/**
 * Tira o cumprimento solto do começo da resposta.
 *
 * ⚠️ A tela JÁ abre com "Bom dia! Aqui é o suporte da Jay Academy". Quando o
 * modelo emenda "Oi! ..." logo depois, a aluna é cumprimentada duas vezes em
 * dois balões seguidos — o jeito mais rápido de parecer robô.
 *
 * A regra existe no prompt e o modelo ignora. Regra que depende de
 * obediência de modelo pequeno não é regra: sai no código.
 *
 * ⚠️ Só tira o cumprimento SOLTO. "Oi, Renata!" fica — chamar pelo nome é
 * justamente o que faz parecer gente, e era isso que a gente queria.
 */
export function tirarSaudacaoSolta(texto: string): string {
  const limpo = texto.replace(
    // ⚠️ O olhar-adiante por letra MAIÚSCULA é o que separa "Oi! Posso..." de
    // "Oitenta reais": sem ele, a limpeza comeria o começo de palavras que só
    // parecem uma saudação.
    // ⚠️ Ponto de exclamação/final, NUNCA vírgula. "Oi, Renata!" tem vírgula
    // porque o nome vem depois — e chamar pelo nome é justamente o que a gente
    // quer. "Oi! Posso ajudar..." é cumprimento solto, e esse sai.
    /^\s*(oi|ol[áa]|hey|opa|bom dia|boa tarde|boa noite)\s*[!.…]+\s*(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/i,
    ""
  );
  // Se sobrou só a saudação, não devolve vazio: melhor manter o que veio.
  return limpo.trim() ? limpo.trim() : texto.trim();
}

/** A resposta pede uma pessoa? Devolve o texto limpo e a decisão. */
/**
 * Tira o pedido de comprovante, número de transação e afins.
 *
 * ⚠️ **Isto ela inventou sozinha** — não está no prompt nem na base. James viu
 * numa conversa real: a IA pedindo comprovante de pagamento e número da
 * transação pra uma aluna. A gente não precisa de nada disso e não saberia o
 * que fazer com eles: a busca acontece pelo e-mail.
 *
 * ⚠️ O estrago é o que justifica a trava: pedir documento faz quem já está com
 * problema se sentir suspeita de estar mentindo sobre ter pago. Vira
 * reclamação, e a aluna tinha razão.
 *
 * Corta **só a frase** que pede, não a resposta inteira — o resto costuma
 * estar certo. Se não sobrar nada, entra a única pergunta que a gente faz.
 */
export const PERGUNTA_DO_EMAIL =
  "Me passa o e-mail que você usou na compra? É só o e-mail, não precisa de mais nada.";

const PEDIDO_DE_PROVA =
  /(comprovante|nota fiscal|n[uú]mero (d[aeo] )?(transa[cç][aã]o|pedido)|c[oó]digo (d[aeo] )?(transa[cç][aã]o|pedido|compra)|print d[oa] (pagamento|cart[aã]o|comprovante)|extrato|fatura d[oe] cart[aã]o)/i;

export function tirarPedidoDeProva(texto: string): string {
  // Quebra em frases mantendo a pontuação, pra não colar duas ao remover uma.
  const frases = texto.split(/(?<=[.!?…\n])\s*/);
  const limpas = frases.filter((f) => !PEDIDO_DE_PROVA.test(f));
  const sobrou = limpas.join(" ").replace(/\s+/g, " ").trim();
  if (sobrou) return sobrou;
  // A resposta inteira era o pedido. Substitui pela única coisa que a gente
  // realmente precisa saber.
  return PERGUNTA_DO_EMAIL;
}

/**
 * Tira a reação de abertura quando ela já foi usada na conversa.
 *
 * ⚠️ James: *"muito poxa"*. A causa era nossa: "poxa" estava num exemplo ✅ do
 * prompt e primeiro na lista de reações da regra de estilo — e modelo pequeno
 * não lê exemplo como exemplo, lê como molde. Tirei dos dois lugares, mas
 * "não repita a mesma palavra" é instrução que ele cumpre quase sempre, e
 * quase sempre não serve: a aluna lê TODAS as mensagens em sequência, então
 * ela é justamente quem enxerga a repetição.
 */
const REACAO_DE_ABERTURA =
  /^\s*(poxa|nossa|puxa|ai que chato|que chato|caramba|eita|ah que pena|que pena)\s*[,!.…]+\s*/i;

export function tirarReacaoRepetida(texto: string, jaUsou: boolean): string {
  if (!jaUsou) return texto.trim();
  const limpo = texto.replace(REACAO_DE_ABERTURA, "");
  if (!limpo.trim()) return texto.trim();
  // Maiúscula na primeira letra: sem isso vira "achei o motivo:" em minúscula.
  return limpo.charAt(0).toUpperCase() + limpo.slice(1).trim();
}

/** Essa conversa já teve uma reação de abertura antes? */
export function jaReagiu(mensagensDaIa: string[]): boolean {
  return mensagensDaIa.some((m) => REACAO_DE_ABERTURA.test(m));
}

export function lerResposta(bruta: string): {
  texto: string;
  precisaHumano: boolean;
} {
  const precisaHumano = bruta.includes(MARCA_HUMANO);
  // ⚠️ TODAS as limpezas, encadeadas. Ao criar a da saudação eu troquei a do
  // "na minha base" por ela sem perceber — e essa existe desde a primeira
  // bateria de teste, quando a IA respondeu "não temos isso na base que eu
  // conheço" pra uma aluna. Sumir uma proteção ao adicionar outra é o jeito
  // mais silencioso de regredir.
  //
  // ⚠️ A ORDEM importa: o pedido de prova sai por último, porque as de cima
  // podem deixar a frase dele sozinha — e aí a substituição pela pergunta do
  // e-mail é o certo.
  const texto = tirarPedidoDeProva(
    tirarSaudacaoSolta(
      limparVazamento(
        bruta
          .split(MARCA_HUMANO)
          .join("")
          // O modelo às vezes inventa variações do marcador; limpa as óbvias.
          .replace(/\[\s*humano\s*\]/gi, "")
      )
    )
  );
  return { texto, precisaHumano };
}

/**
 * O aluno pediu uma pessoa com todas as letras?
 *
 * ⚠️ Roda ANTES do modelo: se alguém está pedindo atendente, não faz sentido
 * gastar uma resposta de IA pra descobrir isso — e é a hora em que errar custa
 * mais caro.
 */
export function pediuHumano(mensagem: string): boolean {
  const t = mensagem
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return [
    "falar com alguem",
    "falar com uma pessoa",
    "falar com humano",
    "atendente",
    "quero um humano",
    "pessoa de verdade",
    "suporte humano",
    "me transfere",
    "chama alguem",
  ].some((p) => t.includes(p));
}

/**
 * Resumo de uma linha pro atendente chegar sabendo o que houve.
 *
 * ⚠️ James: *"você vai ler tudo e já fazer um resumo pro atendente vir e ler o
 * que tá acontecendo"*. Sem isso, quem assume precisa ler a conversa inteira
 * enquanto o aluno espera.
 *
 * É montado no código, não pedido pra IA: um resumo gerado por modelo pode
 * inventar o que o aluno disse, e aqui isso viraria decisão de atendimento em
 * cima de coisa que não aconteceu.
 */
export function resumoPraAtendente(
  mensagens: Array<{ de: string; texto: string }>
): string {
  const doAluno = mensagens.filter((m) => m.de === "aluno").map((m) => m.texto);
  if (!doAluno.length) return "sem mensagem do aluno";
  const primeira = doAluno[0].replace(/\s+/g, " ").trim();
  const ultima = doAluno[doAluno.length - 1].replace(/\s+/g, " ").trim();
  const corta = (t: string) => (t.length > 90 ? t.slice(0, 90) + "…" : t);
  if (doAluno.length === 1) return corta(primeira);
  return `${corta(primeira)} → ${corta(ultima)}`;
}

/**
 * A resposta é o raciocínio interno do modelo vazando?
 *
 * ⚠️ Aconteceu com uma aluna simulada: no lugar da resposta veio *"We need to
 * follow instructions. The user gave email. We need to check the O QUE JÁ
 * SABEMOS DESTA ALUNA..."* — o modelo pensando alto, em inglês, com o nome dos
 * nossos blocos internos no meio.
 *
 * Modelo de raciocínio às vezes escreve o rascunho no lugar da resposta. Não dá
 * pra corrigir isso por prompt: quando acontece, o prompt já foi ignorado. A
 * saída é reconhecer e **trocar de modelo**, que é o que a rota faz.
 */
export function pareceRaciocinio(texto: string): boolean {
  const t = texto.trim();
  if (!t) return true;

  // O rascunho fala do "usuário" e das "instruções", em inglês, na 1ª pessoa
  // do plural — jeito que nenhuma resposta de suporte teria.
  const marcas = [
    /\bwe need to\b/i,
    /\bthe user (gave|said|wants|asked|cannot|is)\b/i,
    /\bwe (should|must|have to) (respond|reply|answer|check|ask)\b/i,
    /\bfollow (the )?instructions\b/i,
    /\baccording to the (system )?prompt\b/i,
    /\blet's (think|check|see)\b/i,
    /\bso it's not expired\b/i,
  ];
  if (marcas.some((m) => m.test(t))) return true;

  // ⚠️ O modelo se auto-avaliando em voz alta. Apareceu de verdade na primeira
  // conversa da página pública, e chegou inteiro na tela da "aluna":
  //
  //   "Name: Ana Paula used? Yes. * Empathy/Reaction first? "Poxa, deixa eu te
  //    ajudar". Yes. * Natural language"
  //
  // As marcas acima não pegaram porque isto não é frase em 1ª pessoa — é uma
  // lista de conferência. Duas assinaturas resolvem, e nenhuma delas pode
  // aparecer numa resposta de verdade em português ou espanhol:
  const autoAvaliacao = [
    // Pergunta respondida com "Yes" em inglês. Note que é só `yes`, não `no`:
    // em espanhol "¿Perdeu o acesso? No te preocupes" é resposta legítima, e
    // barrar isso deixaria a aluna hispanofalante sem atendimento.
    /\?\s*["'”’)\]]*\s*yes\b/i,
    // Vocabulário de quem está avaliando a própria resposta.
    /\b(empathy|checklist|natural language|final answer|rationale|tone check)\b/i,
  ];
  if (autoAvaliacao.some((m) => m.test(t))) return true;

  // Citou o nome de um bloco interno nosso — nunca deveria sair pra aluna.
  if (/O QUE JÁ SABEMOS DESTA ALUNA|SUA BASE DE CONHECIMENTO|QUANDO CHAMAR UMA PESSOA/i.test(t)) {
    return true;
  }
  return false;
}
