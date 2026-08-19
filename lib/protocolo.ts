/**
 * O protocolo do atendimento.
 *
 * ⚠️ James: *"antes de transferir pro atendente, ela vai perguntar o nome, e vai
 * criar um número, um protocolo; no WhatsApp, quando solicitar o suporte, envia
 * esse protocolo, eu venho aqui e procuro"*.
 *
 * ⚠️ O protocolo **não é um contador**. É derivado do id da conversa, e isso é
 * de propósito: contador precisa de um número guardado em algum lugar que só
 * cresce, e duas mensagens ao mesmo tempo dariam o mesmo protocolo pra duas
 * alunas — que é exatamente o erro que estraga a busca. Derivado do id, ele já
 * nasce único e não depende de nada.
 */

/** Quantos caracteres o protocolo tem. Seis é o que dá pra ditar no telefone. */
const TAMANHO = 6;

/**
 * O protocolo de uma conversa.
 *
 * ⚠️ Sem vogais? Não — o id é hexadecimal, então só saem 0-9 e A-F. Isso já
 * evita sozinho o problema clássico de código curto: nenhuma palavra feia se
 * forma, e não existe O/0 nem I/1 pra confundir na hora de ditar.
 */
export function protocoloDe(conversaId: string): string {
  return (conversaId ?? "").replace(/-/g, "").slice(0, TAMANHO).toUpperCase();
}

/** Tira o que a pessoa digita a mais: espaço, traço, "protocolo", "#". */
export function limparBusca(bruto: string): string {
  return (bruto ?? "").trim().toLowerCase();
}

/**
 * Essa conversa combina com o que ele digitou?
 *
 * Procura por protocolo, nome ou e-mail — os três jeitos de alguém chegar aqui:
 * ela mandou o protocolo no WhatsApp, ela disse o nome, ou ele tem só o e-mail
 * da compra na mão.
 */
export function combinaBusca(
  conversa: { id: string; quem?: string; emailAluna?: string },
  busca: string
): boolean {
  const q = limparBusca(busca);
  if (!q) return true;

  // O protocolo pode ter vindo com "#" ou espaço no meio, colado do WhatsApp.
  const soLetras = q.replace(/[^a-z0-9]/g, "");
  if (soLetras && protocoloDe(conversa.id).toLowerCase().startsWith(soLetras)) return true;

  return [conversa.quem, conversa.emailAluna]
    .filter(Boolean)
    .some((c) => c!.toLowerCase().includes(q));
}

/* ── o nome antes do encaminhamento ──────────────────────────────────────── */

export type PassoDoEncaminhamento = "seguir" | "pedir-nome" | "encaminhar";

/**
 * A pergunta que falta antes de passar pra uma pessoa.
 *
 * ⚠️ James: *"para ajudar a reconhecer a aluna, antes de transferir pro
 * atendente, ela vai perguntar o nome"*. Sem nome, o protocolo chega no
 * WhatsApp sozinho e quem atende não sabe nem com quem está falando — e a
 * conversa começa por "quem é você?", que é o oposto de não repetir tudo.
 *
 * ⚠️ Isto mora aqui e não no prompt. "Pergunte o nome antes de transferir" é
 * uma instrução que um modelo grátis cumpre quase sempre — e quase sempre não
 * serve quando o que está em jogo é achar a aluna depois.
 *
 * ⚠️ **Só pergunta uma vez.** Se ela não quis dizer o nome, o encaminhamento
 * acontece assim mesmo. Insistir prenderia numa conversa em que ela já está
 * irritada o bastante pra ter pedido uma pessoa.
 */
export function passoDoEncaminhamento(estado: {
  precisaHumano: boolean;
  temNome: boolean;
  jaPediuNome: boolean;
}): PassoDoEncaminhamento {
  if (!estado.precisaHumano) return "seguir";
  if (estado.temNome || estado.jaPediuNome) return "encaminhar";
  return "pedir-nome";
}

/** O que a IA fala quando falta o nome. */
export function perguntaDoNome(): string {
  return "Claro, já vou te passar pra uma pessoa do time. Como é o seu nome?";
}

/**
 * O protocolo, ACRESCENTADO à resposta que a IA já deu.
 *
 * ⚠️ Acrescenta, não substitui. Eu tinha feito substituindo, e o estrago era
 * grande: quando a IA achava a compra e ia dizer "tá tudo certo com seu
 * acesso, já vou pedir pro time reenviar", esse texto era jogado fora e a
 * aluna recebia só "vou te passar pra uma pessoa". A informação que ela
 * procurou some, e a conversa vira um encaminhamento seco — parecendo que
 * ninguém olhou nada.
 *
 * O protocolo vem escrito na tela, além de ir na mensagem do WhatsApp: se ela
 * fechar a página antes de clicar no botão, o número ainda está com ela.
 */
export function comProtocolo(resposta: string, conversaId: string): string {
  const codigo = protocoloDe(conversaId);
  const texto = (resposta ?? "").trim();
  // Já falou o número? Não repete.
  if (texto.includes(codigo)) return texto;

  // ⚠️ Só o número. O bloco logo abaixo do balão já diz "pra continuar, é
  // melhor falar no WhatsApp" e já tem o botão — repetir a instrução aqui faz
  // a mesma frase aparecer três vezes na mesma tela, e uma tela que insiste
  // parece desconfiada de quem está lendo.
  const recado = `Seu protocolo é ${codigo}, anota aí.`;
  // Sem resposta nenhuma (modelo mudo), o recado precisa se explicar sozinho.
  return texto
    ? `${texto}

${recado}`
    : `Vou te passar pra uma pessoa do time. Seu protocolo é ${codigo} — é só mandar esse número que a gente já sabe do que se trata.`;
}

/* ── dois tipos de encaminhamento ────────────────────────────────────────── */

/**
 * Nem todo encaminhamento é assunto dela.
 *
 * ⚠️ James: *"a gente já informou que o acesso vai ser reenviado, então não tem
 * necessidade de mandar ir pro WhatsApp ou enviar protocolo"*. Tem razão: são
 * duas coisas diferentes com o mesmo nome.
 *
 * - **interno** — o acesso está válido e alguém do time vai reenviar. Ela já
 *   ouviu isso e não tem nada a fazer. Dar um protocolo aqui só cria dúvida
 *   ("preciso ir lá?"), e o botão de WhatsApp manda ela procurar atendimento
 *   por uma coisa que já está resolvida.
 * - **conversa** — precisa falar com gente: o acesso venceu, a compra consta
 *   cancelada, a gente não conseguiu conferir, ou ela pediu uma pessoa. Aí o
 *   protocolo é o que evita ela contar tudo de novo.
 *
 * ⚠️ Os dois continuam aparecendo na caixa do time. A diferença é só o que ELA
 * vê — quem trabalha precisa ver os dois.
 */
export type TipoDeEncaminhamento = "nenhum" | "interno" | "conversa";

export function tipoDeEncaminhamento(estado: {
  encaminhou: boolean;
  /** Só o reenvio de acesso é trabalho nosso, sem pendência do lado dela. */
  soReenvioDeAcesso: boolean;
}): TipoDeEncaminhamento {
  if (!estado.encaminhou) return "nenhum";
  return estado.soReenvioDeAcesso ? "interno" : "conversa";
}
