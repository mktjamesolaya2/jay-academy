/**
 * Lê o relatório de vendas exportado do painel da Hotmart.
 *
 * ⚠️ Existe porque a API de vendas está **barrada** pra nossa conta (400 em
 * todos os endereços de `/sales/`, enquanto o `subscriptions` responde 200 com
 * a mesma credencial). Sem ela, o suporte só enxerga compra que passou pelo
 * webhook — ou seja, feita depois que a gente conectou. Toda aluna antiga é
 * invisível, e é justamente ela quem escreve dizendo "não consigo acessar".
 *
 * O painel exporta o mesmo dado em CSV, sem depender de permissão nenhuma.
 * Um cobre o passado, o outro o presente.
 *
 * ⚠️ **Nada aqui adivinha em silêncio.** O leitor devolve quais colunas ele
 * entendeu e quantas linhas ele descartou, pra tela mostrar isso ANTES de
 * gravar. Um importador que engole o arquivo e diz "pronto!" é o jeito mais
 * fácil de encher o banco de lixo sem ninguém perceber.
 */

export type LinhaDeCompra = {
  email: string;
  nome?: string;
  produto: string;
  /** ISO. */
  compradaEm: string;
  situacao: string;
};

export type LeituraDoCsv = {
  compras: LinhaDeCompra[];
  /** Qual coluna do arquivo virou cada campo — a tela mostra pra conferência. */
  colunas: Record<string, string | null>;
  /** Linhas que não viraram compra, e por quê. */
  descartadas: Array<{ linha: number; motivo: string }>;
};

/* ── o formato do arquivo ────────────────────────────────────────────────── */

/**
 * Acha o separador.
 *
 * ⚠️ Exportação brasileira costuma vir com **ponto e vírgula**, porque a
 * vírgula já é o separador decimal. Assumir vírgula faria o arquivo inteiro
 * virar uma coluna só — e o erro apareceria como "nenhuma compra encontrada",
 * que manda procurar no lugar errado.
 */
export function acharSeparador(cabecalho: string): string {
  const candidatos = [";", ",", "\t"];
  let melhor = ";";
  let maior = -1;
  for (const c of candidatos) {
    const n = partirLinha(cabecalho, c).length;
    if (n > maior) {
      maior = n;
      melhor = c;
    }
  }
  return melhor;
}

/**
 * Parte uma linha respeitando aspas.
 *
 * ⚠️ Nome de produto tem vírgula ("Nanofios, do zero ao avançado") e vem entre
 * aspas por causa disso. Partir no braço desalinharia todas as colunas a
 * partir dali — e o e-mail viraria a data.
 */
export function partirLinha(linha: string, sep: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      // Aspas dobradas dentro do campo viram uma aspa literal.
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
      continue;
    }
    if (c === sep && !dentroDeAspas) {
      campos.push(atual.trim());
      atual = "";
      continue;
    }
    atual += c;
  }
  campos.push(atual.trim());
  return campos;
}

/* ── as colunas ──────────────────────────────────────────────────────────── */

/**
 * Que coluna é cada uma.
 *
 * ⚠️ Por PEDAÇO do nome, não por nome exato. A Hotmart muda o cabeçalho entre
 * versões e entre idiomas ("Email do comprador", "E-mail", "Buyer email"), e um
 * importador que só aceita o nome exato quebra no dia em que mudarem uma
 * palavra — sem avisar por quê.
 */
const APELIDOS = {
  email: ["email do comprador", "e-mail do comprador", "buyer email", "email", "e-mail"],
  nome: ["nome do comprador", "comprador", "buyer name", "cliente", "nome"],
  produto: ["produto", "nome do produto", "product"],
  data: [
    "data da compra",
    "data de compra",
    "data da transação",
    "data da transacao",
    "order date",
    "data",
  ],
  situacao: ["status da transação", "status da transacao", "status", "situação", "situacao"],
} as const;

export function acharColunas(cabecalho: string[]): Record<string, number> {
  const limpo = cabecalho.map((c) => tirarAcento(c.toLowerCase().trim()));
  const achadas: Record<string, number> = {};
  const usadas = new Set<number>();

  for (const [campo, apelidos] of Object.entries(APELIDOS)) {
    for (const apelido of apelidos) {
      const alvo = tirarAcento(apelido);
      // ⚠️ Nome EXATO primeiro, pedaço do nome depois. O arquivo de verdade
      // tem "Nome do Produto" ANTES de "Nome", e procurando só por pedaço o
      // nome da aluna virava o nome do curso — a caixa do suporte inteira
      // ficaria cheia de "FIO A FIO REALISTA" no lugar das pessoas.
      let i = limpo.findIndex((c, n) => c === alvo && !usadas.has(n));
      if (i === -1) i = limpo.findIndex((c, n) => c.includes(alvo) && !usadas.has(n));
      if (i !== -1) {
        achadas[campo] = i;
        // ⚠️ Uma coluna serve a UM campo. Sem isto, "Nome do Produto" era
        // produto e nome ao mesmo tempo, e o erro passava despercebido porque
        // os dois campos ficavam preenchidos.
        usadas.add(i);
        break;
      }
    }
  }
  return achadas;
}

function tirarAcento(s: string): string {
  // ⚠️ O intervalo vai escrito por código (`̀-ͯ`), e não com os
  // caracteres em si: são acentos soltos, invisíveis no editor, e qualquer
  // reencodação do arquivo os transformaria em outra coisa sem ninguém ver.
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/* ── a data ──────────────────────────────────────────────────────────────── */

/**
 * A data da compra, em ISO.
 *
 * ⚠️ Aceita `dd/mm/aaaa` porque é o que o painel brasileiro exporta — e
 * `new Date("05/08/2026")` leria isso como **5 de agosto** em ISO e como
 * **8 de maio** no formato americano. Três meses de diferença decidem se o
 * acesso de 12 meses venceu ou não.
 */
export function lerData(bruto: string): string | null {
  const t = (bruto ?? "").trim();
  if (!t) return null;

  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (br) {
    const [, d, m, a, h = "12", min = "00"] = br;
    const data = new Date(
      Date.UTC(+a, +m - 1, +d, +h, +min)
    );
    return isNaN(data.getTime()) ? null : data.toISOString();
  }

  const iso = new Date(t);
  return isNaN(iso.getTime()) ? null : iso.toISOString();
}

/* ── o arquivo inteiro ───────────────────────────────────────────────────── */

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function lerCsv(texto: string): LeituraDoCsv {
  // O BOM do Excel gruda no primeiro cabeçalho e faz "Email" virar "﻿Email".
  const limpo = texto.replace(/^﻿/, "");
  const linhas = limpo.split(/\r?\n/).filter((l) => l.trim());
  if (!linhas.length) {
    return { compras: [], colunas: {}, descartadas: [] };
  }

  const sep = acharSeparador(linhas[0]!);
  const cabecalho = partirLinha(linhas[0]!, sep);
  const col = acharColunas(cabecalho);

  const colunas: Record<string, string | null> = {};
  for (const campo of Object.keys(APELIDOS)) {
    colunas[campo] = col[campo] !== undefined ? cabecalho[col[campo]!]! : null;
  }

  const compras: LinhaDeCompra[] = [];
  const descartadas: Array<{ linha: number; motivo: string }> = [];

  for (let i = 1; i < linhas.length; i++) {
    const campos = partirLinha(linhas[i]!, sep);
    const pegar = (campo: string) =>
      col[campo] !== undefined ? (campos[col[campo]!] ?? "").trim() : "";

    const email = pegar("email").toLowerCase();
    if (!EMAIL.test(email)) {
      descartadas.push({ linha: i + 1, motivo: email ? `e-mail inválido: ${email}` : "sem e-mail" });
      continue;
    }
    const compradaEm = lerData(pegar("data"));
    if (!compradaEm) {
      // ⚠️ Sem data não dá pra calcular os 12 meses — e uma compra sem prazo
      // faria a IA dizer "está tudo certo" pra quem já venceu.
      descartadas.push({ linha: i + 1, motivo: "sem data de compra reconhecível" });
      continue;
    }

    compras.push({
      email,
      nome: pegar("nome") || undefined,
      produto: pegar("produto") || "curso",
      compradaEm,
      situacao: (pegar("situacao") || "aprovada").toLowerCase(),
    });
  }

  return { compras, colunas, descartadas };
}
