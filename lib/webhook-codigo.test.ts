import { test } from "node:test";
import assert from "node:assert/strict";
import { somenteScript, temMarcacaoVisivel } from "./webhook-codigo.ts";

const variantePronta = `<form id="form-jayo">
  <input name="nome" placeholder="Seu nome" required />
  <button type="submit">Quero saber mais</button>
</form>
<script>
  document.getElementById("form-jayo").addEventListener("submit", function (e) { e.preventDefault(); });
</script>`;

test("a variante com formulário perde o formulário e mantém o script", () => {
  const r = somenteScript(variantePronta);
  assert.ok(!r.includes("<form"), "o formulário não pode sobrar — era ele que aparecia solto na página");
  assert.ok(!r.includes("Quero saber mais"));
  assert.ok(r.includes("addEventListener"));
});

test("a variante só-o-envio passa inteira", () => {
  const so = `<script>console.log("envio")</script>`;
  assert.equal(somenteScript(so), so);
});

test("mais de um script: todos passam", () => {
  const dois = `<script>a()</script>\n<p>lixo</p>\n<script>b()</script>`;
  const r = somenteScript(dois);
  assert.ok(r.includes("a()") && r.includes("b()"));
  assert.ok(!r.includes("lixo"));
});

test("código sem script nenhum vira vazio — não injeta sujeira", () => {
  assert.equal(somenteScript("<form><input /></form>"), "");
  assert.equal(somenteScript(""), "");
});

test("detecta que veio marcação visível junto, pra avisar na tela", () => {
  assert.equal(temMarcacaoVisivel(variantePronta), true);
  assert.equal(temMarcacaoVisivel(`<script>a()</script>`), false);
  assert.equal(
    temMarcacaoVisivel(`<!-- comentário -->\n<script>a()</script>`),
    false,
    "comentário não é marcação visível"
  );
});

test("script que contém a palavra form no meio não confunde", () => {
  const s = `<script>document.querySelector("form").addEventListener("submit", f)</script>`;
  assert.equal(temMarcacaoVisivel(s), false);
  assert.equal(somenteScript(s), s);
});
