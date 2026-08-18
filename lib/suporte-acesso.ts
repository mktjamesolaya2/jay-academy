import { diasRestantes, venceEm } from "./hotmart-acesso.ts";

/**
 * O fluxo real do suporte, contado pelo James:
 *
 * > *"a aluna chega: 'não consigo acessar meu curso'. A gente pede o e-mail
 * > dela. Confere a data: se estiver dentro dos 12 meses, é só reenviar o
 * > acesso. Se estiver fora, informa que encerrou."*
 *
 * ⚠️ Tudo aqui é função pura e determinística, e isso é de propósito: **datas e
 * situação de compra não passam pelo modelo pra ele decidir**. Se um modelo
 * gratuito calculasse "está dentro dos 12 meses?", uma conta errada viraria
 * "seu acesso está ativo" pra quem não tem — e a aluna ficaria tentando entrar.
 * O modelo só coloca em palavras o que já foi decidido aqui.
 */

export type CompraConhecida = {
  produto: string;
  compradaEm: string;
  situacao: string;
  /** Nome de quem comprou — vem da Hotmart. */
  nome?: string;
};

/**
 * Só o primeiro nome, com a inicial maiúscula.
 *
 * ⚠️ A Hotmart devolve "RENATA LIMA DE SOUZA" em caixa alta. Chamar a aluna de
 * "RENATA" no WhatsApp parece grito, e o nome completo parece cadastro. Uma
 * pessoa do time escreveria "Oi, Renata!".
 */
export function primeiroNome(completo?: string): string | null {
  const p = (completo ?? "").trim().split(/\s+/)[0];
  if (!p || p.length < 2) return null;
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

export type SituacaoAcesso =
  | { tipo: "sem-email" }
  | { tipo: "nao-encontrado"; email: string }
  /**
   * Já dissemos "não achei" pra ESTE e-mail e ela voltou a falar.
   *
   * ⚠️ Existe porque a conversa entrava em laço: "não achei, será que foi
   * outro e-mail?" → "usei esse mesmo" → "não achei, será que foi outro
   * e-mail?" → três vezes, até a IA pedir comprovante. Visto numa conversa
   * real (protocolo 756484).
   */
  | { tipo: "nao-encontrado-de-novo"; email: string }
  | { tipo: "no-prazo"; email: string; compras: CompraConhecida[]; venceEm: string; dias: number }
  | { tipo: "vencido"; email: string; compras: CompraConhecida[]; venceuEm: string }
  | { tipo: "cancelado"; email: string }
  /**
   * ⚠️ NÃO é "não achei" — é "não consegui procurar". A diferença importa: a
   * primeira nega a compra de quem pagou.
   */
  | { tipo: "nao-consegui-conferir"; email: string };

/** Acha o e-mail que a aluna mandou no meio da mensagem. */
export function acharEmail(texto: string): string | null {
  const m = texto.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

/**
 * A aluna está falando de problema de acesso?
 *
 * É o gatilho de TUDO: sem ele a consulta na Hotmart não roda, a IA não recebe
 * fato nenhum e improvisa — foi exatamente o que aconteceu numa conversa real.
 *
 * ⚠️ A primeira versão exigia a construção "não consigo acessar" e deixava
 * passar **sete de oito** jeitos de dizer a mesma coisa. O caso que estourou:
 * *"estou com problemas para acessar o meu curso online"*. A aluna deu o
 * e-mail, a busca nunca rodou, e o atendimento foi empurrado pra uma pessoa sem
 * ninguém nunca ter olhado se ela tinha acesso.
 *
 * Agora são três famílias, e basta uma:
 *  1. palavra de acesso + palavra de problema ("problemas para acessar")
 *  2. conteúdo que não aparece ("o curso não abre", "a aula não carrega")
 *  3. o que não chegou ("não recebi o acesso", "não veio o e-mail")
 */
export function ehProblemaDeAcesso(texto: string): boolean {
  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  // Onde ela entra: a área, a conta, a aula.
  const ondeEntra =
    /(acess|entrar|logar|login|senha|plataforma|area de membro|assistir|minhas aulas|ver as aulas)/.test(t);
  // Que algo está errado. ⚠️ Vai além de negação: "perdi", "sumiu" e "esqueci"
  // não têm "não" nenhum e são dos jeitos mais comuns de relatar o problema.
  const algoErrado =
    /(nao|problema|dificuldade|erro|sumi|expir|venc|bloquead|fora do ar|perdi|esqueci|recuperar|resetar|redefinir|travad|invalid|impossivel)/.test(t);

  if (ondeEntra && algoErrado) return true;

  // O conteúdo que não aparece — ela nem fala em "acesso", fala no curso.
  const conteudo = /(curso|aula|modulo|video|apostila|material)/.test(t);
  const naoAparece = /(nao abre|nao carrega|nao aparece|nao roda|nao ta indo|sumi|travou|fora do ar)/.test(t);
  if (conteudo && naoAparece) return true;

  // O que era pra ter chegado e não chegou.
  const naoChegou = /(nao recebi|nao chegou|nao veio|nao mandaram)/.test(t);
  const oQue = /(acesso|email|e-mail|link|senha|curso|liberac)/.test(t);
  if (naoChegou && oQue) return true;

  return false;
}

/** Decide a situação a partir do que a Hotmart já contou. */
export function avaliarAcesso(
  email: string | null,
  compras: CompraConhecida[],
  hoje = new Date(),
  /** A consulta na Hotmart estava disponível? Sem isso, lista vazia mente. */
  consultaDisponivel = true,
  /**
   * E-mails que a gente JÁ disse a ela que não foram encontrados.
   *
   * ⚠️ É o que quebra o laço. A regra "só chame uma pessoa se ela confirmar
   * que o e-mail está certo" estava escrita no texto que vai pro modelo, e ele
   * simplesmente não cumpriu — a aluna confirmou e ele repetiu a pergunta.
   * Condição que decide se alguém vai ser atendido não pode morar em
   * instrução.
   */
  jaAvisados: string[] = []
): SituacaoAcesso {
  if (!email) return { tipo: "sem-email" };
  if (!compras.length) {
    if (!consultaDisponivel) return { tipo: "nao-consegui-conferir", email };
    return jaAvisados.includes(email.toLowerCase())
      ? { tipo: "nao-encontrado-de-novo", email }
      : { tipo: "nao-encontrado", email };
  }

  const canceladas = ["cancelled", "canceled", "cancelada", "refunded", "reembolsada"];
  const validas = compras.filter(
    (c) => !canceladas.includes(c.situacao.toLowerCase())
  );
  if (!validas.length) return { tipo: "cancelado", email };

  // A compra mais recente é a que manda: é ela que dá o prazo maior.
  const maisNova = [...validas].sort(
    (a, b) => new Date(b.compradaEm).getTime() - new Date(a.compradaEm).getTime()
  )[0];

  const dias = diasRestantes(maisNova.compradaEm, hoje);
  const vence = venceEm(maisNova.compradaEm);
  if (dias >= 0) {
    return {
      tipo: "no-prazo",
      email,
      compras: validas,
      venceEm: vence.toISOString(),
      dias,
    };
  }
  return {
    tipo: "vencido",
    email,
    compras: validas,
    venceuEm: vence.toISOString(),
  };
}

const dataBR = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

/**
 * O bloco de fatos que entra no prompt.
 *
 * ⚠️ Os fatos vêm prontos e as instruções são fechadas. O modelo não recebe a
 * data crua pra "concluir" nada — ele recebe a conclusão e escreve a frase.
 */
export function fatosDoAcesso(s: SituacaoAcesso): string {
  switch (s.tipo) {
    case "sem-email":
      return `A aluna falou de problema de acesso e AINDA NÃO deu o e-mail.
Peça o e-mail da compra, só isso, numa frase curta. Não peça mais nada junto e
não chame ninguém do time ainda.`;

    case "nao-consegui-conferir":
      return `⚠️ NÃO conseguimos consultar a compra de "${s.email}" agora — o
sistema que confere isso está fora do ar do nosso lado.

NÃO diga que não achou a compra dela: você NÃO procurou. Dizer que não achou
nega a compra de quem pagou, e é o pior erro possível aqui.

Diga que não conseguiu confirmar neste momento e que vai chamar uma pessoa do
time pra verificar. Passe para uma pessoa.`;

    case "nao-encontrado":
      return `Procuramos "${s.email}" e NÃO achamos compra nenhuma com esse
e-mail.

DIGA ISSO A ELA, com estas duas partes na mesma mensagem:
1. que você procurou e não encontrou compra com esse e-mail;
2. que talvez ela tenha comprado com outro, e peça pra ela conferir.

⚠️ NÃO fale de prazo, vencimento nem dos 12 meses. Sem compra encontrada você
não tem data nenhuma — chutar "deve ter vencido" é inventar um fato sobre a
vida dela.

⚠️ NÃO chame uma pessoa do time nesta mensagem. Ela ainda pode ter digitado
errado ou ter comprado com outro e-mail, e chamar alguém agora é empurrar pra
frente um caso que a própria aluna resolve na mensagem seguinte.`;

    case "nao-encontrado-de-novo":
      return `Você JÁ disse a ela que não achou compra com "${s.email}", e ela
continuou.

⚠️ NÃO pergunte de novo se foi outro e-mail. NÃO peça a data da compra. NÃO
peça comprovante, número de transação nem print — a gente não usa nada disso.
NÃO repita que não encontrou.

Perguntar a mesma coisa duas vezes faz ela contar tudo de novo pra alguém que
não escutou da primeira. Se a compra existe e não aparece pra gente, quem
resolve é uma pessoa — a busca é por e-mail e ela já se esgotou aqui.

Diga, numa frase, que vai chamar alguém do time pra achar a compra dela. Passe
para uma pessoa.`;

    case "cancelado":
      return `A compra de "${s.email}" consta como cancelada. NÃO explique o
motivo, NÃO fale de reembolso e NÃO afirme nada sobre dinheiro. Diga que precisa
verificar isso com o time e passe para uma pessoa.`;

    case "no-prazo": {
      const lista = s.compras.map((c) => c.produto).join(", ");
      const nome = primeiroNome(s.compras.find((c) => c.nome)?.nome);
      return `${nome ? `A aluna se chama ${nome} — trate ela pelo nome.
` : ""}O acesso de "${s.email}" está DENTRO dos 12 meses.
Curso(s): ${lista}. Pelo nosso registro vai até ${dataBR(s.venceEm)} (${s.dias} dias).
Então NÃO é acesso vencido. Diga que está tudo certo com o prazo e que vai pedir
para o time reenviar o acesso dela agora — e passe para uma pessoa, porque o
reenvio é feito na Hotmart, à mão.`;
    }

    case "vencido": {
      const lista = s.compras.map((c) => c.produto).join(", ");
      const nome = primeiroNome(s.compras.find((c) => c.nome)?.nome);
      return `${nome ? `A aluna se chama ${nome} — trate ela pelo nome.
` : ""}O acesso de "${s.email}" VENCEU em ${dataBR(s.venceuEm)}.
Curso(s): ${lista}. Explique com gentileza que o acesso vale 12 meses e que o
dela encerrou nessa data — é o motivo de não conseguir entrar, e quase ninguém
sabe disso. Diga que o time pode explicar como seguir com o curso. NÃO cite
preço, NÃO ofereça plano nem condição: quem faz isso é a pessoa. Passe para uma
pessoa.`;
    }
  }
}

/** Saudação pelo horário de Brasília — é como o time abre o atendimento. */
export function saudacao(hoje = new Date()): string {
  const h = Number(
    hoje.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false })
  );
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}
