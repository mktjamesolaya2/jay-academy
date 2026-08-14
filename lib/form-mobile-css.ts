/**
 * Conserto de layout dos formulários no celular.
 *
 * ⚠️ Medido numa tela de 390px (iPhone), igual em todas as páginas testadas
 * (`/acao-mshadow`, `/contato-instagram`, `/stbrows`): **os campos ficam a 10px
 * da borda**, praticamente colados, enquanto o texto em volta respira. Dá a
 * impressão de que o formulário vazou pra fora da página — foi o que o James
 * viu: *"todos os formulários no mobile estão com um bug de layout"*.
 *
 * A calha negativa do Elementor (wrapper `-5px` + grupo `padding: 5px`) está
 * **correta** e não é o problema: ela se anula. O que falta é respiro. Com
 * `12px` no wrapper, o campo sai de 10px pra 22px e passa a alinhar com o
 * bloco de texto.
 *
 * Vai no `<head>` de toda página servida, e só abaixo de 768px. Não mexe em
 * desktop.
 */

// ⚠️ `!important` aqui é proposital, e não é preguiça: o CSS do Elementor vem
// depois no `<head>` e com especificidade alta. Sem isso a regra é ignorada —
// medido no navegador: o campo continuava em 10px.
const CSS = `
@media (max-width: 767px) {
  form.elementor-form .elementor-form-fields-wrapper {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}`.trim();

/** Injeta o conserto antes de `</head>` (ou no começo do body, se não houver). */
export function comFormMobileCss(html: string): string {
  if (html.includes("data-jayo-form-mobile")) return html;
  const tag = `<style data-jayo-form-mobile="1">${CSS}</style>`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${tag}\n</head>`);
  if (/<body[^>]*>/i.test(html))
    return html.replace(/<body([^>]*)>/i, `<body$1>\n${tag}`);
  return tag + html;
}
