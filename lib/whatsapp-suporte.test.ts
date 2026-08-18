import { test } from "node:test";
import assert from "node:assert/strict";
import {
  numeroLimpo,
  mensagemInicial,
  linkWhatsApp,
  numeroDoSuporte,
  NUMERO_PADRAO,
} from "./whatsapp-suporte.ts";

/* ── o número ───────────────────────────────────────────────────────────── */

test("aceita o número escrito como gente escreve", () => {
  // É assim que ele vai ser colado na variável de ambiente.
  assert.equal(numeroLimpo("+55 (11) 99999-8888"), "5511999998888");
  assert.equal(numeroLimpo("5511999998888"), "5511999998888");
  assert.equal(numeroLimpo(" 55 11 99999 8888 "), "5511999998888");
});

test("número pela metade ou vazio devolve null", () => {
  // ⚠️ Vira "sem WhatsApp" e a tela volta ao comportamento antigo. Link
  // quebrado numa tela de suporte é pior que link nenhum: a aluna clica, cai
  // num lugar vazio e conclui que ninguém vai responder.
  assert.equal(numeroLimpo("99999-8888"), null);
  assert.equal(numeroLimpo("11 9999"), null);
  assert.equal(numeroLimpo(""), null);
  assert.equal(numeroLimpo(undefined), null);
  assert.equal(numeroLimpo("não configurado"), null);
});

/* ── a mensagem que já vem escrita ──────────────────────────────────────── */

test("leva o nome e o código da conversa", () => {
  // ⚠️ O código é o que deixa quem atender achar o que já foi conversado, em
  // vez de fazer a aluna contar tudo de novo — a parte chata de ser
  // encaminhado.
  const m = mensagemInicial("Nelza", "15f16216-2434-4ef0-989a-3539fabcc0ac");
  assert.match(m, /Sou Nelza/);
  assert.match(m, /atendimento 15F162/);
});

test("sem nome, a mensagem continua fazendo sentido", () => {
  const m = mensagemInicial(undefined, "abc12345-0000-0000-0000-000000000000");
  assert.ok(!m.includes("undefined"));
  assert.match(m, /Vim do chat do site/);
  assert.equal(mensagemInicial("   ", "abc12345-0000").includes("Sou"), false);
});

/* ── o link ─────────────────────────────────────────────────────────────── */

test("monta o link do wa.me com a mensagem pronta", () => {
  const l = linkWhatsApp("+55 11 99999-8888", { nome: "Nelza", conversaId: "abc123-def" });
  assert.match(l!, /^https:\/\/wa\.me\/5511999998888\?text=/);
  assert.match(decodeURIComponent(l!), /Sou Nelza/);
});

test("sem número configurado, não existe link", () => {
  assert.equal(linkWhatsApp(undefined, { conversaId: "x" }), null);
  assert.equal(linkWhatsApp("", { conversaId: "x" }), null);
});

test("o texto vai codificado — acento e espaço não quebram a URL", () => {
  const l = linkWhatsApp("5511999998888", { nome: "Thaís Antônia", conversaId: "abc123" })!;
  assert.ok(!/\s/.test(l), "não pode ter espaço solto na URL");
  assert.match(decodeURIComponent(l), /Thaís Antônia/);
});

/* ── o número do suporte ────────────────────────────────────────────────── */

test("existe número por padrão — o botão não depende da Vercel", () => {
  // ⚠️ Em variável de ambiente só, o botão ficaria invisível pra aluna até
  // alguém lembrar de configurar em produção. E não é segredo: o número já está
  // público nas landing pages.
  assert.equal(numeroDoSuporte({}), NUMERO_PADRAO);
  assert.ok(numeroLimpo(numeroDoSuporte({})));
});

test("a variável de ambiente ainda manda, se existir", () => {
  // Trocar o número passa a ser mudar uma variável, sem esperar deploy.
  assert.equal(numeroDoSuporte({ WHATSAPP_SUPORTE: "5511911112222" }), "5511911112222");
  assert.equal(numeroDoSuporte({ WHATSAPP_SUPORTE: "   " }), NUMERO_PADRAO);
});
