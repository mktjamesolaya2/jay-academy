// Rastreamento das páginas públicas: GA4 do site, GTM (só onde vale), Meta
// Pixel + CAPI (só onde vale), e meta de verificação de domínio do Facebook
// Business. Cada função é idempotente por conteúdo — as páginas WP importadas
// (padrões "route handler via KV" e "route handler lendo HTML de disco") já
// trazem esses scripts embutidos manualmente do import do WordPress, então
// NUNCA duplicamos, senão infla volume/quebra dedup no Events Manager.
//
// POLÍTICA POR PÁGINA (29/07, decisão do James) — antes era tudo global:
//   - Pixel DSTV → SÓ nas LPs de curso online (PIXEL_SLUGS abaixo). Nas outras
//     páginas os inits são REMOVIDOS, inclusive os que vêm embutidos do
//     WordPress (Pixel Cat colava 935630436819595 e 872802227099574).
//   - GTM        → um container POR PÁGINA (GTM_BY_SLUG em lib/google-tag.ts):
//     GTM-TVLJSVJZ na /magicshadow, GTM-W394J499 na /basic-magic-shadow. Nas
//     demais páginas o container é removido, inclusive o antigo do WordPress.
//   - GA4        → em todas (fluxo "site" do jayacademy.com.br, coleta ativa).
// A limpeza é feita ao servir (lib/tracking-clean.ts), não no dado salvo: é
// reversível e já vale pra página que ainda vai ser importada.
//
// CAVEAT conhecido: para páginas que já trazem o Pixel embutido no próprio
// HTML (legado), não injetamos um novo fbq('init'+'track PageView') — logo
// o browser PageView dessas páginas específicas não usa o mesmo event_id do
// PageView disparado via CAPI aqui, e a deduplicação no Events Manager fica
// imperfeita até esses HTMLs serem editados manualmente pra remover o script
// antigo (fora de escopo desta migração).

import { withGoogleTag, gtmIdForSlug } from "@/lib/google-tag";
import { stripGoogleTagManager, stripPixelInits } from "@/lib/tracking-clean";

export const META_PIXEL_ID = "1841776429524244";
/** GA4 do site (fluxo "site" de jayacademy.com.br, código 4463452239). */
export const GA4_SITE_ID = "G-N93TQZV050";
export const FB_DOMAIN_VERIFICATION_CONTENT = "61zuhji4fdykwgd7q89ed8j9uxrfkt";

/** LPs de curso online — as únicas páginas que levam o Pixel DSTV. */
export const PIXEL_SLUGS = [
  "basic-magic-shadow",
  "basic-nanofios",
  "curso-online-profissao-remove",
  "fio-a-fio-realista-by-james-olaya",
  "metodo-shadow-pro-2",
  "pdv-lips-sense-technique",
  "pmuclass",
];

/** O Pixel DSTV vale nesta página? */
export function slugHasPixel(slug: string): boolean {
  return PIXEL_SLUGS.includes(slug);
}

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

/**
 * Injeta o gtag.js do GA4 do site (G-N93TQZV050) se ainda não presente. Vale em
 * TODAS as páginas — é o fluxo de dados "site" do jayacademy.com.br, com coleta
 * ativa. (Chamava-se withGa4Legacy: não é legado do WordPress, é a medição em uso.)
 */
export function withGa4Site(html: string): string {
  if (html.includes(GA4_SITE_ID)) return html;
  const tag =
    `<!-- GA4 -->` +
    `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_SITE_ID}"></script>` +
    `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
    `gtag('js',new Date());gtag('config','${GA4_SITE_ID}');</script>`;
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

function buildPixelInitScript(isProductPage: boolean): string {
  const viewContent = isProductPage
    ? `fbq('track','ViewContent',{},{eventID:window.__metaEventId+'-vc'});`
    : "";
  // eventId gerado NO BROWSER, por visita (crypto.randomUUID) — antes era fixado
  // no build, então em página force-static TODO visitante mandava o MESMO id e o
  // Meta deduplicava tudo num único PageView. Agora cada visita tem id único, e
  // o CAPI (servidor) é disparado pelo próprio cliente com o MESMO id → dedup
  // correta entre pixel do browser e CAPI, mantendo a página 100% cacheável.
  return `<!-- Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
window.__metaEventId = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now())+Math.random();
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView', {}, { eventID: window.__metaEventId });
${viewContent}
try {
  fetch(window.location.origin + '/api/meta-capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName: 'PageView', eventId: window.__metaEventId, eventSourceUrl: window.location.href }),
    keepalive: true
  }).catch(function(){});
} catch (e) {}
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
  let out = html;

  const hasPixel = out.includes(META_PIXEL_ID);
  if (!hasPixel) {
    // O bootstrap gera o eventId no browser e dispara o CAPI PageView pelo
    // próprio cliente (com o mesmo id) — ver buildPixelInitScript. Não há mais
    // CAPI no servidor aqui: em página force-static o eventId de build era
    // idêntico pra todos, colapsando a deduplicação.
    out = injectHead(out, buildPixelInitScript(opts.isProductPage));
  }

  if (!out.includes('data-portal-pixel-listeners="1"')) {
    out = injectBody(out, buildPixelClickListeners());
  }

  if (!out.includes('data-portal-lead-listener="1"')) {
    out = injectBody(out, buildLeadPixelListener());
  }

  return out;
}

/**
 * Beacon leve que registra a visita interna (1x por carregamento) no /api/track
 * — client-side, então funciona mesmo com a página cacheada estática na borda.
 * Mesmo script usado pelo /p/[slug]; aqui exportado pra que as LPs de lp-html/
 * (servidas por serveLp) também apareçam no analytics do painel (antes: 0
 * visitas). Usa origin absoluto pra furar qualquer <base href> remanescente.
 */
export function buildVisitBeacon(slug: string): string {
  return `<script data-portal-track="1">
(function(){
  try {
    var u = new URLSearchParams(window.location.search).get('utm_source') || '';
    fetch(window.location.origin + '/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: ${JSON.stringify(slug)}, referrer: document.referrer || '', utm: u }),
      keepalive: true
    }).catch(function(){});
  } catch (e) {}
})();
</script>`;
}

/**
 * Composição única, aplicando a política por página (ver o cabeçalho do
 * arquivo): GA4 sempre; GTM só nos slugs do GTM_BY_SLUG (com o container
 * daquele slug); Pixel só nos PIXEL_SLUGS.
 *
 * Limpa ANTES de injetar — se a página não tem direito à tag, o que já vinha
 * embutido no HTML (Pixel Cat do WP, container GTM antigo) também sai.
 */
export async function withTracking(
  html: string,
  opts: {
    slug: string;
    isProductPage: boolean;
    eventSourceUrl: string;
    req?: Request;
  }
): Promise<string> {
  // GTM — limpa sempre (tira container embutido/antigo) e injeta o desta
  // página, se ela tiver um. Nunca sobra mais de um container por página.
  const gtmId = gtmIdForSlug(opts.slug);
  let out = stripGoogleTagManager(html);
  if (gtmId) out = withGoogleTag(out, gtmId);

  // GA4 — em todas as páginas.
  out = withGa4Site(out);
  out = withFbDomainVerification(out);

  // Pixel
  if (slugHasPixel(opts.slug)) {
    out = stripPixelInits(out, [META_PIXEL_ID]);
    out = await withMetaPixelBootstrap(out, opts);
  } else {
    // Nada de Meta aqui: tira todo init (nosso e embutido) e não injeta
    // bootstrap, listeners de clique nem listener de Lead.
    out = stripPixelInits(out, []);
  }

  return out;
}
