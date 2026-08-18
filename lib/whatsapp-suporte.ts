import { SEM_NOME, nomeDaMensagem } from "./nome-no-chat.ts";
import { protocoloDe } from "./protocolo.ts";

/**
 * A ponte pro WhatsApp.
 *
 * ⚠️ James: *"o atendente não vai continuar a conversa aqui no chat. Quando for
 * pra continuar a conversa, a gente vai encaminhar pro WhatsApp"*. O chat da
 * página é **primeiro contato e triagem**; a conversa de verdade acontece lá.
 *
 * Isso muda o que a tela precisa fazer na hora do encaminhamento: em vez de
 * pedir pra aluna esperar de olho na página, ela ganha um botão que abre a
 * conversa já começada.
 *
 * ⚠️ Se o número não estiver configurado, **nada disso aparece** e a tela volta
 * ao comportamento antigo (o time responde pelo portal). Botão de WhatsApp
 * quebrado numa tela de suporte é pior que botão nenhum: a aluna clica, cai num
 * lugar vazio e conclui que ninguém vai responder.
 */

/**
 * O número do suporte.
 *
 * ⚠️ Fica no código, e não só em variável de ambiente, porque **não é
 * segredo**: já está público nas landing pages da Jay Academy. Em variável,
 * ele precisaria ser configurado na Vercel pra funcionar em produção — e o
 * botão ficaria invisível pra aluna até alguém lembrar disso.
 *
 * `WHATSAPP_SUPORTE` continua valendo se existir: trocar o número passa a
 * ser mudar uma variável, sem esperar deploy.
 */
export const NUMERO_PADRAO = "5519998930861";

export function numeroDoSuporte(env = process.env): string {
  return (env.WHATSAPP_SUPORTE ?? "").trim() || NUMERO_PADRAO;
}

/**
 * Só os dígitos, do jeito que o WhatsApp espera (país + DDD + número).
 *
 * Aceita o número escrito como gente escreve — "+55 (19) 99893-0861".
 */
export function numeroLimpo(bruto: string | undefined): string | null {
  const d = (bruto ?? "").replace(/\D/g, "");
  // Curto demais é engano (esqueceram o país, ou colaram meio número). Longo
  // demais também. O intervalo cobre Brasil e os países vizinhos.
  return d.length >= 10 && d.length <= 15 ? d : null;
}

/** Onde o problema dela cabe na primeira mensagem, sem virar textão. */
const LIMITE_PROBLEMA = 180;

export type DadosDoEncaminhamento = {
  nome?: string;
  conversaId: string;
  /** Com o que ela chegou — a frase dela, não um resumo escrito por nós. */
  problema?: string;
  /** O e-mail, se ela já tiver dado. É o que resolve liberação de acesso. */
  email?: string;
};

/**
 * A mensagem que já vem escrita quando o WhatsApp abre.
 *
 * ⚠️ **A conversa não tem como "ir junto" de verdade.** O WhatsApp só carrega
 * o texto que ela envia — não dá pra empurrar o histórico pra dentro dele. Por
 * isso a mensagem leva o ESSENCIAL escrito: o nome, a frase com que ela chegou
 * e o e-mail. Assim quem atende já abre o WhatsApp sabendo do que se trata, e
 * ela não recomeça do zero.
 *
 * ⚠️ Vai a **frase dela**, entre aspas, e não um resumo nosso. Resumo teria que
 * ser escrito por modelo — gastaria cota, demoraria na hora do clique e poderia
 * inventar. E a frase dela é o que ela reconhece como sendo o que disse.
 *
 * ⚠️ O código continua indo: é ele que abre a conversa inteira no portal, com
 * print e áudio, que é o que não cabe numa mensagem de texto.
 */
export function mensagemInicial(
  nomeOuDados: string | undefined | DadosDoEncaminhamento,
  conversaIdSolto?: string
): string {
  const d: DadosDoEncaminhamento =
    typeof nomeOuDados === "object" && nomeOuDados !== null
      ? nomeOuDados
      : { nome: nomeOuDados, conversaId: conversaIdSolto ?? "" };

  // ⚠️ "Sem nome ainda" é o rótulo que o PAINEL usa quando a pessoa ainda não
  // se apresentou — não é nome de gente. Sem esta linha, a mensagem abria o
  // WhatsApp com "Oi! Sou Sem nome ainda." no lugar dela.
  const limpo = (d.nome ?? "").trim();
  const quem = limpo && limpo !== SEM_NOME ? `Sou ${limpo}. ` : "";
  // ⚠️ Vem de `protocoloDe`, e não de um corte feito aqui: este número é o
  // que ela vai ditar e o que ele vai buscar no painel. Duas contas separadas
  // um dia divergem, e o dia em que divergirem ela dita um número que não acha
  // nada — no meio de um atendimento que já deu errado.
  const codigo = protocoloDe(d.conversaId);

  const linhas = [`Oi! ${quem}Vim do chat do site.`];
  const problema = encurtar(d.problema);
  if (problema) linhas.push(`O que eu falei lá: "${problema}"`);
  const email = (d.email ?? "").trim();
  if (email) linhas.push(`Meu e-mail: ${email}`);
  linhas.push(`(atendimento ${codigo})`);
  return linhas.join("\n");
}

/**
 * Corta a frase sem cortar palavra no meio.
 *
 * ⚠️ Quebra de linha vira espaço: a mensagem já é multilinha, e um enter no
 * meio da frase dela faria parecer que acabou ali.
 */
function encurtar(bruto: string | undefined): string {
  const t = (bruto ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= LIMITE_PROBLEMA) return t;
  const corte = t.slice(0, LIMITE_PROBLEMA);
  const espaco = corte.lastIndexOf(" ");
  return (espaco > LIMITE_PROBLEMA * 0.6 ? corte.slice(0, espaco) : corte) + "…";
}

/** O link que abre o WhatsApp com a conversa já começada. */
export function linkWhatsApp(
  numeroBruto: string | undefined,
  dados: DadosDoEncaminhamento
): string | null {
  const numero = numeroLimpo(numeroBruto);
  if (!numero) return null;
  const texto = encodeURIComponent(mensagemInicial(dados));
  // `wa.me` é o endereço oficial e funciona no celular e no computador — abre o
  // aplicativo quando existe e o WhatsApp Web quando não.
  return `https://wa.me/${numero}?text=${texto}`;
}

/**
 * Com o que ela chegou — a primeira coisa que ela disse de verdade.
 *
 * ⚠️ A PRIMEIRA, e não a última. A última costuma ser a resposta a uma pergunta
 * da IA ("é esse mesmo", o e-mail, "sim") — sozinha ela não diz nada pra quem
 * vai atender. A primeira é o assunto: "não consigo acessar meu curso".
 *
 * ⚠️ "Oi" e o nome dela não contam. Quase toda conversa começa com um dos dois,
 * e mandar "O que eu falei lá: 'oi'" pro WhatsApp seria pior que não mandar
 * nada.
 */
export function problemaDaConversa(
  mensagens: Array<{ de: string; texto?: string }>
): string {
  for (const m of mensagens) {
    if (m.de !== "aluno") continue;
    const t = (m.texto ?? "").trim();
    if (!t || ehSoApresentacao(t)) continue;
    return t;
  }
  return "";
}

const SAUDACOES = /^(oi+|ol[áa]|hey|opa|bom dia|boa tarde|boa noite|tudo bem\??)[\s!.,]*$/i;

function ehSoApresentacao(texto: string): boolean {
  if (SAUDACOES.test(texto.trim())) return true;
  // Se o leitor de nome reconhece a frase inteira como uma apresentação, é
  // porque ela só disse quem é — o assunto ainda não veio.
  return nomeDaMensagem(texto) !== null;
}
