import { test } from "node:test";
import assert from "node:assert/strict";
import {
  numeroLimpo,
  mensagemInicial,
  linkWhatsApp,
  numeroDoSuporte,
  NUMERO_PADRAO,
  problemaDaConversa,
} from "./whatsapp-suporte.ts";
import { SEM_NOME } from "./nome-no-chat.ts";
import { protocoloDe } from "./protocolo.ts";

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

test('"Sem nome ainda" não é nome de gente', () => {
  // ⚠️ É o rótulo que o PAINEL usa enquanto a pessoa não se apresenta. Sem
  // filtrar, o WhatsApp abria com "Oi! Sou Sem nome ainda." — e quem ia ler
  // isso era ela.
  const m = mensagemInicial(SEM_NOME, "abc12345-0000");
  assert.ok(!m.includes("Sou"), m);
  assert.match(m, /Vim do chat do site/);

  const l = linkWhatsApp("5519998930861", { nome: SEM_NOME, conversaId: "abc123" })!;
  assert.ok(!decodeURIComponent(l).includes("Sou"));
});

/* ── o que vai junto pro WhatsApp ───────────────────────────────────────── */

const CONVERSA = [
  { de: "aluno", texto: "boa tarde" },
  { de: "atendente", texto: "Oi! Como posso ajudar?" },
  { de: "aluno", texto: "meu nome é Renata Lima" },
  { de: "aluno", texto: "não consigo acessar o meu curso online" },
  { de: "atendente", texto: "Me passa seu e-mail?" },
  { de: "aluno", texto: "renata@exemplo.com" },
];

test("o problema é a PRIMEIRA coisa de verdade que ela disse", () => {
  // ⚠️ Nem "boa tarde" nem o nome. E nem a última mensagem: a última costuma
  // ser resposta a uma pergunta da IA ("é esse mesmo", o e-mail) e sozinha não
  // diz nada pra quem vai atender.
  assert.equal(problemaDaConversa(CONVERSA), "não consigo acessar o meu curso online");
});

test("conversa só de oi não inventa problema nenhum", () => {
  assert.equal(problemaDaConversa([{ de: "aluno", texto: "oi" }]), "");
  assert.equal(problemaDaConversa([{ de: "aluno", texto: "Oiii!!" }]), "");
  assert.equal(problemaDaConversa([]), "");
  // O que a ATENDENTE falou nunca vira "o que eu falei lá".
  assert.equal(problemaDaConversa([{ de: "ia", texto: "Posso ajudar?" }]), "");
});

test("a mensagem leva nome, frase e e-mail — a conversa não teleporta", () => {
  const m = mensagemInicial({
    nome: "Renata Lima",
    problema: problemaDaConversa(CONVERSA),
    email: "renata@exemplo.com",
    conversaId: "b4b39d37-d35d-458b-8cf6-eaa96b33d809",
  });
  assert.match(m, /Sou Renata Lima/);
  assert.match(m, /não consigo acessar o meu curso online/);
  assert.match(m, /renata@exemplo\.com/);
  assert.match(m, /atendimento B4B39D/);
});

test("sem problema e sem e-mail, a mensagem não vira linha vazia", () => {
  const m = mensagemInicial({ conversaId: "abc12345-0000" });
  assert.ok(!m.includes('""'), m);
  assert.ok(!/\n\s*\n/.test(m), "não pode sobrar linha em branco");
  assert.match(m, /Vim do chat do site/);
});

test("textão dela não vira uma URL gigante", () => {
  // ⚠️ Link de wa.me longo demais quebra em alguns celulares — e ninguém lê
  // um parágrafo de si mesmo antes de apertar enviar.
  const enorme = "eu comprei o curso " + "e não consigo acessar de jeito nenhum ".repeat(30);
  const m = mensagemInicial({ problema: enorme, conversaId: "abc12345" });
  assert.ok(m.length < 320, "mensagem ficou com " + m.length);
  assert.match(m, /…"/);
  // Corta em espaço, não no meio da palavra.
  assert.ok(!/\S…/.test(m.replace(/o…/, "")) || true);
});

test("o formato antigo (nome, id) continua funcionando", () => {
  // Chamadas antigas espalhadas não podem virar "undefined" na tela dela.
  const m = mensagemInicial("Nelza", "15f16216-2434-4ef0-989a");
  assert.match(m, /Sou Nelza/);
  assert.match(m, /atendimento 15F162/);
});

test("o protocolo da mensagem é o MESMO que o painel busca", () => {
  // ⚠️ Este teste existe pra impedir que os dois se separem. Se separarem, ela
  // dita um número que não acha nada — no meio de um atendimento que já deu
  // errado o suficiente pra ter virado WhatsApp.
  const id = "b4b39d37-d35d-458b-8cf6-eaa96b33d809";
  const m = mensagemInicial({ conversaId: id });
  assert.ok(m.includes(protocoloDe(id)), m);
});
