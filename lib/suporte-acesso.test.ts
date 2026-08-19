import { test } from "node:test";
import assert from "node:assert/strict";
import {
  acharEmail,
  ehProblemaDeAcesso,
  avaliarAcesso,
  fatosDoAcesso,
  saudacao,
  primeiroNome,
  ehVitalicio,
} from "./suporte-acesso.ts";

const compra = (compradaEm: string, situacao = "approved") => [
  { produto: "Basic Nanofios", compradaEm, situacao },
];

/* ── achar o e-mail no meio da conversa ─────────────────────────────────── */

test("acha o e-mail solto na frase", () => {
  assert.equal(
    acharEmail("meu email é Maria.Silva@Gmail.com, obrigada"),
    "maria.silva@gmail.com"
  );
});

test("sem e-mail devolve null", () => {
  assert.equal(acharEmail("não consigo entrar no curso"), null);
});

/* ── reconhecer o problema de acesso ────────────────────────────────────── */

test("reconhece as formas que a aluna escreve de verdade", () => {
  assert.equal(ehProblemaDeAcesso("não estou conseguindo acessar meu curso"), true);
  assert.equal(ehProblemaDeAcesso("nao consigo entrar na plataforma"), true);
  assert.equal(ehProblemaDeAcesso("meu curso sumiu da plataforma"), true);
  assert.equal(ehProblemaDeAcesso("meu acesso expirou?"), true);
});

test("o caso real que passou batido e quebrou um atendimento", () => {
  // ⚠️ Frase EXATA de uma conversa de verdade. A versão antiga exigia a
  // construção "não consigo acessar" e deixou passar. Como não detectou, a
  // consulta na Hotmart nunca rodou: a aluna deu o e-mail, ninguém nunca olhou
  // se ela tinha acesso, e a conversa foi empurrada pra uma pessoa.
  assert.equal(
    ehProblemaDeAcesso("estou com problemas para acessar o meu curso online"),
    true
  );
});

test("os outros jeitos de dizer a mesma coisa", () => {
  for (const f of [
    "problema no acesso",
    "meu curso não abre",
    "não carrega a aula",
    "perdi o acesso",
    "não recebi o email de acesso",
    "não chegou o link do curso",
    "minha senha não funciona",
    "a plataforma está fora do ar",
    "esqueci minha senha de login",
    "o vídeo não roda",
  ]) {
    assert.equal(ehProblemaDeAcesso(f), true, f);
  }
});

test("não confunde com outras dúvidas", () => {
  // ⚠️ Falso positivo custa caro: a IA passa a pedir o e-mail da compra pra
  // quem só queria saber onde está a apostila.
  for (const f of [
    "onde fica a apostila?",
    "quantos módulos tem?",
    "o curso tem certificado?",
    "qual a duração do curso?",
    "bom dia",
    "me chamo Nelza",
    "quero saber sobre o curso de nanofios",
  ]) {
    assert.equal(ehProblemaDeAcesso(f), false, f);
  }
});

/* ── a decisão, que NÃO passa pelo modelo ───────────────────────────────── */

test("sem e-mail: o passo é pedir o e-mail", () => {
  assert.equal(avaliarAcesso(null, [], new Date()).tipo, "sem-email");
});

test("dentro dos 12 meses: reenviar acesso", () => {
  const s = avaliarAcesso(
    "a@b.com",
    compra("2026-03-12T00:00:00Z"),
    new Date("2026-08-17T00:00:00Z")
  );
  assert.equal(s.tipo, "no-prazo");
});

test("passou dos 12 meses: acesso encerrado", () => {
  const s = avaliarAcesso(
    "a@b.com",
    compra("2024-01-10T00:00:00Z"),
    new Date("2026-08-17T00:00:00Z")
  );
  assert.equal(s.tipo, "vencido");
});

test("quem comprou de novo ganha o prazo da compra mais nova", () => {
  // ⚠️ Aluna que recomprou não pode ouvir "seu acesso venceu" por causa da
  // compra velha.
  const s = avaliarAcesso(
    "a@b.com",
    [
      { produto: "Basic Nanofios", compradaEm: "2023-01-01T00:00:00Z", situacao: "approved" },
      { produto: "Basic Nanofios", compradaEm: "2026-05-01T00:00:00Z", situacao: "approved" },
    ],
    new Date("2026-08-17T00:00:00Z")
  );
  assert.equal(s.tipo, "no-prazo");
});

test("compra cancelada não vira acesso ativo", () => {
  const s = avaliarAcesso(
    "a@b.com",
    compra("2026-05-01T00:00:00Z", "cancelled"),
    new Date("2026-08-17T00:00:00Z")
  );
  assert.equal(s.tipo, "cancelado");
});

test("e-mail que não comprou nada", () => {
  assert.equal(avaliarAcesso("a@b.com", [], new Date()).tipo, "nao-encontrado");
});

/* ── o que o modelo recebe ──────────────────────────────────────────────── */

test("no prazo: manda reenviar, e NÃO diz que venceu", () => {
  const f = fatosDoAcesso(
    avaliarAcesso("a@b.com", compra("2026-03-12T00:00:00Z"), new Date("2026-08-17T00:00:00Z"))
  );
  assert.match(f, /reenviar o acesso/i);
  assert.match(f, /NÃO é acesso vencido/i);
});

test("vencido: proíbe citar preço e oferecer plano", () => {
  // James: a IA é só suporte. Quem oferece qualquer coisa é a pessoa.
  const f = fatosDoAcesso(
    avaliarAcesso("a@b.com", compra("2024-01-10T00:00:00Z"), new Date("2026-08-17T00:00:00Z"))
  );
  assert.match(f, /NÃO cite\s+preço/i);
  assert.match(f, /NÃO ofereça plano/i);
});

test("e-mail não encontrado: DIZ que não achou, e não empurra pra atendente", () => {
  // ⚠️ Caso real: a aluna deu um e-mail que não existia e a conversa foi
  // direto pra uma pessoa, sem nunca dizer a ela o que tinha acontecido. James:
  // *"o certo seria ele mandar assim, não encontrei nenhum cadastro com esse
  // e-mail. Você pode me enviar de novo?"*
  const f = fatosDoAcesso(avaliarAcesso("nelza123@hotmail.com", [], new Date()));
  assert.match(f, /N[ÃA]O achamos compra/i);
  assert.match(f, /conferir/i);
  assert.match(f, /N[ÃA]O chame uma pessoa/i);
});

test("cancelada: proíbe falar de reembolso", () => {
  const f = fatosDoAcesso(
    avaliarAcesso("a@b.com", compra("2026-05-01T00:00:00Z", "cancelled"), new Date("2026-08-17T00:00:00Z"))
  );
  assert.match(f, /NÃO fale de reembolso/i);
});

test("sem e-mail: manda pedir só o e-mail, sem chamar ninguém ainda", () => {
  const f = fatosDoAcesso({ tipo: "sem-email" });
  assert.match(f, /Peça o e-mail/i);
  assert.match(f, /não chame ninguém do time ainda/i);
});

/* ── saudação ───────────────────────────────────────────────────────────── */

test("saudação segue o horário de Brasília", () => {
  assert.equal(saudacao(new Date("2026-08-17T12:00:00Z")), "Bom dia"); // 9h BRT
  assert.equal(saudacao(new Date("2026-08-17T18:00:00Z")), "Boa tarde"); // 15h BRT
  assert.equal(saudacao(new Date("2026-08-18T01:00:00Z")), "Boa noite"); // 22h BRT
});

/* ── o nome da aluna ────────────────────────────────────────────────────── */

test("só o primeiro nome, e sem gritar", () => {
  // ⚠️ A Hotmart devolve em caixa alta. "Oi, RENATA!" parece grito; o nome
  // completo parece cadastro.
  assert.equal(primeiroNome("RENATA LIMA DE SOUZA"), "Renata");
  assert.equal(primeiroNome("ana paula"), "Ana");
  assert.equal(primeiroNome(""), null);
  assert.equal(primeiroNome(undefined), null);
});

test("o nome entra nos fatos, pra ela chamar pelo nome", () => {
  const f = fatosDoAcesso(
    avaliarAcesso(
      "a@b.com",
      [{ produto: "Basic Nanofios", compradaEm: "2026-03-12T00:00:00Z", situacao: "approved", nome: "MARIA SILVA" }],
      new Date("2026-08-17T00:00:00Z")
    )
  );
  assert.match(f, /se chama Maria/);
});

/* ── "não achei" x "não consegui procurar" ──────────────────────────────── */

test("sem poder consultar, NÃO diz que não achou a compra", () => {
  // ⚠️ Caso real: o e-mail existia na Hotmart, mas as credenciais da API não
  // estavam configuradas. A aluna ouviu "procurei e não achei nenhuma compra
  // com esse e-mail" — uma frase que NEGA A COMPRA de quem pagou, por causa de
  // uma variável de ambiente.
  const s = avaliarAcesso("existe@hotmart.com", [], new Date(), false);
  assert.equal(s.tipo, "nao-consegui-conferir");

  const f = fatosDoAcesso(s);
  assert.match(f, /N[ÃA]O diga que não achou/i);
  assert.match(f, /não conseguiu confirmar/i);
  assert.match(f, /pessoa/i);
});

test("podendo consultar, lista vazia continua sendo 'não achei'", () => {
  const s = avaliarAcesso("naoexiste@b.com", [], new Date(), true);
  assert.equal(s.tipo, "nao-encontrado");
});

test("o padrão é assumir que a consulta funcionou", () => {
  // Compatibilidade: quem chamar sem o argumento mantém o comportamento antigo.
  assert.equal(avaliarAcesso("a@b.com", [], new Date()).tipo, "nao-encontrado");
});

/* ── o laço do "não achei" (protocolo 756484) ────────────────────────────── */

test("primeira vez é 'não encontrei'; segunda vez pro MESMO e-mail vira pessoa", () => {
  // ⚠️ A conversa real: "não achei, foi outro e-mail?" → "usei esse mesmo" →
  // "não achei, foi outro e-mail?" → "comprei em junho" → "não achei..." →
  // pedido de comprovante. Quatro voltas sem sair do lugar.
  const e = "dri.guima@hotmail.com";
  const primeira = avaliarAcesso(e, [], new Date(), true, []);
  assert.equal(primeira.tipo, "nao-encontrado");

  const segunda = avaliarAcesso(e, [], new Date(), true, [e]);
  assert.equal(segunda.tipo, "nao-encontrado-de-novo");
});

test("e-mail NOVO merece busca nova, mesmo depois de um que falhou", () => {
  // ⚠️ Senão o segundo e-mail — que pode ser o certo — já nasceria condenado.
  const s = avaliarAcesso("outro@exemplo.com", [], new Date(), true, [
    "dri.guima@hotmail.com",
  ]);
  assert.equal(s.tipo, "nao-encontrado");
});

test("maiúscula no e-mail não faz a segunda vez virar primeira", () => {
  const s = avaliarAcesso("Dri.Guima@Hotmail.com".toLowerCase(), [], new Date(), true, [
    "dri.guima@hotmail.com",
  ]);
  assert.equal(s.tipo, "nao-encontrado-de-novo");
});

test("sem conseguir consultar, o histórico não vira 'de novo'", () => {
  // ⚠️ "Não consegui procurar" é outra coisa, e continua tendo precedência:
  // dizer "não achei" quando a busca não rodou nega a compra de quem pagou.
  const e = "dri.guima@hotmail.com";
  assert.equal(avaliarAcesso(e, [], new Date(), false, [e]).tipo, "nao-consegui-conferir");
});

test("os fatos do 'de novo' proíbem exatamente o que a IA fez", () => {
  const f = fatosDoAcesso({ tipo: "nao-encontrado-de-novo", email: "x@y.com" });
  assert.match(f, /NÃO\s+pergunte\s+de\s+novo\s+se\s+foi\s+outro\s+e-mail/);
  assert.match(f, /NÃO\s+peça\s+a\s+data/);
  assert.match(f, /comprovante/);
  // ⚠️ \s+ e não espaço: o texto dos fatos é quebrado à mão em 76 colunas,
  // então a frase pode nascer com um \n no meio a qualquer momento.
  assert.match(f, /Passe\s+para uma pessoa/);
});

test("no primeiro 'não achei' ela não pode chutar vencimento", () => {
  // ⚠️ A IA disse "se a compra foi em junho do ANO PASSADO já pode ter
  // expirado" — sem ter achado compra nenhuma, então sem data nenhuma. E a
  // aluna tinha dito "mês retrasado".
  const f = fatosDoAcesso({ tipo: "nao-encontrado", email: "x@y.com" });
  assert.match(f, /NÃO\s+fale\s+de\s+prazo,\s+vencimento\s+nem\s+dos\s+12\s+meses/);
});

test("quem encaminha convida pro WhatsApp, e nunca promete ir atrás dela", () => {
  // ⚠️ Ninguém responde no portal. "Vou chamar alguém pra te ajudar" diz que a
  // gente vai atrás dela; o botão ao lado diz que ela é que tem que ir. Uma das
  // duas está mentindo.
  for (const s of [
    { tipo: "cancelado", email: "x@y.com" },
    { tipo: "nao-consegui-conferir", email: "x@y.com" },
  ] as const) {
    const f = fatosDoAcesso(s);
    assert.match(f, /WhatsApp/i, s.tipo);
    assert.match(f, /NÃO\s+(diga|prometa)/, s.tipo);
  }
});

test("acesso vencido NÃO oferece WhatsApp de cara", () => {
  // ⚠️ James: *"quando o acesso já tiver vencido, não precisa mandar protocolo
  // nem botão; apenas se a pessoa responder, aí sim"*. Saber que venceu já é a
  // resposta — emendar um encaminhamento numa notícia dessas parece pressa de
  // empurrar ela pra frente.
  const f = fatosDoAcesso({
    tipo: "vencido",
    email: "x@y.com",
    compras: [],
    venceuEm: "2026-01-06T00:00:00Z",
  });
  // ⚠️ A palavra APARECE no texto — mas como proibição ("NÃO fale de
  // WhatsApp"), não como convite. Testar a ausência da palavra seria testar
  // a coisa errada.
  assert.match(f, /NÃO fale de WhatsApp/i);
  assert.match(f, /NÃO chame uma pessoa/i);
  // Mas deixa a porta aberta: se ela quiser continuar, aí sim.
  assert.match(f, /Se\s+ela\s+disser\s+que\s+sim/i);
});

/* ── acesso vitalício ────────────────────────────────────────────────────── */

test("acesso VITALÍCIO nunca vence, mesmo comprado há anos", () => {
  // ⚠️ São 278 compras assim nas planilhas, 158 delas com mais de um ano. Sem
  // esta regra, a IA dizia a 158 alunas que o acesso delas tinha acabado —
  // sendo que elas pagaram justamente pra não ter prazo.
  const s = avaliarAcesso(
    "x@y.com",
    [
      {
        produto: "[ACESSO VITALÍCIO] Fio a Fio Realista - James Olaya",
        compradaEm: "2021-03-10T12:00:00Z",
        situacao: "completo",
      },
    ],
    new Date("2026-08-19T12:00:00Z")
  );
  assert.equal(s.tipo, "vitalicio");
});

test("vitalício em espanhol também conta", () => {
  const s = avaliarAcesso(
    "x@y.com",
    [{ produto: "[ACCESO VITALICIO] Pelo a Pelo Realista Español", compradaEm: "2020-01-01T12:00:00Z", situacao: "completo" }],
    new Date("2026-08-19T12:00:00Z")
  );
  assert.equal(s.tipo, "vitalicio");
});

test('"Perpétuo" NÃO é vitalício — é nome de campanha', () => {
  // ⚠️ Existe uma oferta chamada "Principal Perpétuo - Tráfego pago". Casar
  // por ela daria acesso eterno a quem não tem.
  assert.equal(ehVitalicio("97 - Principal Perpétuo - Tráfego pago"), false);
  assert.equal(ehVitalicio("[ACESSO VITALÍCIO] Shadow PRO"), true);
  assert.equal(ehVitalicio(""), false);
});

test("uma compra vitalícia protege a aluna, mesmo com outra vencida", () => {
  // ⚠️ A frase "seu acesso venceu" gruda na PESSOA, não no produto. Quem tem
  // um curso vitalício não pode ouvir isso.
  const s = avaliarAcesso(
    "x@y.com",
    [
      { produto: "Curso comum", compradaEm: "2022-01-01T12:00:00Z", situacao: "completo" },
      { produto: "[ACESSO VITALÍCIO] Shadow PRO", compradaEm: "2022-01-01T12:00:00Z", situacao: "completo" },
    ],
    new Date("2026-08-19T12:00:00Z")
  );
  assert.equal(s.tipo, "vitalicio");
});

test("os fatos do vitalício proíbem falar em 12 meses", () => {
  const f = fatosDoAcesso({
    tipo: "vitalicio",
    email: "x@y.com",
    compras: [{ produto: "[ACESSO VITALÍCIO] Shadow PRO", compradaEm: "2022-01-01T12:00:00Z", situacao: "completo" }],
  });
  assert.match(f, /VITALÍCIO/);
  assert.match(f, /NÃO\s+fale\s+em\s+12\s+meses/i);
  // ⚠️ A base de conhecimento diz que dura 12 meses. Os fatos têm que ganhar
  // dela, senão o modelo repete o que está escrito lá.
  assert.match(f, /base de conhecimento/i);
});
