import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extrairChave,
  somenteScript,
  temMarcacaoVisivel,
  montarScriptDeEnvio,
} from "./webhook-codigo.ts";

const varianteCompleta = `<form id="form-jayo">
  <input name="nome" required />
  <button type="submit">Quero saber mais</button>
</form>
<script>
  fetch("https://www.sistemajayo.com/api/integrations/site/lead/pk_GFNMm_kOuM_H0kto", { method: "POST" });
</script>`;

/* ── a chave é tudo que a gente precisa ─────────────────────────────────── */

test("acha a chave dentro do código que o CRM gera", () => {
  assert.equal(extrairChave(varianteCompleta), "pk_GFNMm_kOuM_H0kto");
});

test("acha a chave também colada sozinha ou como URL", () => {
  assert.equal(extrairChave("pk_GFNMm_kOuM_H0kto"), "pk_GFNMm_kOuM_H0kto");
  assert.equal(
    extrairChave("https://www.sistemajayo.com/api/integrations/site/lead/pk_abc12345"),
    "pk_abc12345"
  );
});

test("sem chave, devolve null — não inventa", () => {
  assert.equal(extrairChave("<form><input /></form>"), null);
  assert.equal(extrairChave(""), null);
});

/* ── o script que a gente monta ─────────────────────────────────────────── */

const script = montarScriptDeEnvio("pk_GFNMm_kOuM_H0kto");

test("o script leva a chave e nada visível", () => {
  assert.ok(script.includes("pk_GFNMm_kOuM_H0kto"));
  assert.equal(temMarcacaoVisivel(script), false, "não pode desenhar nada na página");
  assert.ok(!/<form|<input|<button/i.test(script.replace(/<script[\s\S]*<\/script>/i, "")));
});

test("só segura o envio quando o formulário não tem action", () => {
  // é o que evita o HTTP 405 sem sequestrar formulário que já funciona
  assert.ok(script.includes("!evento.defaultPrevented && !action"));
});

test("não atropela quem já tratou o submit", () => {
  assert.ok(script.includes("defaultPrevented"));
});

test("a isca de robô nunca viaja", () => {
  assert.ok(script.includes('"_gotcha"'));
});

test("normaliza o nome de campo do Elementor", () => {
  assert.ok(script.includes("\\[(.+)\\]"));
});

test("exige telefone com DDD antes de gastar a requisição", () => {
  assert.ok(script.includes("length >= 10"));
});

test("keepalive: o envio sobrevive à navegação da página", () => {
  assert.ok(script.includes("keepalive"));
});

/* ── utilitários que continuam valendo ──────────────────────────────────── */

test("temMarcacaoVisivel enxerga o formulário da variante completa", () => {
  assert.equal(temMarcacaoVisivel(varianteCompleta), true);
  assert.equal(temMarcacaoVisivel(`<script>a()</script>`), false);
});

test("somenteScript descarta o que é visível", () => {
  const r = somenteScript(varianteCompleta);
  assert.ok(!r.includes("<form"));
  assert.ok(r.includes("fetch("));
});
