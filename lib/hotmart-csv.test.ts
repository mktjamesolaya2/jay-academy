import { test } from "node:test";
import assert from "node:assert/strict";
import {
  lerCsv,
  lerData,
  partirLinha,
  acharSeparador,
  acharColunas,
  agruparPorEmail,
  emLotes,
} from "./hotmart-csv.ts";

/* ── o formato do arquivo ────────────────────────────────────────────────── */

test("exportação brasileira vem com ponto e vírgula", () => {
  // ⚠️ Assumir vírgula faria o arquivo inteiro virar uma coluna só, e o erro
  // apareceria como "nenhuma compra encontrada" — procurando no lugar errado.
  assert.equal(acharSeparador("Produto;Email;Data"), ";");
  assert.equal(acharSeparador("Produto,Email,Data"), ",");
});

test("vírgula dentro de aspas não parte a coluna", () => {
  // ⚠️ "Nanofios, do zero ao avançado" desalinharia tudo a partir dali — e o
  // e-mail viraria a data.
  const c = partirLinha('"Nanofios, do zero";ana@x.com;05/08/2026', ";");
  assert.deepEqual(c, ["Nanofios, do zero", "ana@x.com", "05/08/2026"]);
});

test("aspas dobradas viram uma aspa só", () => {
  assert.deepEqual(partirLinha('"curso ""top""";x@y.com', ";"), ['curso "top"', "x@y.com"]);
});

/* ── as colunas ──────────────────────────────────────────────────────────── */

test("acha as colunas por pedaço do nome, com ou sem acento", () => {
  const c = acharColunas(["Produto", "Email do Comprador", "Data da Transação", "Status"]);
  assert.equal(c.produto, 0);
  assert.equal(c.email, 1);
  assert.equal(c.data, 2);
  assert.equal(c.situacao, 3);
});

test("e-mail do COMPRADOR ganha de um 'email' genérico", () => {
  // ⚠️ A outra coluna pode ser o e-mail do afiliado — e aí a compra iria
  // parar na conta de outra pessoa.
  const c = acharColunas(["Email do afiliado", "Email do comprador"]);
  assert.equal(c.email, 1);
});

/* ── a data ──────────────────────────────────────────────────────────────── */

test("dd/mm/aaaa é lido como brasileiro, não americano", () => {
  // ⚠️ new Date("05/08/2026") leria 8 de MAIO. Três meses decidem se o acesso
  // de 12 meses venceu ou não.
  assert.match(lerData("05/08/2026")!, /^2026-08-05/);
  assert.match(lerData("31/12/2025")!, /^2025-12-31/);
  assert.match(lerData("05/08/2026 14:30")!, /^2026-08-05T14:30/);
});

test("data vazia ou impossível devolve null", () => {
  assert.equal(lerData(""), null);
  assert.equal(lerData("   "), null);
  assert.equal(lerData("não informado"), null);
});

/* ── o arquivo inteiro ───────────────────────────────────────────────────── */

const CSV = [
  "Produto;Nome do Comprador;Email do Comprador;Data da Compra;Status da Transação",
  "Nanofios;Ana Paula;ANA@EXEMPLO.COM;05/08/2026;Aprovada",
  '"Shadow, avançado";Bia Souza;bia@exemplo.com;12/01/2025;Reembolsada',
].join("\n");

test("lê o arquivo e diz o que entendeu de cada coluna", () => {
  const r = lerCsv(CSV);
  assert.equal(r.compras.length, 2);
  assert.equal(r.colunas.email, "Email do Comprador");
  assert.equal(r.colunas.data, "Data da Compra");

  // E-mail sempre minúsculo: é a CHAVE da busca, e "ANA@" nunca acharia "ana@".
  assert.equal(r.compras[0]!.email, "ana@exemplo.com");
  assert.equal(r.compras[0]!.nome, "Ana Paula");
  assert.match(r.compras[0]!.compradaEm, /^2026-08-05/);
  assert.equal(r.compras[1]!.produto, "Shadow, avançado");
  assert.equal(r.compras[1]!.situacao, "reembolsada");
});

test("linha sem e-mail ou sem data é DESCARTADA, e o motivo aparece", () => {
  // ⚠️ Sem data não dá pra calcular os 12 meses, e uma compra sem prazo faria
  // a IA dizer "está tudo certo" pra quem já venceu. Melhor descartar e mostrar
  // do que gravar pela metade.
  const csv = [
    "Produto;Email do Comprador;Data da Compra",
    "Nanofios;;05/08/2026",
    "Nanofios;ana@exemplo.com;",
    "Nanofios;isso-nao-e-email;05/08/2026",
  ].join("\n");
  const r = lerCsv(csv);
  assert.equal(r.compras.length, 0);
  assert.equal(r.descartadas.length, 3);
  assert.match(r.descartadas[0]!.motivo, /sem e-mail/);
  assert.match(r.descartadas[1]!.motivo, /sem data/);
  assert.match(r.descartadas[2]!.motivo, /inválido/);
  // O número da linha é o do ARQUIVO, pra pessoa achar no Excel.
  assert.equal(r.descartadas[0]!.linha, 2);
});

test("o BOM do Excel não estraga o primeiro cabeçalho", () => {
  const r = lerCsv("\uFEFF" + CSV);
  assert.equal(r.colunas.produto, "Produto");
  assert.equal(r.compras.length, 2);
});

test("arquivo vazio não explode", () => {
  assert.deepEqual(lerCsv("").compras, []);
  assert.deepEqual(lerCsv("   \n  ").compras, []);
});

/* ── o cabeçalho de verdade da Hotmart ───────────────────────────────────── */

// ⚠️ Este é o cabeçalho REAL do relatório exportado (59 colunas, recortado nas
// que importam). Ele derrubou duas suposições minhas de uma vez.
const CABECALHO_REAL = [
  "Nome do Produto", "Nome do Produtor", "Documento do Produtor", "Nome do Afiliado",
  "Transação", "Meio de Pagamento", "Origem", "Moeda", "Preço do Produto",
  "Data de Venda", "Data de Confirmação", "Status", "Nome", "Documento", "Email",
];

test("o nome da ALUNA não pode virar o nome do curso", () => {
  // ⚠️ "Nome do Produto" vem ANTES de "Nome" no arquivo. Procurando só por
  // pedaço do nome, a caixa do suporte ficaria cheia de "FIO A FIO REALISTA"
  // no lugar das pessoas.
  const c = acharColunas(CABECALHO_REAL);
  assert.equal(CABECALHO_REAL[c.nome!], "Nome");
  assert.equal(CABECALHO_REAL[c.produto!], "Nome do Produto");
  assert.equal(CABECALHO_REAL[c.email!], "Email");
  assert.equal(CABECALHO_REAL[c.situacao!], "Status");
});

test("a data é a da VENDA, não a de confirmação", () => {
  const c = acharColunas(CABECALHO_REAL);
  assert.equal(CABECALHO_REAL[c.data!], "Data de Venda");
});

test("uma coluna serve a um campo só", () => {
  // ⚠️ Sem isto, "Nome do Produto" era produto E nome ao mesmo tempo — e o
  // erro passava despercebido porque os dois campos ficavam preenchidos.
  const c = acharColunas(CABECALHO_REAL);
  const indices = Object.values(c);
  assert.equal(new Set(indices).size, indices.length);
});

test("data com segundos, como vem no arquivo real", () => {
  assert.match(lerData("28/12/2020 20:41:03")!, /^2020-12-28T20:41/);
});

/* ── agrupar antes de gravar ─────────────────────────────────────────────── */

test("agrupa por e-mail — uma escrita por pessoa, não por linha", () => {
  // ⚠️ O arquivo real tem 12.358 linhas e 8.477 e-mails. Linha por linha
  // seriam ~25 mil idas ao banco em sequência, e o tempo limite estoura NO
  // MEIO: metade das alunas importada, sem ninguém saber quais.
  const g = agruparPorEmail([
    { email: "ana@x.com", produto: "Nanofios", compradaEm: "2025-01-01T00:00:00Z", situacao: "completo" },
    { email: "ana@x.com", produto: "Shadow", compradaEm: "2026-01-01T00:00:00Z", situacao: "completo" },
    { email: "bia@x.com", produto: "Nanofios", compradaEm: "2024-01-01T00:00:00Z", situacao: "completo" },
  ]);
  assert.equal(g.length, 2);
  assert.equal(g.find((x) => x.email === "ana@x.com")!.compras.length, 2);
});

test("mesmo curso duas vezes: vale a compra MAIS RECENTE", () => {
  // ⚠️ Contar da primeira diria que venceu quem ainda tem acesso.
  const g = agruparPorEmail([
    { email: "ana@x.com", produto: "Nanofios", compradaEm: "2024-01-01T00:00:00Z", situacao: "completo" },
    { email: "ana@x.com", produto: "nanofios", compradaEm: "2026-05-01T00:00:00Z", situacao: "completo" },
  ]);
  assert.equal(g[0]!.compras.length, 1, "produto igual com caixa diferente é o mesmo produto");
  assert.match(g[0]!.compras[0]!.compradaEm, /^2026-05/);
});

test("e-mail com maiúscula é a mesma pessoa", () => {
  const g = agruparPorEmail([
    { email: "Ana@X.com", produto: "A", compradaEm: "2025-01-01T00:00:00Z", situacao: "completo" },
    { email: "ana@x.com", produto: "B", compradaEm: "2025-01-01T00:00:00Z", situacao: "completo" },
  ]);
  assert.equal(g.length, 1);
  assert.equal(g[0]!.email, "ana@x.com");
});

test("os lotes cobrem tudo, sem repetir nem perder", () => {
  const l = emLotes([1, 2, 3, 4, 5], 2);
  assert.deepEqual(l, [[1, 2], [3, 4], [5]]);
  assert.deepEqual(emLotes([], 10), []);
  assert.equal(emLotes(Array.from({ length: 8477 }, (_, i) => i), 300).flat().length, 8477);
});
