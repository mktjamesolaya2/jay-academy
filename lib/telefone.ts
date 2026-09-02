// Regra única de telefone do portal: o que é um número aceitável e como ele sai
// daqui pro CRM. Módulo puro (sem import), no padrão de wp-localize-core.ts e
// rate-limit-core.ts, pra ser testável sem subir servidor.
//
// A regra nasceu do formulário da /transforma, que recusava qualquer telefone
// que não começasse com 55 — aluna de fora do Brasil não conseguia se inscrever.
// Postura: rigor no que é brasileiro (dá pra conferir de verdade), tolerância no
// resto do mundo (só faixa de tamanho, sem palpitar formato de país que a gente
// não conhece).

export type TelefoneOk = { ok: true; digitos: string; pais: "BR" | "outro" };
export type MotivoErro = "vazio" | "curto" | "longo" | "ddd" | "nono";
export type TelefoneErro = { ok: false; motivo: MotivoErro };
export type Telefone = TelefoneOk | TelefoneErro;

/** Faixa da E.164: nenhum telefone do mundo passa de 15 dígitos com DDI. */
const MAX_DIGITOS = 15;
const MIN_DIGITOS = 8;

function brasileiro(dddELocal: string): Telefone {
  const ddd = dddELocal.slice(0, 2);
  const local = dddELocal.slice(2);

  // DDD brasileiro vai de 11 a 99 — nenhum começa com 0 nem é "10".
  if (ddd[0] === "0" || ddd === "10") return { ok: false, motivo: "ddd" };
  // 8 dígitos = fixo antigo, 9 = celular. Fora disso está incompleto ou sobrando.
  if (local.length < 8) return { ok: false, motivo: "curto" };
  if (local.length > 9) return { ok: false, motivo: "longo" };
  // Celular brasileiro SEMPRE começa com 9 desde 2016. Um "9 dígitos" que não
  // começa com 9 é quase certeza erro de digitação — vale pedir conferida.
  if (local.length === 9 && local[0] !== "9") return { ok: false, motivo: "nono" };

  return { ok: true, digitos: "55" + dddELocal, pais: "BR" };
}

/**
 * Normaliza o telefone digitado. Devolve os dígitos COM DDI (ex.: 5511999998888)
 * — é assim que ele viaja pro CRM, sem máscara e sem ambiguidade.
 */
export function normalizarTelefone(bruto: string): Telefone {
  const texto = String(bruto ?? "").trim();
  const digitos = texto.replace(/\D/g, "");
  // Até 3 dígitos não é telefone curto, é campo em branco: é o "+55 " que o
  // formulário já vem preenchido, ou só o código de um país.
  if (digitos.length <= 3) return { ok: false, motivo: "vazio" };

  // O "+" é a única pista confiável de que a pessoa escreveu o DDI.
  const temMais = texto.trimStart().startsWith("+");

  // ⚠️ DDD 55 (Santa Maria/RS e região) contra DDI 55: a versão anterior comia
  // os dois primeiros dígitos sempre, e "55 99999-8888" virava "(99) 999-8888".
  // Um número de 10 ou 11 dígitos é local por definição — o 55 ali é DDD.
  const temDdiBrasil = digitos.startsWith("55") && digitos.length >= 12;

  if (temDdiBrasil) return brasileiro(digitos.slice(2));

  if (!temMais) {
    // Sem "+", quem escreve 10 ou 11 dígitos está escrevendo DDD + número.
    if (digitos.length >= 10 && digitos.length <= 11) return brasileiro(digitos);
    // E quem escreve menos que isso sem DDI é brasileiro que esqueceu o DDD —
    // deixar passar como "número de fora" faria o CRM recusar depois (422).
    if (digitos.length < 10) return { ok: false, motivo: "curto" };
  }

  // Resto do mundo: só faixa de tamanho, sem palpitar formato.
  if (digitos.length < MIN_DIGITOS) return { ok: false, motivo: "curto" };
  if (digitos.length > MAX_DIGITOS) return { ok: false, motivo: "longo" };
  return { ok: true, digitos, pais: "outro" };
}

/** Texto mostrado a quem preencheu — direto, sem jargão. */
export function mensagemDeErro(motivo: MotivoErro): string {
  switch (motivo) {
    case "vazio":
      return "Digite seu WhatsApp com DDD.";
    case "curto":
      return "Faltam números no WhatsApp. Confira o DDD (ou o código do país, se for de fora do Brasil).";
    case "longo":
      return "Esse WhatsApp tem números demais. Confira o número.";
    case "ddd":
      return "Confira o DDD — ele vai de 11 a 99, sem o zero na frente.";
    case "nono":
      return "Confira o número: celular brasileiro começa com 9 depois do DDD.";
  }
}
