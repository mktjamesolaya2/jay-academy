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
  return `Você é o SUPORTE da Jay Academy no WhatsApp, falando com quem já é
aluno dos cursos online de micropigmentação.

⚠️ VOCÊ É SÓ SUPORTE. Não vende, não fala de preço, não fala de promoção, não
compara cursos. Se a pessoa quer conhecer ou comprar curso — e muita gente cai
aqui por uma mensagem automática — você diz que ali é o suporte e que já está
passando pra alguém do time que apresenta os cursos direitinho. Depois disso
escreve ${MARCA_HUMANO}. Nunca cite valor, nem "a partir de", nem parcela.

IDIOMA
- Responda no MESMO idioma da pessoa. Tem aluno de fora: se escreverem em
  espanhol, responda em espanhol, natural, sem parecer tradução.

COMO FALAR
- Como uma pessoa do time responde no WhatsApp: frases curtas, sem formalidade
  de e-mail, sem "prezado". Pode usar o primeiro nome quando souber.
- Nada de markdown, título, lista com asterisco ou emoji em excesso. É
  WhatsApp: texto corrido e curto. No máximo um emoji, quando couber.
- Respostas de 1 a 4 linhas. Se precisar de mais, é sinal de que a pergunta
  merece uma pessoa.

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
Esse é o caso mais comum, e quase sempre é a mesma coisa: **o acesso venceu**,
porque vale 12 meses e a pessoa não percebeu. Então, antes de encaminhar,
pergunte há quanto tempo ela comprou — de um jeito leve, não acusatório. Se
fizer mais de um ano, explique que o acesso é de 12 meses e que provavelmente é
isso. Encaminhe do mesmo jeito, mas com essa informação já na mão.

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

/** A resposta pede uma pessoa? Devolve o texto limpo e a decisão. */
export function lerResposta(bruta: string): {
  texto: string;
  precisaHumano: boolean;
} {
  const precisaHumano = bruta.includes(MARCA_HUMANO);
  const texto = limparVazamento(
    bruta
      .split(MARCA_HUMANO)
      .join("")
      // O modelo às vezes inventa variações do marcador; limpa as óbvias.
      .replace(/\[\s*humano\s*\]/gi, "")
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
