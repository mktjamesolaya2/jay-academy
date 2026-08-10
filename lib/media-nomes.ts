/**
 * Limpeza de nome vindo do WordPress e escolha da capa de cada grupo da
 * biblioteca de mídia. Puro — sem "server-only", pra rodar no client também.
 */

const NOMEADAS: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", laquo: "«", raquo: "»",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

/**
 * Tira tags e DECODIFICA entidades HTML.
 *
 * ⚠️ O `ensureWpPage` só tirava as tags, então título de página do WP chegava
 * na tela como "[ACAO] JAYREMOVE Campanha &#8211; REMOVE_..." — o `&#8211;` é
 * um travessão. Aparecia cru em toda a galeria.
 */
export function limparNome(bruto: string): string {
  return bruto
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (todo, nome) => NOMEADAS[nome.toLowerCase()] ?? todo)
    .replace(/\s+/g, " ")
    .trim();
}

type Candidata = { url: string; type: string; size?: number; name?: string };

/** Ícone, logo, bandeirinha, pixel de rastreio — nada disso serve de capa. */
function ehEnfeite(c: Candidata): boolean {
  const alvo = `${c.url} ${c.name ?? ""}`.toLowerCase();
  if (/icon|favicon|logo|sprite|spinner|loader|placeholder|flag|badge|selo|1x1|pixel/.test(alvo)) return true;
  if (/\.(svg|gif|ico)(\?|$)/.test(alvo)) return true;
  // arquivo minúsculo é quase sempre enfeite; sem tamanho conhecido, não julga
  return typeof c.size === "number" && c.size < 12 * 1024;
}

/**
 * Escolhe a capa de um grupo.
 *
 * ⚠️ Antes era simplesmente a PRIMEIRA imagem do grupo, e o resultado eram
 * capas de despertador borrado e logo do PayPal — porque o primeiro arquivo de
 * uma página do WP costuma ser um ícone. Agora descarta enfeite e fica com o
 * arquivo mais pesado, que é o que mais parece a foto principal da página.
 */
export function escolherCapa<T extends Candidata>(itens: T[]): string | undefined {
  const imagens = itens.filter((i) => i.type === "image");
  if (imagens.length === 0) return undefined;
  const bons = imagens.filter((i) => !ehEnfeite(i));
  const pool = bons.length > 0 ? bons : imagens;
  return [...pool].sort((a, b) => (b.size ?? 0) - (a.size ?? 0))[0]?.url;
}
