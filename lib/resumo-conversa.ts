/**
 * O resumo de um atendimento, pra quem abre o protocolo.
 *
 * ⚠️ James: *"muitas vezes a gente vai abrir o protocolo e vai ter apenas o
 * e-mail pra reenviar; seria interessante o chatbot gravar — ah, esse aqui o
 * acesso venceu; esse está sem acesso e mandou um print da compra"*.
 *
 * ⚠️ **Escrito por código, não pelo modelo.** Um resumo redigido pela I.A.
 * seria bonito e às vezes errado — e quem lê aqui vai agir em cima dele:
 * liberar acesso, responder sobre dinheiro, dizer que a compra não existe. O
 * que está aqui vem do que a gente MEDIU: a consulta na Hotmart, o e-mail que
 * ela deu, o anexo que ela mandou. Nada é interpretado.
 */

import { formatDateBR } from "./format-date.ts";

/** O que a consulta de acesso concluiu, guardado na conversa. */
export type SituacaoGravada =
  | "sem-email"
  | "nao-encontrado"
  | "nao-encontrado-de-novo"
  | "no-prazo"
  | "vencido"
  | "vitalicio"
  | "cancelado"
  | "nao-consegui-conferir";

export type ResumoDaConversa = {
  /** A frase que resolve o atendimento, ou "" quando ainda não dá pra dizer. */
  titulo: string;
  /** Fatos curtos: anexos, encerramento. */
  marcas: string[];
};

/**
 * ⚠️ Vem de `format-date`, com o fuso de São Paulo travado. Escrevendo uma
 * terceira cópia aqui eu já tinha errado: o servidor roda em UTC, e uma data
 * de meia-noite virava o DIA ANTERIOR na tela — "acesso ativo até 14/08"
 * quando o certo era 15/08.
 */
const dataBR = (iso: string | undefined) => formatDateBR(iso);

/**
 * A frase principal.
 *
 * ⚠️ Cada uma diz **o que fazer**, não o nome técnico da situação. "Acesso
 * ativo — falta reenviar" resolve o atendimento; "no-prazo" faz quem lê ter
 * que traduzir.
 */
function tituloDaSituacao(s: SituacaoGravada | undefined, quando: string | undefined): string {
  switch (s) {
    case "no-prazo":
      return quando
        ? `Acesso ativo até ${dataBR(quando)} — falta reenviar`
        : "Acesso ativo — falta reenviar";
    case "vencido":
      return quando ? `Acesso venceu em ${dataBR(quando)}` : "Acesso vencido";
    case "vitalicio":
      // ⚠️ Sem data: não vence. Escrever "até" aqui já seria meio caminho pra
      // alguém dizer pra ela que um dia acaba.
      return "Acesso VITALÍCIO — falta reenviar";
    case "cancelado":
      return "Compra consta cancelada";
    case "nao-encontrado":
    case "nao-encontrado-de-novo":
      return "Não achamos compra com o e-mail dela";
    case "nao-consegui-conferir":
      // ⚠️ Diferente de "não achamos": aqui a busca NÃO rodou. Confundir os
      // dois faz alguém dizer pra aluna que ela não comprou.
      return "Não deu pra conferir a compra";
    default:
      return "";
  }
}

export function resumirConversa(c: {
  situacaoAcesso?: SituacaoGravada;
  acessoEm?: string;
  mensagens: Array<{ de: string; texto: string }>;
  encerradaPelaAluna?: boolean;
  aguardandoPessoa?: boolean;
}): ResumoDaConversa {
  const marcas: string[] = [];

  // O anexo fica marcado no texto da mensagem dela — é assim que a caixa do
  // time sabe que veio um print, mesmo sem guardar o arquivo.
  const dela = c.mensagens.filter((m) => m.de === "aluno");
  if (dela.some((m) => m.texto.includes("(imagem)"))) marcas.push("mandou print");
  if (dela.some((m) => m.texto.includes("(áudio)"))) marcas.push("mandou áudio");
  if (c.encerradaPelaAluna) marcas.push("ela encerrou");

  return { titulo: tituloDaSituacao(c.situacaoAcesso, c.acessoEm), marcas };
}

/**
 * O assunto, quando a consulta de acesso não aconteceu.
 *
 * ⚠️ Nem toda conversa é sobre acesso. Sem isto, uma dúvida de conteúdo
 * apareceria no painel sem resumo nenhum — e o time abriria pra descobrir que
 * era só uma pergunta sobre a apostila.
 */
export function assuntoResumido(mensagens: Array<{ de: string; texto: string }>): string {
  const primeira = mensagens.find(
    (m) => m.de === "aluno" && m.texto.trim() && !/^\(.*\)$/.test(m.texto.trim())
  );
  const t = (primeira?.texto ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length <= 60 ? t : t.slice(0, 60).replace(/\s+\S*$/, "") + "…";
}
