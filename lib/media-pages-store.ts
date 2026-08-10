import "server-only";
import { kvGet, kvSet } from "./storage";
import type { MediaPage } from "./media-types";
import { limparNome } from "./media-nomes";

export type { MediaPage } from "./media-types";

const KEY = "media:pages";

/** Álbuns de arquivo técnico — existem pra nada faltar, mas ficam por último. */
const TECNICOS = new Set(["lp:sistema", "lp:espelho-wp"]);

function rank(p: MediaPage): number {
  if (TECNICOS.has(p.id)) return 2;
  return p.source === "manual" ? 0 : 1;
}

export async function listPages(): Promise<MediaPage[]> {
  // Decodifica na LEITURA, e não só na escrita: os nomes com "&#8211;" já
  // estão gravados assim no KV, e isso conserta sem precisar de migração.
  const pages = ((await kvGet<MediaPage[]>(KEY)) ?? []).map((p) => ({
    ...p,
    name: limparNome(p.name),
  }));
  // Manuais primeiro, depois o resto; cada grupo por nome. Os dois álbuns que
  // não são material do James (espelho do WP e arquivos de sistema) vão pro fim
  // — estão ali pra nada ficar faltando, não pra disputar a atenção.
  return [...pages].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

export async function getPage(id: string): Promise<MediaPage | null> {
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  return pages.find((p) => p.id === id) ?? null;
}

/** Cria uma página manual. Retorna a página criada. */
export async function createPage(
  name: string,
  newId: () => string
): Promise<MediaPage> {
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  const page: MediaPage = {
    id: `pg-${newId()}`,
    name: name.trim() || "Sem nome",
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  await kvSet(KEY, [...pages, page]);
  return page;
}

/**
 * Garante que existe a página da origem WP (id estável `wp:<domain>:<slug>`).
 * Atualiza o nome se mudou. Retorna o id da página.
 */
export async function ensureWpPage(
  domain: string,
  slug: string,
  name: string,
  at: string
): Promise<string> {
  const id = `wp:${domain}:${slug}`;
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  const cleanName = limparNome(name || slug) || slug;
  const existing = pages.find((p) => p.id === id);
  if (existing) {
    if (existing.name !== cleanName) {
      await kvSet(
        KEY,
        pages.map((p) => (p.id === id ? { ...p, name: cleanName } : p))
      );
    }
    return id;
  }
  const page: MediaPage = {
    id,
    name: cleanName,
    source: "wp",
    createdAt: at,
  };
  await kvSet(KEY, [...pages, page]);
  return id;
}

export async function renamePage(id: string, name: string): Promise<void> {
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    pages.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p))
  );
}

export async function deletePage(id: string): Promise<void> {
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    pages.filter((p) => p.id !== id)
  );
}

/**
 * Garante o grupo de uma LP (id estável `lp:<slug>`). Mesma ideia do
 * ensureWpPage, para as imagens que moram no repositório e não passam nem pelo
 * import do WP nem pelo upload.
 */
export async function ensureLpPage(
  slug: string,
  name: string,
  at: string
): Promise<string> {
  const id = `lp:${slug}`;
  const pages = (await kvGet<MediaPage[]>(KEY)) ?? [];
  const limpo = limparNome(name) || slug;
  const existing = pages.find((p) => p.id === id);
  if (existing) {
    if (existing.name !== limpo) {
      await kvSet(KEY, pages.map((p) => (p.id === id ? { ...p, name: limpo } : p)));
    }
    return id;
  }
  await kvSet(KEY, [...pages, { id, name: limpo, source: "lp", createdAt: at }]);
  return id;
}
