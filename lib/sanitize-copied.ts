// Limpeza de segurança do HTML copiado de sites externos.
//
// PROBLEMA: um site copiado é servido/publicado no MESMO domínio do painel admin
// (mesma origem que o cookie de sessão). Se os <script> do site copiado rodarem,
// eles podem chamar as APIs de admin (/api/*) autenticadas — inclusive burlando o
// header anti-CSRF `x-portal-op` (que só protege contra requisição de OUTRA origem;
// um script na MESMA origem seta qualquer header). Logo: neutralizar tudo que é
// executável antes de guardar/servir uma cópia web.
//
// Trade-off consciente: a cópia perde a interatividade em JS (carrosséis etc.).
// Como o fluxo é "copiar → adaptar → publicar", isso é aceitável e seguro; o James
// reconstrói a interação que quiser. O conteúdo (texto/imagens) permanece.

/**
 * Normaliza um valor de atributo pra detectar o ESQUEMA de verdade: decodifica
 * entidades numéricas (`&#106;` = "j", `&#x6a;` = "j") e remove chars de controle
 * e espaços (filtrando por código, sem classe de controle no fonte). Sem isso,
 * `href="&#106;avascript:…"` ou `href="jav<TAB>ascript:…"` burlavam o filtro.
 */
function schemeOf(val: string): string {
  const decoded = val
    .replace(/&#x([0-9a-f]+);?/gi, (_m, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/&#(\d+);?/g, (_m, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&colon;/gi, ":");
  let out = "";
  for (const ch of decoded) {
    const c = ch.charCodeAt(0);
    // tira espaço (32), chars de controle (0–31) e DEL (127)
    if (c > 32 && c !== 127) out += ch;
  }
  return out.toLowerCase();
}

export function sanitizeCopiedHtml(html: string): string {
  return (
    html
      // <script>…</script> (com ou sem atributos, inclusive type=module/ld+json)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      // <script …> solto/auto-fechado sem par de fechamento (defensivo)
      .replace(/<script\b[^>]*\/?>/gi, "")
      // handlers inline: onclick="…" / onload='…' / onerror=valor
      .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
      .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
      .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
      // href/src/action="javascript:…"/"vbscript:…"/"data:text/html…" → "#"
      // (resiste a entidade/controle via schemeOf)
      .replace(
        /(\b(?:href|src|xlink:href|action|formaction)\s*=\s*)("[^"]*"|'[^']*')/gi,
        (m, pre: string, quoted: string) => {
          const s = schemeOf(quoted.slice(1, -1));
          if (
            s.startsWith("javascript:") ||
            s.startsWith("vbscript:") ||
            s.startsWith("data:text/html")
          ) {
            return `${pre}${quoted[0]}#${quoted[0]}`;
          }
          return m;
        }
      )
  );
}
