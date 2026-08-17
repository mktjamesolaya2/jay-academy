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
 * Só os dígitos, do jeito que o WhatsApp espera (país + DDD + número).
 *
 * Aceita o número escrito como gente escreve — "+55 (11) 99999-8888" — porque é
 * assim que ele vai ser colado na variável de ambiente.
 */
export function numeroLimpo(bruto: string | undefined): string | null {
  const d = (bruto ?? "").replace(/\D/g, "");
  // Curto demais é engano (esqueceram o país, ou colaram meio número). Longo
  // demais também. O intervalo cobre Brasil e os países vizinhos.
  return d.length >= 10 && d.length <= 15 ? d : null;
}

/**
 * A mensagem que já vem escrita quando o WhatsApp abre.
 *
 * ⚠️ Carrega o código da conversa de propósito: é o que deixa quem atender
 * achar o que já foi conversado no portal, em vez de fazer a aluna contar tudo
 * de novo — que é exatamente a parte chata de ser encaminhado.
 */
export function mensagemInicial(nome: string | undefined, conversaId: string): string {
  const quem = nome && nome.trim() ? `Sou ${nome.trim()}. ` : "";
  // Só um pedaço do id: é curto de ler em voz alta e ainda acha a conversa.
  const codigo = conversaId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `Oi! ${quem}Vim do chat do site e queria continuar por aqui. (atendimento ${codigo})`;
}

/** O link que abre o WhatsApp com a conversa já começada. */
export function linkWhatsApp(
  numeroBruto: string | undefined,
  dados: { nome?: string; conversaId: string }
): string | null {
  const numero = numeroLimpo(numeroBruto);
  if (!numero) return null;
  const texto = encodeURIComponent(mensagemInicial(dados.nome, dados.conversaId));
  // `wa.me` é o endereço oficial e funciona no celular e no computador — abre o
  // aplicativo quando existe e o WhatsApp Web quando não.
  return `https://wa.me/${numero}?text=${texto}`;
}
