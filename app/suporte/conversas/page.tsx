import { redirect } from "next/navigation";

/**
 * A lista de conversas mudou pra `/suporte`.
 *
 * ⚠️ Este arquivo continua existindo por causa dos links já espalhados — o
 * sino do portal, o "voltar" da tela de uma conversa, e o que já estiver
 * salvo no navegador de alguém. Sem ele, todos dariam 404.
 */
export default function ConversasRedirect() {
  redirect("/suporte");
}
