// Rastreamento unificado das LPs públicas: GTM do portal (já existia, ver
// withGoogleTag), GA4 legado do WP, Meta Pixel + CAPI, e meta de verificação
// de domínio do Facebook Business. Cada função é idempotente por conteúdo —
// as páginas WP importadas (padrões "route handler via KV" e "route handler
// lendo HTML de disco") já trazem esses scripts embutidos manualmente do
// import do WordPress, então NUNCA duplicamos, senão infla volume/quebra
// dedup no Events Manager.
//
// CAVEAT conhecido: para páginas que já trazem o Pixel embutido no próprio
// HTML (legado), não injetamos um novo fbq('init'+'track PageView') — logo
// o browser PageView dessas páginas específicas não usa o mesmo event_id do
// PageView disparado via CAPI aqui, e a deduplicação no Events Manager fica
// imperfeita até esses HTMLs serem editados manualmente pra remover o script
// antigo (fora de escopo desta migração).

import { withGoogleTag } from "@/lib/google-tag";
import { sendMetaCapiEvent } from "@/lib/meta-capi";

export const META_PIXEL_ID = "1841776429524244";
export const GA4_LEGACY_ID = "G-N93TQZV050";
export const FB_DOMAIN_VERIFICATION_CONTENT = "61zuhji4fdykwgd7q89ed8j9uxrfkt";

function injectHead(html: string, tag: string): string {
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head([^>]*)>/i, `<head$1>${tag}`)
    : tag + html;
}

function injectBody(html: string, tag: string): string {
  return /<\/body>/i.test(html)
    ? html.replace(/<\/body>/i, `${tag}\n</body>`)
    : html + tag;
}

function uuid(): string {
  return crypto.randomUUID();
}

/** Injeta o gtag.js do GA4 legado (G-N93TQZV050) se ainda não presente. */
export function withGa4Legacy(html: string): string {
  if (html.includes(GA4_LEGACY_ID)) return html;
  const tag =
    `<!-- GA4 (legado) -->` +
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_LEGACY_ID}"></script>` +
    `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
    `gtag('js',new Date());gtag('config','${GA4_LEGACY_ID}');</script>`;
  return injectHead(html, tag);
}

/** Injeta a meta tag de verificação de domínio do Facebook Business, se ainda não presente. */
export function withFbDomainVerification(html: string): string {
  if (html.includes(FB_DOMAIN_VERIFICATION_CONTENT)) return html;
  return injectHead(
    html,
    `<meta name="facebook-domain-verification" content="${FB_DOMAIN_VERIFICATION_CONTENT}" />`
  );
}

function buildPixelInitScript(eventId: string, isProductPage: boolean): string {
  const viewContent = isProductPage
    ? `fbq('track','ViewContent',{},{eventID:window.__metaEventId+'-vc'});`
    : "";
  return `<!-- Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
window.__metaEventId = ${JSON.stringify(eventId)};
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView', {}, { eventID: window.__metaEventId });
${viewContent}
</script>
<noscript><img height="1" width="1" style="display:none" alt=""
  src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" /></noscript>
<!-- End Meta Pixel -->`;
}

/** Listener global de clique: dispara WhatsApp (custom) e InitiateCheckout
 * (standard) sem tocar no href. Delegado no document pra cobrir links
 * inseridos dinamicamente depois (ex.: pmuclass, hidratado via fetch). */
function buildPixelClickListeners(): string {
  return `<script data-portal-pixel-listeners="1">
(function(){
  function uid(){ return (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now())+Math.random(); }
  document.addEventListener('click', function(e){
    if (typeof fbq === 'undefined') return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/api\\.whatsapp\\.com|wa\\.me/i.test(href)) {
      fbq('trackCustom', 'WhatsApp', {}, { eventID: uid() });
    } else if (/pay\\.hotmart\\.com/i.test(href)) {
      fbq('track', 'InitiateCheckout', {}, { eventID: uid() });
    }
  }, true);
})();
</script>`;
}

/** Listener genérico de Lead: dispara em qualquer submit de form que NÃO já
 * seja tratado pelo form-interceptor do portal (data-portal-bound="1" —
 * ver app/p/[slug]/route.ts), evitando disparo duplicado nas páginas com
 * webhook configurado (essas disparam Lead no callback de sucesso). */
export function buildLeadPixelListener(): string {
  return `<script data-portal-lead-listener="1">
(function(){
  function uid(){ return (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now())+Math.random(); }
  function bind(){
    if (typeof fbq === 'undefined') return;
    var forms = document.querySelectorAll('form');
    for (var i=0;i<forms.length;i++){
      var f = forms[i];
      if (f.getAttribute('data-portal-bound') === '1') continue;
      if (f.getAttribute('data-portal-lead-bound') === '1') continue;
      f.setAttribute('data-portal-lead-bound','1');
      f.addEventListener('submit', function(){
        fbq('track','Lead',{},{eventID: uid()});
      }, true);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
  var mo = new MutationObserver(bind);
  mo.observe(document.body, { childList: true, subtree: true });
})();
</script>`;
}

/**
 * Injeta o bootstrap do Meta Pixel (se ainda não presente no HTML) + os
 * listeners de clique (sempre, com guarda) + dispara PageView via CAPI no
 * mesmo momento da renderização, usando o mesmo event_id do pixel de
 * navegador pra deduplicação (quando o bootstrap foi injetado por nós).
 *
 * eventSourceUrl/req são usados só pra montar o payload do CAPI (URL da
 * página, IP, user-agent) — nunca vazam pro HTML.
 */
export async function withMetaPixelBootstrap(
  html: string,
  opts: { isProductPage: boolean; eventSourceUrl: string; req?: Request }
): Promise<string> {
  const eventId = uuid();
  let out = html;

  const hasPixel = out.includes(META_PIXEL_ID);
  if (!hasPixel) {
    out = injectHead(out, buildPixelInitScript(eventId, opts.isProductPage));
  }

  if (!out.includes('data-portal-pixel-listeners="1"')) {
    out = injectBody(out, buildPixelClickListeners());
  }

  if (!out.includes('data-portal-lead-listener="1"')) {
    out = injectBody(out, buildLeadPixelListener());
  }

  await sendMetaCapiEvent({
    eventName: "PageView",
    eventId,
    eventSourceUrl: opts.eventSourceUrl,
    req: opts.req,
  });

  return out;
}

/** Composição única: GTM do portal + GA4 legado + verificação de domínio + Pixel/CAPI. */
export async function withTracking(
  html: string,
  opts: { isProductPage: boolean; eventSourceUrl: string; req?: Request }
): Promise<string> {
  let out = withGoogleTag(html);
  out = withGa4Legacy(out);
  out = withFbDomainVerification(out);
  out = await withMetaPixelBootstrap(out, opts);
  return out;
}
