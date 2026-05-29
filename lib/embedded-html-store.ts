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
