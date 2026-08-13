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
/**
 * O script de envio, escrito por nós.
 *
 * ⚠️ Manda pro NOSSO servidor (`/api/crm-envio`), que repassa pro CRM.
 * Mandar direto do navegador dispara a verificação prévia (preflight) do
 * POST com JSON — e se o CRM não liberar o domínio da página ali, o navegador
 * barra antes de sair e **o lead some sem erro na tela**. Foi o que aconteceu.
 * Pelo servidor não existe essa regra: sai sempre, e a resposta do CRM fica
 * registrada pra aparecer no painel.
 *
 * Outras decisões, todas pra não quebrar página que já funciona:
 *
 * - **Manda uma cópia, não sequestra o envio.** Se outro script da página já
 *   tratou o submit (Elementor faz isso), a gente só manda a cópia e deixa o
 *   fluxo original seguir.
 * - **Só segura o envio quando ele iria pro vazio.** Formulário sem `action`
 *   faz POST na própria URL — e as páginas daqui só respondem GET, o que dá o
 *   **HTTP 405**. Nesse caso, e só nesse, a gente segura.
 * - Nomes de campo do Elementor (`form_fields[nome]`) são normalizados, e o
 *   `_gotcha` (isca de robô) nunca viaja.
 */
/**
 * Ponte entre o formulário da página e o portal. Vai em TODA LP, com ou sem
 * webhook configurado.
 *
 * ⚠️ Por que precisa existir: nas 4 LPs de venda o jQuery e o Elementor **não
 * carregam** (confirmado no navegador: `window.jQuery` e
 * `window.elementorProFrontend` são `undefined`). Sem eles, ninguém intercepta
 * o envio, o formulário faz POST na própria URL e a página — que só responde
 * GET — devolve **HTTP 405**. Era o erro que o James via, e estava assim em
 * produção mesmo antes de qualquer webhook: **todo lead dessas páginas se
 * perdia**.
 *
 * A ponte manda pro `/api/elementor-form`, que já guarda o lead, dispara o
 * webhook da página e devolve a mensagem de sucesso.
 *
 * Nunca atropela quem já funciona: se outro script tratou o envio, ou se o
 * formulário tem destino próprio (action pra fora), a gente não encosta.
 */
export function montarGuardaDeFormularios(): string {
  return `<script>
(function () {
  function mesmaPagina(action) {
    if (!action) return true;
    try { return new URL(action, location.href).pathname === location.pathname; }
    catch (e) { return false; }
  }
  function avisar(form, texto, erro) {
    var aviso =
      form.querySelector("[data-jayo-aviso]") ||
      form.querySelector(".jayo-aviso");
    if (!aviso) {
      aviso = document.createElement("p");
      aviso.className = "jayo-aviso";
      aviso.style.cssText = "margin:12px 0 0;font-size:15px;line-height:1.5;font-weight:600";
      form.appendChild(aviso);
    }
    aviso.style.color = erro ? "#f87171" : "#22c55e";
    aviso.textContent = texto;
  }
  document.addEventListener("submit", function (evento) {
    var form = evento.target;
    if (!form || form.tagName !== "FORM") return;
    // Alguém já cuidou (Elementor funcionando, script próprio): não encosta.
    if (evento.defaultPrevented) return;
    // Formulário com destino de verdade (Hotmart, outro site): deixa seguir.
    if (!mesmaPagina(form.getAttribute("action"))) return;

    evento.preventDefault();
    var dados = new FormData(form);
    if (!dados.get("action")) dados.append("action", "elementor_pro_forms_send_form");
    if (!dados.get("form_slug")) dados.append("form_slug", location.pathname.replace(/^\\//, ""));
    avisar(form, "Enviando...", false);
    fetch("/api/elementor-form", { method: "POST", body: dados })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (res) {
        if (res && res.success) {
          var d = res.data || {};
          avisar(form, d.message || "Recebemos seu contato. Falamos com você em breve!", false);
          try { form.reset(); } catch (e) {}
          if (d.redirect_url) setTimeout(function () { location.href = d.redirect_url; }, 900);
        } else {
          avisar(form, "Não conseguimos enviar agora. Tente novamente em instantes.", true);
        }
      })
      .catch(function () {
        avisar(form, "Não conseguimos enviar agora. Tente novamente em instantes.", true);
      });
  }, false);
})();
</script>`;
}

export function montarScriptDeEnvio(chave: string): string {
  return `<script>
(function () {
  var CHAVE = ${JSON.stringify(chave)};
  // Sem regex de propósito: este script nasce dentro de um template, e escape
  // de barra invertida some no caminho — foi assim que o normalizador do
  // Elementor virou uma classe de caracteres e parou de funcionar.
  function limpaNome(n) {
    var s = String(n || "").trim();
    var a = s.indexOf("["), b = s.lastIndexOf("]");
    return a > -1 && b > a ? s.slice(a + 1, b).trim() : s;
  }
  function soDigitos(v) {
    var s = String(v || ""), r = "";
    for (var i = 0; i < s.length; i++) if (s[i] >= "0" && s[i] <= "9") r += s[i];
    return r;
  }
  function coleta(form) {
    var dados = {};
    new FormData(form).forEach(function (valor, chave) {
      var nome = limpaNome(chave);
      if (!nome || nome === "_gotcha") return;
      if (typeof valor === "string" && valor.trim()) dados[nome] = valor.trim();
    });
    dados.pagina = location.href;
    new URLSearchParams(location.search).forEach(function (v, k) {
      if (k.indexOf("utm_") === 0 || k === "fbclid" || k === "gclid") dados[k] = v;
    });
    return dados;
  }
  function temContato(d) {
    var tel = d.telefone || d.whatsapp || d.phone || d.celular || d.tel || d.fone || "";
    return soDigitos(tel).length >= 10;
  }
  function avisar(form, texto, erro) {
    var aviso =
      form.querySelector("[data-jayo-aviso]") ||
      form.querySelector("#form-jayo-aviso") ||
      form.querySelector(".jayo-aviso");
    if (!aviso) {
      aviso = document.createElement("p");
      aviso.className = "jayo-aviso";
      aviso.style.cssText = "margin:12px 0 0;font-size:15px;line-height:1.5;font-weight:600";
      form.appendChild(aviso);
    }
    aviso.style.color = erro ? "#f87171" : "#22c55e";
    aviso.textContent = texto;
  }
  function enviar(form) {
    var dados = coleta(form);
    if (!temContato(dados)) {
      avisar(form, "Confira o WhatsApp com DDD.", true);
      return;
    }
    avisar(form, "Enviando...", false);
    fetch("/api/crm-envio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chave: CHAVE, pagina: location.pathname, dados: dados }),
      keepalive: true,
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (res && res.ok) {
          avisar(form, "Recebemos seu contato. Falamos com você em breve!", false);
          try { form.reset(); } catch (e) {}
        } else {
          avisar(form, "Não conseguimos enviar agora. Tente novamente em instantes.", true);
        }
      })
      .catch(function () {
        avisar(form, "Não conseguimos enviar agora. Tente novamente em instantes.", true);
      });
  }
  document.addEventListener("submit", function (evento) {
    var form = evento.target;
    if (!form || form.tagName !== "FORM") return;
    enviar(form);
    var action = (form.getAttribute("action") || "").trim();
    if (!evento.defaultPrevented && !action) evento.preventDefault();
  }, false);
})();
</script>`;
}
