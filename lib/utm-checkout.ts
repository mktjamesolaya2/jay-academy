// Propagação dos UTMs da LP para o checkout da Hotmart.
//
// O tráfego pago chega na LP com utm_source/medium/campaign/content/term, mas o
// checkout é da Hotmart, em outro domínio: sem isto, a origem morre no clique e o
// relatório de vendas não sabe qual campanha gerou a compra.
//
// A Hotmart lê utm_*, `src` e `sck` na querystring do checkout e organiza os três na
// aba Conversões do Hotmart Analytics (o `sck` também aparece na origem do relatório
// de vendas). Então basta anexar esses parâmetros ao link antes do clique.
//
// Tem que ser client-side: as rotas das LPs são force-static, o servidor nunca vê a
// querystring do visitante.

// Fonte JS da função pura que monta a URL final do checkout. Fica como STRING (e não
// como função TS) de propósito: é o mesmo texto que roda no browser e o que o teste
// exercita via `new Function`, então não existe cópia pra sair de sincronia — ao
// contrário do que acontece hoje entre lib/telefone.ts e o JS de lp-html/transforma.html.
//
// Precisa ser autocontida: nada de closure sobre o escopo do módulo.
export const MONTAR_URL_JS = `function montarUrlCheckout(href, origem) {
  try {
    var u = new URL(String(href), 'https://x.invalid');
    if (!/(^|\\.)hotmart\\.com$/i.test(u.hostname)) return href;

    var chaves = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
    var o = origem || {};

    function sanitizar(v) {
      return String(v)
        .replace(/[^A-Za-z0-9_.-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 100);
    }

    for (var i = 0; i < chaves.length; i++) {
      var k = chaves[i];
      var v = o[k];
      // Nunca sobrescreve o que já veio escrito no link.
      if (v && !u.searchParams.has(k)) u.searchParams.set(k, String(v));
    }

    if (!u.searchParams.has('src') && o.utm_source) {
      var src = sanitizar(o.utm_source);
      if (src) u.searchParams.set('src', src);
    }

    if (!u.searchParams.has('sck')) {
      var partes = [o.utm_source, o.utm_campaign, o.utm_content];
      var limpas = [];
      for (var j = 0; j < partes.length; j++) {
        if (!partes[j]) continue;
        var p = sanitizar(partes[j]);
        if (p) limpas.push(p);
      }
      if (limpas.length) u.searchParams.set('sck', limpas.join('-').slice(0, 100));
    }

    return u.toString();
  } catch (e) {
    return href;
  }
}`;

/**
 * Script que leva os utm_* da URL da página para todo link de checkout da Hotmart.
 *
 * Reescreve o href no DOM em vez de interceptar o clique — assim clique do meio,
 * "abrir em nova aba" e copiar link também levam a origem. Não chama preventDefault,
 * então não briga com o listener de InitiateCheckout (buildPixelClickListeners), que
 * só testa `pay.hotmart.com` no href e continua casando.
 */
export function buildUtmHotmartForwarder(): string {
  return `<script data-portal-utm-hotmart="1">
(function(){
  try {
    var CHAVE = 'jay:utm';
    var CHAVES = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];

    ${MONTAR_URL_JS}

    // UTM da URL atual sempre ganha do guardado. Se a URL não trouxer nenhum (refresh,
    // navegação interna que limpou a querystring), recupera o da entrada — só pela
    // sessão da aba, sem cookie nem rastreio persistente.
    function origem(){
      var q = new URLSearchParams(window.location.search);
      var atual = {}, achou = false;
      for (var i=0;i<CHAVES.length;i++){
        var v = q.get(CHAVES[i]);
        if (v) { atual[CHAVES[i]] = v; achou = true; }
      }
      try {
        if (achou) sessionStorage.setItem(CHAVE, JSON.stringify(atual));
        else {
          var salvo = sessionStorage.getItem(CHAVE);
          if (salvo) atual = JSON.parse(salvo) || {};
        }
      } catch (e) {}
      return atual;
    }

    var o = origem();
    var temOrigem = false;
    for (var k in o) { if (o[k]) { temOrigem = true; break; } }
    if (!temOrigem) return;

    // Idempotente de propósito: sem flag de "já processado", reprocessar é inofensivo
    // (nunca sobrescreve parâmetro existente) e conserta link cujo href tenha sido
    // trocado depois por outro script — as LPs de export Elementor mexem muito no DOM.
    function aplicar(){
      var links = document.querySelectorAll('a[href*="hotmart.com"]');
      for (var i=0;i<links.length;i++){
        var a = links[i];
        var href = a.getAttribute('href') || '';
        if (!href) continue;
        var novo = montarUrlCheckout(href, o);
        if (novo !== href) a.setAttribute('href', novo);
      }
    }

    function ligar(){
      aplicar();
      // Links inseridos depois (sticky-cta, conteúdo hidratado via fetch). Debounce
      // pra não varrer o DOM a cada mutação nas páginas com 60-80 scripts.
      try {
        var pendente = null;
        var mo = new MutationObserver(function(){
          if (pendente) return;
          pendente = setTimeout(function(){ pendente = null; aplicar(); }, 80);
        });
        mo.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligar);
    else ligar();

    // Rede de segurança: reescreve na hora do clique, caso o href tenha sido trocado
    // entre a última varredura e a navegação.
    document.addEventListener('click', function(e){
      try {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (href.indexOf('hotmart.com') === -1) return;
        var novo = montarUrlCheckout(href, o);
        if (novo !== href) a.setAttribute('href', novo);
      } catch (err) {}
    }, true);
  } catch (e) {}
})();
</script>`;
}
