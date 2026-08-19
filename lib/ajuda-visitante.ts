/**
 * O que a aluna enxerga da própria conversa, na página pública `/ajuda`.
 *
 * ⚠️ Este arquivo já teve a validação de um formulário de entrada (nome +
 * e-mail antes de falar). O formulário caiu — James: *"o email a gente pergunta
 * so dps pq a gente não sabe c é a duvida da pessoa"*. Pedir e-mail de compra
 * pra quem só quer saber onde está a apostila é atrito à toa.
 *
 * O nome agora sai do que ela escreve (`lib/nome-no-chat.ts`), e o e-mail é
 * pedido pela IA só quando o assunto se revela ser acesso.
 */

/**
 * A conversa, filtrada pro navegador dela.
 *
 * ⚠️ Lista branca de propósito. A conversa guarda coisa que é nossa e não dela
 * (marcações internas, e o que a gente vier a acrescentar depois) — devolver o
 * objeto inteiro faria qualquer campo novo vazar pro navegador sem ninguém
 * decidir isso.
 */
export function conversaPraAluna(c: {
  mensagens: Array<{ de: string; texto: string; em: string }>;
  aguardandoPessoa: boolean;
  encaminharPraConversa?: boolean;
}): {
  mensagens: Array<{ de: "aluno" | "atendente"; texto: string; em: string }>;
  comPessoa: boolean;
} {
  return {
    // ⚠️ Pra aluna, IA e pessoa do time são "o atendimento". Ela não precisa
    // saber quem respondeu o quê — e marcar "isto foi um robô" só faria ela
    // desconfiar da resposta certa.
    mensagens: c.mensagens.map((m) => ({
      de: m.de === "aluno" ? ("aluno" as const) : ("atendente" as const),
      texto: m.texto,
      em: m.em,
    })),
    // ⚠️ Pra ELA, "com pessoa" significa "vá falar com alguém" — é o que liga
    // o botão do WhatsApp. Reenvio de acesso não é isso: já foi resolvido, e
    // mandar ela procurar atendimento faria parecer que não foi.
    comPessoa: c.aguardandoPessoa && c.encaminharPraConversa !== false,
  };
}
