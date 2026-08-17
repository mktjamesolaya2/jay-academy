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
  | { tipo: "no-prazo"; email: string; compras: CompraConhecida[]; venceEm: string; dias: number }
  | { tipo: "vencido"; email: string; compras: CompraConhecida[]; venceuEm: string }
  | { tipo: "cancelado"; email: string };

/** Acha o e-mail que a aluna mandou no meio da mensagem. */
export function acharEmail(texto: string): string | null {
  const m = texto.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

/**
 * A aluna está falando de problema de acesso?
 *
 * Serve pra IA pedir o e-mail em vez de ficar dando volta — é o passo que o
 * James faz primeiro em todo atendimento desse tipo.
 */
export function ehProblemaDeAcesso(texto: string): boolean {
  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const naoConsegue = /(nao|n)\s*(estou\s*)?(consigo|consegui|to\s*conseguindo|estou\s*conseguindo)/.test(t);
  const acesso = /(acess|entrar|logar|login|assistir|ver as aulas|plataforma|curso)/.test(t);
  const sumiu = /(sumiu|expirou|expirado|venceu|vencido|bloquead|fora do ar)/.test(t);
  return (naoConsegue && acesso) || (sumiu && acesso);
}

/** Decide a situação a partir do que a Hotmart já contou. */
export function avaliarAcesso(
  email: string | null,
  compras: CompraConhecida[],
  hoje = new Date()
): SituacaoAcesso {
  if (!email) return { tipo: "sem-email" };
  if (!compras.length) return { tipo: "nao-encontrado", email };

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

    case "nao-encontrado":
      return `Procuramos "${s.email}" e não achamos compra nenhuma com esse
e-mail. Diga isso com cuidado — pode ser que ela tenha comprado com outro — e
pergunte se pode ter usado outro e-mail. Se ela confirmar que é esse mesmo,
passe para uma pessoa.`;

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
