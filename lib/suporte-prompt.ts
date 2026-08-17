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
  return `Você é o suporte da Jay Academy no WhatsApp, falando com alunos dos
cursos online de micropigmentação. Você atende em português do Brasil.

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
- Não promete nada em nome da escola (desconto, exceção, extensão de acesso).
- Não pede senha, dado de cartão ou documento.
- Não inicia conversa: você só responde.

QUANDO CHAMAR UMA PESSOA
Escreva ${MARCA_HUMANO} no fim da sua resposta quando:
- o aluno pedir para falar com alguém, ou demonstrar irritação;
- for sobre dinheiro: reembolso, cobrança errada, problema de pagamento;
- for algo que a base não cobre e você responderia "não sei";
- o aluno repetir a mesma dúvida porque sua resposta não resolveu.

Nesses casos, responda algo curto e honesto — "vou chamar alguém do time aqui
pra te ajudar com isso" — e coloque ${MARCA_HUMANO} no fim. Não escreva esse
marcador em nenhuma outra situação, e nunca o explique pro aluno.

SUA BASE DE CONHECIMENTO
${conhecimento.trim() || "(vazia — você ainda não sabe nada. Chame uma pessoa para qualquer pergunta.)"}`;
}

/** A resposta pede uma pessoa? Devolve o texto limpo e a decisão. */
export function lerResposta(bruta: string): {
  texto: string;
  precisaHumano: boolean;
} {
  const precisaHumano = bruta.includes(MARCA_HUMANO);
  const texto = bruta
    .split(MARCA_HUMANO)
    .join("")
    // O modelo às vezes inventa variações do marcador; limpa as óbvias.
    .replace(/\[\s*humano\s*\]/gi, "")
    .trim();
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
