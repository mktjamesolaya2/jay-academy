import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Descobre qual página pública um deploy alterou, a partir da mensagem de commit.
 *
 * O link do deploy na Vercel (`https://<deploy>.vercel.app`) aponta pra RAIZ
 * daquele build — por isso clicar sempre caía no começo do portal. Aqui a gente
 * infere a página pelo commit e devolve um caminho relativo (ex: "/jamesolaya"),
 * que abre a versão ATUAL em produção — nunca um snapshot antigo.
 */

const IGNORED = new Set(["api", "p", "[slug]"]);

let routeCache: string[] | null = null;

/** Pastas em app/ que expõem uma página pública (têm route.ts). */
async function publicRoutes(): Promise<string[]> {
  if (routeCache) return routeCache;

  const appDir = path.join(process.cwd(), "app");
  const found: string[] = [];

  try {
    const entries = await fs.readdir(appDir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        !entry.isDirectory() ||
        entry.name.startsWith("_") ||
        entry.name.startsWith("(") ||
        IGNORED.has(entry.name)
      ) {
        continue;
      }
      try {
        await fs.access(path.join(appDir, entry.name, "route.ts"));
        found.push(entry.name);
      } catch {
        // sem route.ts — não é página pública servida por rota
      }
    }
  } catch {
    return [];
  }

  routeCache = found;
  return found;
}

/** minúsculas, sem acento, só letras/números separados por espaço. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Retorna o caminho da página que o commit mexeu, ou null se não der pra inferir.
 * Quando mais de uma rota casa (ex: "basic-magic-shadow" e
 * "basic-magic-shadow-v2"), vence a mais específica — a de nome mais longo.
 */
export async function inferDeployPath(
  commitMessage?: string
): Promise<string | null> {
  if (!commitMessage) return null;

  const haystack = ` ${normalize(commitMessage)} `;
  const routes = await publicRoutes();

  let best: string | null = null;
  let bestLength = 0;

  for (const route of routes) {
    const needle = normalize(route);
    if (!needle) continue;

    if (haystack.includes(` ${needle} `) && needle.length > bestLength) {
      best = route;
      bestLength = needle.length;
    }
  }
  if (best) return `/${best}`;

  // Segunda passada: commits costumam citar só o miolo do nome
  // ("Deploy Profissao Remove" -> rota "curso-online-profissao-remove").
  // Vai tirando palavras do começo da rota e testa o que sobrou. O mínimo de
  // 10 caracteres evita casar com pedaços genéricos tipo "remove" ou "laser".
  for (const route of routes) {
    const words = normalize(route).split(" ");

    for (let start = 1; start < words.length; start++) {
      const tail = words.slice(start).join(" ");
      if (tail.length < 10) break;

      if (haystack.includes(` ${tail} `) && tail.length > bestLength) {
        best = route;
        bestLength = tail.length;
      }
    }
  }

  return best ? `/${best}` : null;
}
