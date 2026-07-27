import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeCopiedHtml } from "./sanitize-copied.ts";

test("remove <script> com conteúdo", () => {
  const out = sanitizeCopiedHtml(
    `<div>oi</div><script>fetch('/api/wp-localize?supaclean=1')</script><p>fim</p>`
  );
  assert.ok(!/<script/i.test(out));
  assert.ok(!out.includes("supaclean"));
  assert.ok(out.includes("<div>oi</div>"));
  assert.ok(out.includes("<p>fim</p>"));
});

test("remove script com atributos (module, src, ld+json)", () => {
  const out = sanitizeCopiedHtml(
    `<script type="module" src="https://evil.com/x.js"></script><script type="application/ld+json">{"a":1}</script>texto`
  );
  assert.ok(!/<script/i.test(out));
  assert.ok(out.includes("texto"));
});

test("remove handlers inline on*", () => {
  const out = sanitizeCopiedHtml(
    `<img src="x.jpg" onerror="fetch('/api/steal')"><button onclick='hack()'>ok</button><a onmouseover=go()>l</a>`
  );
  assert.ok(!/onerror|onclick|onmouseover/i.test(out));
  assert.ok(out.includes('src="x.jpg"'));
  assert.ok(out.includes("ok"));
});

test("neutraliza javascript: em href/src", () => {
  const out = sanitizeCopiedHtml(`<a href="javascript:alert(1)">clique</a>`);
  assert.ok(!/javascript:/i.test(out));
  assert.ok(out.includes("clique"));
});

test("não mexe em atributos normais nem em conteúdo legítimo", () => {
  const html = `<img src="/hero.jpg" alt="foto"><a href="/pagina" class="on-sale" data-online="1">x</a>`;
  const out = sanitizeCopiedHtml(html);
  assert.ok(out.includes('src="/hero.jpg"'));
  assert.ok(out.includes('href="/pagina"'));
  assert.ok(out.includes('class="on-sale"')); // "on-sale" NÃO é handler
  assert.ok(out.includes('data-online="1"')); // "data-online" NÃO é handler
});

test("neutraliza javascript: codificado por entidade (bypass)", () => {
  const out = sanitizeCopiedHtml(`<a href="&#106;avascript:fetch('/api/x')">x</a>`);
  assert.ok(!/javascript:/i.test(sanitizeCopiedHtml(out)));
  assert.ok(!out.includes("&#106;avascript"));
});
test("neutraliza javascript: com caractere de controle (tab)", () => {
  const out = sanitizeCopiedHtml(`<a href="jav\tascript:alert(1)">x</a>`);
  assert.ok(out.includes('href="#"'));
});
test("neutraliza javascript: em action/formaction", () => {
  const out = sanitizeCopiedHtml(`<form action="javascript:steal()"></form>`);
  assert.ok(out.includes('action="#"'));
});
test("NÃO mexe em href/src normais (http/relativo)", () => {
  const html = `<a href="https://x.com/p"><img src="/img/a.jpg"></a>`;
  const out = sanitizeCopiedHtml(html);
  assert.ok(out.includes('href="https://x.com/p"'));
  assert.ok(out.includes('src="/img/a.jpg"'));
});
