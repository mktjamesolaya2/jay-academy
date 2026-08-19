import { test } from "node:test";
import assert from "node:assert/strict";
import { resumirConversa, assuntoResumido } from "./resumo-conversa.ts";

const msg = (de: string, texto: string) => ({ de, texto });

test("o resumo diz O QUE FAZER, não o nome da situação", () => {
  // ⚠️ "Acesso ativo até 15/08/2027 — falta reenviar" resolve o atendimento.
  // "no-prazo" faz quem lê ter que traduzir antes de agir.
  const r = resumirConversa({
    situacaoAcesso: "no-prazo",
    // ⚠️ Meio-dia, não meia-noite. Meia-noite em UTC É o dia anterior em São
    // Paulo — o formatador está certo, e a importação grava ao meio-dia
    // justamente pra data nunca escorregar um dia na tela.
    acessoEm: "2027-08-15T12:00:00Z",
    mensagens: [msg("aluno", "não consigo acessar")],
  });
  assert.match(r.titulo, /Acesso ativo até 15\/08\/2027/);
  assert.match(r.titulo, /falta reenviar/);
});

test("vencido mostra a data que a aluna vai perguntar", () => {
  const r = resumirConversa({
    situacaoAcesso: "vencido",
    acessoEm: "2026-01-06T12:00:00Z",
    mensagens: [],
  });
  assert.match(r.titulo, /venceu em 06\/01\/2026/);
});

test('"não achamos" e "não deu pra conferir" NUNCA se confundem', () => {
  // ⚠️ É a distinção mais importante do sistema inteiro. Quem lê "não achamos"
  // pode dizer pra aluna que ela não comprou — e ela comprou.
  const naoAchou = resumirConversa({ situacaoAcesso: "nao-encontrado", mensagens: [] });
  const naoConferiu = resumirConversa({ situacaoAcesso: "nao-consegui-conferir", mensagens: [] });
  assert.match(naoAchou.titulo, /Não achamos compra/);
  assert.match(naoConferiu.titulo, /Não deu pra conferir/);
  assert.notEqual(naoAchou.titulo, naoConferiu.titulo);
});

test("marca o print e o áudio — é o que ela mandou de prova", () => {
  const r = resumirConversa({
    situacaoAcesso: "nao-encontrado",
    mensagens: [msg("aluno", "(imagem)"), msg("ia", "recebi"), msg("aluno", "(áudio)")],
  });
  assert.deepEqual(r.marcas, ["mandou print", "mandou áudio"]);
});

test("anexo do ATENDENTE não vira marca da aluna", () => {
  const r = resumirConversa({ mensagens: [msg("pessoa", "(imagem)")] });
  assert.deepEqual(r.marcas, []);
});

test("conversa que não é sobre acesso não inventa título", () => {
  // ⚠️ Melhor vazio do que um resumo chutado: quem abre o protocolo age em
  // cima do que está escrito ali.
  const r = resumirConversa({ mensagens: [msg("aluno", "onde fica a apostila?")] });
  assert.equal(r.titulo, "");
});

test("o assunto vem da primeira fala dela, ignorando anexo sem texto", () => {
  assert.equal(
    assuntoResumido([msg("aluno", "(imagem)"), msg("aluno", "não consigo entrar no curso")]),
    "não consigo entrar no curso"
  );
  assert.equal(assuntoResumido([msg("ia", "Oi!")]), "");
});

test("assunto comprido corta em palavra inteira", () => {
  const a = assuntoResumido([
    msg("aluno", "comprei o curso de nanofios em junho do ano passado e até hoje não recebi nada"),
  ]);
  assert.ok(a.length <= 63, a);
  assert.match(a, /…$/);
  assert.ok(!/\s…$/.test(a));
});
