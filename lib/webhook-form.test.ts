import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * O bug do "Tirar" que não tirava.
 *
 * O botão de remover tinha `name="codigo" value=""`, o mesmo nome da caixa de
 * texto. O FormData aceita nomes repetidos, e `.get()` devolve o PRIMEIRO — a
 * caixa. Então clicar em "Tirar" regravava o mesmo código, e o webhook nunca
 * saía. James: *"não está sendo possível remover ou trocar a webhook"*.
 *
 * O teste guarda a regra: quem remove manda `acao=remover`, num campo de nome
 * diferente.
 */

/** Mesma leitura que a action faz. */
function leituraDaAction(fd: FormData): string {
  const remover = fd.get("acao")?.toString() === "remover";
  return remover ? "" : fd.get("codigo")?.toString() ?? "";
}

test("o jeito antigo NÃO removia — dois campos com o mesmo nome", () => {
  const fd = new FormData();
  fd.append("codigo", "pk_umachavequalquer123"); // a caixa de texto
  fd.append("codigo", ""); // o botão antigo
  assert.equal(
    fd.get("codigo"),
    "pk_umachavequalquer123",
    "o .get() pega o primeiro — era por isso que o Tirar não tirava"
  );
});

test("com acao=remover, a action grava vazio", () => {
  const fd = new FormData();
  fd.append("codigo", "pk_umachavequalquer123");
  fd.append("acao", "remover");
  assert.equal(leituraDaAction(fd), "");
});

test("salvar normal continua gravando o que está na caixa", () => {
  const fd = new FormData();
  fd.append("codigo", "pk_umachavequalquer123");
  assert.equal(leituraDaAction(fd), "pk_umachavequalquer123");
});

test("trocar por outra chave grava a nova", () => {
  const fd = new FormData();
  fd.append("codigo", "pk_outrachave98765");
  assert.equal(leituraDaAction(fd), "pk_outrachave98765");
});
