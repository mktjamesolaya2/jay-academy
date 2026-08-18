import { test } from "node:test";
import assert from "node:assert/strict";
import {
  montarPrompt,
  lerResposta,
  pediuHumano,
  limparVazamento,
  resumoPraAtendente,
  pareceRaciocinio,
  tirarSaudacaoSolta,
  MARCA_HUMANO,
} from "./suporte-prompt.ts";

/* ── o prompt ───────────────────────────────────────────────────────────── */

test("a base de conhecimento entra no prompt", () => {
  const p = montarPrompt("Basic Nanofios custa R$ 297.");
  assert.ok(p.includes("Basic Nanofios custa R$ 297."));
});

test("base vazia manda chamar uma pessoa — não deixa ela inventar", () => {
  const p = montarPrompt("   ");
  assert.ok(/você ainda não sabe nada/i.test(p));
});

test("proíbe inventar preço e prometer em nome da escola", () => {
  const p = montarPrompt("x");
  assert.ok(/Não invente preço/i.test(p));
  assert.ok(/Não promete nada em nome da escola/i.test(p));
});

test("deixa claro que ela nunca inicia conversa", () => {
  assert.ok(/não inicia conversa/i.test(montarPrompt("x")));
});

/* ── a leitura da resposta ──────────────────────────────────────────────── */

test("o marcador aciona o humano e some do texto do aluno", () => {
  const r = lerResposta(`Vou chamar alguém do time pra te ajudar. ${MARCA_HUMANO}`);
  assert.equal(r.precisaHumano, true);
  assert.equal(r.texto, "Vou chamar alguém do time pra te ajudar.");
  assert.ok(!r.texto.includes("["), "o aluno nunca pode ver o marcador");
});

test("resposta normal não aciona nada", () => {
  const r = lerResposta("O Basic Nanofios tem 13 módulos.");
  assert.equal(r.precisaHumano, false);
  assert.equal(r.texto, "O Basic Nanofios tem 13 módulos.");
});

test("variação do marcador também é limpa", () => {
  // o modelo às vezes escreve [humano] em vez de [HUMANO]
  const r = lerResposta("Já te transfiro [humano]");
  assert.ok(!r.texto.toLowerCase().includes("humano]"));
});

/* ── o atalho antes da IA ───────────────────────────────────────────────── */

test("pedido explícito de pessoa é pego antes de gastar a IA", () => {
  assert.equal(pediuHumano("quero falar com alguém"), true);
  assert.equal(pediuHumano("ME PASSA UM ATENDENTE"), true);
  assert.equal(pediuHumano("tem como falar com uma pessoa?"), true);
  assert.equal(pediuHumano("chama alguem ai"), true);
});

test("pergunta comum não é confundida com pedido de humano", () => {
  assert.equal(pediuHumano("quanto custa o Lips Sense?"), false);
  assert.equal(pediuHumano("não consigo assistir a aula 3"), false);
  assert.equal(pediuHumano("o acesso é vitalício?"), false);
});

test("proíbe falar da própria base pro aluno", () => {
  // ⚠️ Na primeira bateria ela respondeu "não temos isso na base que eu
  // conheço". O aluno não tem nada a ver com como a gente guarda a informação.
  const p = montarPrompt("x");
  assert.ok(/Não fale da sua "base"/i.test(p));
  assert.ok(/não tenho na minha base/i.test(p), "traz o exemplo do que é errado");
});

/* ── o vazamento do "na base" ───────────────────────────────────────────── */

test("tira a menção à base — as frases que ela realmente falou", () => {
  // ⚠️ Estas duas saíram da bateria de teste, em produção do modelo grátis:
  // primeiro "na base que eu conheço"; depois de eu proibir no prompt, ela
  // trocou pra "na base atual". Por isso a limpeza é no código.
  assert.equal(
    limparVazamento("Não temos curso de cílios na base que eu conheço, vou chamar alguém"),
    "Não temos curso de cílios, vou chamar alguém"
  );
  assert.equal(
    limparVazamento("Não temos curso de cílios na base atual, vou chamar alguém"),
    "Não temos curso de cílios, vou chamar alguém"
  );
});

test("pega as outras formas de dizer a mesma coisa", () => {
  assert.ok(!/base/i.test(limparVazamento("Isso não está na minha base de conhecimento.")));
  assert.ok(!/base/i.test(limparVazamento("Não consta na nossa base de dados.")));
});

test("não mutila resposta boa", () => {
  const ok = "O Basic Nanofios tem 13 módulos e custa R$ 297.";
  assert.equal(limparVazamento(ok), ok);
});

test("a limpeza roda junto com a leitura da resposta", () => {
  const r = lerResposta(`Não temos isso na base atual ${MARCA_HUMANO}`);
  assert.ok(!/base/i.test(r.texto));
  assert.equal(r.precisaHumano, true);
});

/* ── o resumo pro atendente ─────────────────────────────────────────────── */

test("resumo com uma mensagem só é a própria mensagem", () => {
  const r = resumoPraAtendente([{ de: "aluno", texto: "não consigo entrar no curso" }]);
  assert.equal(r, "não consigo entrar no curso");
});

test("resumo com várias mostra do que começou ao que virou", () => {
  const r = resumoPraAtendente([
    { de: "aluno", texto: "comprei dois cursos" },
    { de: "ia", texto: "que bom!" },
    { de: "aluno", texto: "deu erro no cartão e quero reembolso" },
  ]);
  assert.ok(r.startsWith("comprei dois cursos"));
  assert.ok(r.includes("reembolso"));
  assert.ok(r.includes("→"));
});

test("resumo ignora o que a IA falou — só o aluno importa", () => {
  const r = resumoPraAtendente([
    { de: "ia", texto: "Oi! Como posso ajudar?" },
    { de: "aluno", texto: "quero falar com atendente" },
  ]);
  assert.equal(r, "quero falar com atendente");
});

test("resumo corta mensagem quilométrica", () => {
  const r = resumoPraAtendente([{ de: "aluno", texto: "a".repeat(300) }]);
  assert.ok(r.length < 100);
  assert.ok(r.endsWith("…"));
});

test("manda pedir o E-MAIL, não 'há quanto tempo comprou'", () => {
  // ⚠️ A regra antiga mandava perguntar há quanto tempo — e o modelo obedecia
  // ela mesmo quando o sistema JÁ sabia a data, pela consulta na Hotmart. A
  // aluna era interrogada à toa.
  const p = montarPrompt("x");
  assert.match(p, /pedir o e-mail da compra/i);
  assert.match(p, /Nunca pergunte\s+"há quanto tempo/i);
});

test("os fatos da aluna vencem o que o modelo imaginar", () => {
  assert.match(montarPrompt("x"), /manda mais\s+que qualquer coisa que você imagine/i);
});

/* ── raciocínio vazando ─────────────────────────────────────────────────── */

test("pega o raciocínio que vazou de verdade pra aluna", () => {
  // ⚠️ Texto real, do print que o James mandou.
  const vazou = `We need to follow instructions. The user gave email. We need to
check the "O QUE JÁ SABEMOS DESTA ALUNA". It says: "O acesso de
'renataaadelima21@gmail.com' está DENTRO dos 12 meses." So it's not expired.`;
  assert.equal(pareceRaciocinio(vazou), true);
});

test("pega o modelo se auto-avaliando em voz alta", () => {
  // ⚠️ Texto REAL, da primeira conversa da página pública `/ajuda`. Chegou
  // inteiro na tela da "aluna". As marcas antigas não pegaram porque isto não é
  // frase em 1ª pessoa — é lista de conferência.
  const vazou = `Name: Ana Paula used? Yes. * Empathy/Reaction first? "Poxa, deixa eu te ajudar". Yes. * Natural language`;
  assert.equal(pareceRaciocinio(vazou), true);
});

test("outras formas da mesma auto-avaliação", () => {
  assert.equal(pareceRaciocinio("Tone check: ok. Final answer: Oi, Ana!"), true);
  assert.equal(pareceRaciocinio("Checklist: saudação? Yes."), true);
});

test("resposta normal não é confundida com rascunho", () => {
  assert.equal(pareceRaciocinio("Seu acesso está dentro do prazo, vou pedir pro time reenviar."), false);
  assert.equal(pareceRaciocinio("Oi! Como posso ajudar?"), false);
  assert.equal(pareceRaciocinio("El acceso dura 12 meses desde la compra."), false);
});

test("espanhol com 'no' depois de pergunta continua passando", () => {
  // ⚠️ A regra nova olha só o "yes" em inglês, de propósito. Barrar "no" depois
  // de "?" cortaria resposta legítima em espanhol — e a IA precisa atender
  // aluna hispanofalante.
  assert.equal(
    pareceRaciocinio("¿Perdiste el acceso? No te preocupes, lo revisamos ahora."),
    false
  );
  assert.equal(pareceRaciocinio("Perdeu o acesso? Não se preocupe, vou ver aqui."), false);
});

test("resposta vazia conta como rascunho — não manda nada pra aluna", () => {
  assert.equal(pareceRaciocinio("   "), true);
});

test("citar bloco interno nosso é vazamento", () => {
  assert.equal(pareceRaciocinio("Segundo a SUA BASE DE CONHECIMENTO, o acesso é de 12 meses"), true);
});

/* ── quem somos, e cumprimentar uma vez ─────────────────────────────────── */

test("proíbe cumprimentar de novo no meio da conversa", () => {
  // ⚠️ Caso real de um teste do James: a 2ª resposta veio "Oi! Aqui é do
  // suporte da Jay Academy..." — a pessoa já estava na conversa. Repetir a
  // apresentação é o sinal mais rápido de que quem responde é máquina.
  assert.match(montarPrompt("x"), /Cumprimente UMA vez só/i);
});

/* ── a saudação repetida ────────────────────────────────────────────────── */

test("tira o 'Oi!' solto — a tela já cumprimentou", () => {
  // ⚠️ Caso real: a tela abre com "Bom dia! Aqui é o suporte da Jay Academy" e
  // o modelo emendava "Oi! Posso ajudar com acesso, login...". Dois
  // cumprimentos em dois balões seguidos = robô.
  assert.equal(
    tirarSaudacaoSolta("Oi! Posso ajudar com acesso, login e material."),
    "Posso ajudar com acesso, login e material."
  );
  assert.equal(tirarSaudacaoSolta("Olá. Tudo certo por aqui."), "Tudo certo por aqui.");
  assert.equal(tirarSaudacaoSolta("Bom dia! Vou verificar isso."), "Vou verificar isso.");
});

test("MANTÉM o cumprimento com nome — é o que faz parecer gente", () => {
  // Chamar pela nome era justamente o que a gente queria; tirar seria piorar.
  assert.equal(tirarSaudacaoSolta("Oi, Renata! Já vi aqui."), "Oi, Renata! Já vi aqui.");
  assert.equal(tirarSaudacaoSolta("Bom dia, Ana! Tudo certo."), "Bom dia, Ana! Tudo certo.");
});

test("não mutila resposta que começa parecido", () => {
  assert.equal(tirarSaudacaoSolta("Oitenta reais não é um valor nosso."), "Oitenta reais não é um valor nosso.");
  assert.equal(tirarSaudacaoSolta("Olá"), "Olá");
});

test("a limpeza do 'na base' continua acontecendo junto", () => {
  // ⚠️ Ao trocar a limpeza pela nova eu quase perdi esta — as duas rodam.
  const r = lerResposta("Oi! Não temos isso na base atual, vou chamar alguém");
  assert.ok(!/base/i.test(r.texto));
  assert.ok(!/^Oi/.test(r.texto));
});

test("o prompt diz que ela OUVE áudio e VÊ imagem", () => {
  // ⚠️ Sem isso o modelo respondia "não consigo ouvir mensagens de áudio, pode
  // escrever em texto?" — mentira: ele ouve. E quem manda áudio costuma ser
  // quem está com pressa ou sem jeito de escrever; mandar essa pessoa digitar
  // é empurrar o problema pra ela.
  const p = montarPrompt("x");
  assert.match(p, /ouve áudio/i);
  assert.match(p, /NUNCA diga que não consegue ouvir/i);
});
