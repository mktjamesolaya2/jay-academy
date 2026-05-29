import { NextResponse } from "next/server";
import { getPublishedBySlug, loadContent } from "@/lib/wp-content-storage";

type Params = Promise<{ slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  const index = await getPublishedBySlug(decoded);
  if (!index) {
    return new NextResponse("Página não encontrada", { status: 404 });
  }

  const content = await loadContent(index.domain, index.slug);
  if (!content || !content.published) {
    return new NextResponse("Página não publicada", { status: 404 });
  }

  // Limpa qualquer artefato do editor antes de servir publicamente
  const cleaned = (content.fullHtml || content.content || "")
    .replace(/<script\s+data-editor-script="1">[\s\S]*?<\/script>/g, "")
    .replace(/<div\s+id="__editor_overlay__"[^>]*>[\s\S]*?<\/div>/g, "")
    .replace(/\sdata-editor-id="[^"]*"/g, "")
    .replace(/\scontenteditable="(?:true|false)"/g, "");

  const safeTitle = (content.title || "Página").replace(/<[^>]*>/g, "");

  let html: string;
  if (content.fullHtml) {
    html = /<base\s/i.test(cleaned)
      ? cleaned
      : cleaned.replace(
          /<head([^>]*)>/i,
          `<head$1>\n  <base href="${content.link}" />`
        );
  } else {
    html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <base href="${content.link}" />
</head>
<body>
${cleaned}
</body>
</html>`;
  }

  // Injeta o interceptador de forms antes de </body> sempre que a página
  // tem webhook ou redirect configurado. O script captura submits e os
  // redireciona pro /api/wp-form-submit do portal.
  if (content.formWebhookUrl || content.formRedirectUrl) {
    const slug = content.publicSlug || content.slug;
    const interceptor = buildFormInterceptor(slug);
    html = html.replace(/<\/body>/i, `${interceptor}\n</body>`);
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}

/**
 * Script que intercepta TODOS os submits de form na página. Lê os campos,
 * manda pro endpoint do portal (que dispara o webhook + salva submissão),
 * e redireciona se a página tiver redirectUrl configurado.
 *
 * Não toca em forms que tenham data-portal-skip="1" — escape hatch caso
 * algum form precise do comportamento original.
 */
function buildFormInterceptor(publicSlug: string): string {
  const endpoint = "/api/wp-form-submit";
  return `<script data-portal-script="1">
(function () {
  var SLUG = ${JSON.stringify(publicSlug)};
  var ENDPOINT = ${JSON.stringify(endpoint)};

  function collectFields(form) {
    var data = {};
    var els = form.querySelectorAll("input, textarea, select");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var name = el.name || el.id || el.getAttribute("data-field");
      if (!name) continue;
      if (el.type === "submit" || el.type === "button") continue;
      if (el.type === "hidden" && /token|nonce|wpcf7|recaptcha/i.test(name)) continue;
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) continue;
      var val = el.value;
      if (val === undefined || val === null) continue;
      data[name] = String(val);
    }
    return data;
  }

  function submitToPortal(form, event) {
    event.preventDefault();
    event.stopPropagation();

    var btn = form.querySelector("button[type=submit], input[type=submit]");
    var originalLabel = btn ? (btn.innerText || btn.value) : null;
    if (btn) {
      btn.disabled = true;
      if (btn.tagName === "BUTTON") btn.innerText = "Enviando...";
      else btn.value = "Enviando...";
    }

    var fields = collectFields(form);

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicSlug: SLUG, fields: fields })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (res) {
        if (res && res.error) {
          alert(res.error);
          if (btn) {
            btn.disabled = false;
            if (btn.tagName === "BUTTON") btn.innerText = originalLabel || "Enviar";
            else btn.value = originalLabel || "Enviar";
          }
          return;
        }
        if (res && res.redirectUrl) {
          window.location.href = res.redirectUrl;
        } else {
          // Mensagem de sucesso simples — substitui o form
          var msg = document.createElement("div");
          msg.style.cssText = "padding:24px;text-align:center;background:#0f0f0f;color:#fff;border:1px solid #1f1f1f;border-radius:12px;font-family:system-ui,sans-serif;";
          msg.innerHTML = "<p style='font-size:18px;font-weight:600;margin:0 0 8px;'>Recebido!</p><p style='font-size:14px;opacity:0.7;margin:0;'>Seus dados foram enviados. Em breve entramos em contato.</p>";
          form.parentNode.replaceChild(msg, form);
        }
      })
      .catch(function (err) {
        alert("Erro ao enviar: " + (err && err.message ? err.message : "tente novamente"));
        if (btn) {
          btn.disabled = false;
          if (btn.tagName === "BUTTON") btn.innerText = originalLabel || "Enviar";
          else btn.value = originalLabel || "Enviar";
        }
      });
  }

  function bind() {
    var forms = document.querySelectorAll("form");
    for (var i = 0; i < forms.length; i++) {
      var f = forms[i];
      if (f.getAttribute("data-portal-bound") === "1") continue;
      if (f.getAttribute("data-portal-skip") === "1") continue;
      f.setAttribute("data-portal-bound", "1");
      (function (form) {
        form.addEventListener("submit", function (e) { submitToPortal(form, e); }, true);
      })(f);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
  // Re-bind se algum script da página adicionar forms dinamicamente
  var mo = new MutationObserver(bind);
  mo.observe(document.body, { childList: true, subtree: true });
})();
</script>`;
}
