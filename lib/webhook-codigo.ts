/**
 * Do código que o CRM entrega, o portal injeta SÓ O SCRIPT.
 *
 * ⚠️ Por que descartar o formulário: o CRM oferece uma variante "formulário
 * pronto" (form + script). Injetada numa página nossa, ela aparece **solta no
 * fim da página, sem estilo, embaixo do rodapé** — foi exatamente o que o James
 * viu e reagiu: *"NÃO QUERO ISSO APARECENDO"*. E ele está certo: as páginas
 * daqui já têm o formulário delas, desenhado. O que falta é o envio.
 *
 * Então não adianta avisar e torcer: se vier formulário junto, ele sai. Assim
 * é impossível colar algo que suje a página, mesmo colando a variante errada.
 */

/** Extrai só os blocos `<script>` do código colado. */
export function somenteScript(codigo: string): string {
  const blocos = codigo.match(/<script\b[\s\S]*?<\/script>/gi);
  if (!blocos?.length) return "";
  return blocos.join("\n");
}

/** O código colado traz marcação visível junto (formulário, texto, imagem)? */
export function temMarcacaoVisivel(codigo: string): boolean {
  const semScript = codigo.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  return /<(form|div|input|button|section|p|img|h[1-6])\b/i.test(semScript);
}
