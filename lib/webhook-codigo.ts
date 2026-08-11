/**
 * O portal monta o envio pro CRM a partir da chave — não precisa de outra
 * variante de código.
 *
 * ⚠️ O CRM entrega uma variante "formulário pronto" (form + script). Colada
 * numa página nossa, o formulário aparecia **solto no rodapé, sem estilo**, e
 * o script dela só funciona com o formulário dela. James: *"NÃO QUERO ISSO
 * APARECENDO"* — e depois, com razão: *"pra que eu preciso pedir algo pro
 * Lucas? Eu pedi pra você ajustar"*.
 *
 * A chave `pk_…` já vem dentro do código colado. Com ela, a gente escreve o
 * envio do nosso jeito: nada aparece na tela, e ele se liga no formulário que a
 * página já tem.
 */

/** Acha a chave `pk_…` em qualquer coisa que o CRM gere (código, URL ou só a chave). */
export function extrairChave(codigo: string): string | null {
  return codigo.match(/pk_[A-Za-z0-9_-]{8,}/)?.[0] ?? null;
}

/** Extrai só os blocos `<script>` do código colado. */
export function somenteScript(codigo: string): string {
  return (codigo.match(/<script\b[\s\S]*?<\/script>/gi) ?? []).join("\n");
}

/** O código colado traz marcação visível junto (formulário, texto, imagem)? */
export function temMarcacaoVisivel(codigo: string): boolean {
  const semScript = codigo.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  return /<(form|div|input|button|section|p|img|h[1-6])\b/i.test(semScript);
}

/**
 * O script de envio, escrito por nós.
 *
 * Decisões que evitam quebrar página que já funciona:
 *
 * - **Manda uma cópia, não sequestra o envio.** Se outro script da página já
 *   tratou o submit (Elementor faz isso), a gente só manda a cópia pro CRM e
 *   deixa o fluxo original seguir. Nada de formulário parar de funcionar.
 * - **Só segura o envio quando ele iria pro vazio.** Formulário sem `action`
 *   faz POST na própria URL — e as páginas daqui só respondem GET, o que dá o
 *   **HTTP 405** que o James viu. Nesse caso, e só nesse, a gente segura.
 * - **`keepalive`** pra requisição sobreviver à navegação da página.
 * - Nomes de campo do Elementor (`form_fields[nome]`) são normalizados, e o
 *   `_gotcha` (isca de robô) nunca viaja.
 */
export function montarScriptDeEnvio(chave: string): string {
  const url = `https://www.sistemajayo.com/api/integrations/site/lead/${chave}`;
  return `<script>
(function () {
  var URL_CRM = ${JSON.stringify(url)};
  function limpaNome(n) {
    return String(n || "").replace(/^.*\\[(.+)\\]$/, "$1").trim();
  }
  function coleta(form) {
    var dados = {};
    var campos = new FormData(form);
    campos.forEach(function (valor, chave) {
      var nome = limpaNome(chave);
      if (!nome || nome === "_gotcha") return;
      if (typeof valor === "string" && valor.trim()) dados[nome] = valor.trim();
    });
    dados.pagina = location.href;
    var q = new URLSearchParams(location.search);
    q.forEach(function (v, k) { if (k.indexOf("utm_") === 0 || k === "fbclid" || k === "gclid") dados[k] = v; });
    return dados;
  }
  function temContato(d) {
    var tel = d.telefone || d.whatsapp || d.phone || d.celular || d.tel || d.fone || "";
    return String(tel).replace(/\\D/g, "").length >= 10;
  }
  function enviar(form) {
    var dados = coleta(form);
    if (!temContato(dados)) return;
    try {
      fetch(URL_CRM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }
  document.addEventListener("submit", function (evento) {
    var form = evento.target;
    if (!form || form.tagName !== "FORM") return;
    enviar(form);
    // Só segura o envio se ele fosse pro vazio: sem action, o POST cai na
    // propria URL e a pagina responde 405.
    var action = (form.getAttribute("action") || "").trim();
    if (!evento.defaultPrevented && !action) {
      evento.preventDefault();
      try { form.reset(); } catch (e) {}
      var aviso = form.querySelector("[data-jayo-aviso]");
      if (aviso) aviso.textContent = "Recebemos seu contato. Falamos com você em breve!";
    }
  }, false);
})();
</script>`;
}
