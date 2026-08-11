import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { kvGet, kvSet } from "./storage";

/**
 * Guarda HTML editado pelas LPs nativas embutidas em /public/<slug>/.
 * Quando o KV tem entrada, ela prevalece sobre o arquivo de filesystem
 * gerado pelo build. Quando vazio, usa o filesystem (default visual).
 */

const KEY_PREFIX = "embedded-html:";

function kvKey(slug: string): string {
  return `${KEY_PREFIX}${slug}`;
}

/** Caminho do index.html buildado dentro de public/. */
export function baseFilePath(slug: string): string {
  return path.join(process.cwd(), "public", slug, "index.html");
}

/**
 * Resolve o HTML de uma LP de `lp-html/`: versão editada no painel se houver,
 * senão o arquivo do repositório.
 *
 * ⚠️ Consequência que precisa estar na cara do usuário: depois que alguém salva
 * pelo editor, **mexer no arquivo do repositório para de ter efeito** — o KV
 * passa na frente. A tela da LP avisa isso e oferece "voltar pro original"
 * (que é `resetEmbeddedHtml`).
 */
export async function resolveLpHtml(
  slug: string,
  file: string
): Promise<string | null> {
  const editado = await loadEditedEmbeddedHtml(slug);
  if (editado && editado.length > 0) return editado;
  try {
    return await fs.readFile(path.join(process.cwd(), "lp-html", file), "utf8");
  } catch {
    return null;
  }
}

/** Esta página está sendo servida da versão do painel, e não do repositório? */
export async function temVersaoEditada(slug: string): Promise<boolean> {
  const editado = await loadEditedEmbeddedHtml(slug);
  return !!editado && editado.length > 0;
}

/**
 * Export do Elementor não pode passar pelo editor visual.
 *
 * Essas páginas têm 60–80 scripts que montam carrossel, popup e o próprio
 * formulário DEPOIS que a página carrega. O editor salva o corpo como ele está
 * no momento — ou seja, o estado já mexido pelo JS —, e recarregar isso duplica
 * elemento e mata o formulário. Numa página de venda isso é perder lead.
 */
export function ehExportElementor(html: string): boolean {
  return (html.match(/elementor/gi) ?? []).length > 50;
}

/** Lê do filesystem o HTML default (do último build). */
export async function loadBaseEmbeddedHtml(slug: string): Promise<string | null> {
  try {
    return await fs.readFile(baseFilePath(slug), "utf8");
  } catch {
    return null;
  }
}

/** Lê o HTML editado do KV, se houver. */
export async function loadEditedEmbeddedHtml(
  slug: string
): Promise<string | null> {
  return await kvGet<string>(kvKey(slug));
}

/** Resolve qual HTML servir: editado se houver, senão o do filesystem. */
export async function resolveEmbeddedHtml(
  slug: string
): Promise<string | null> {
  const edited = await loadEditedEmbeddedHtml(slug);
  // String vazia = override removido → cai pro filesystem
  if (edited && edited.length > 0) return edited;
  return await loadBaseEmbeddedHtml(slug);
}

/** Salva HTML editado no KV. */
export async function saveEmbeddedHtml(
  slug: string,
  html: string
): Promise<void> {
  await kvSet(kvKey(slug), html);
}

/** Restaura o HTML para o default do build (apaga override). */
export async function resetEmbeddedHtml(slug: string): Promise<void> {
  // Não temos kvDel exposto aqui — sobrescrevemos com string vazia e o
  // resolver volta a usar o filesystem (loadEditedEmbeddedHtml retorna "")
  // então preferimos string vazia ser tratada como ausência.
  await kvSet(kvKey(slug), "");
}
