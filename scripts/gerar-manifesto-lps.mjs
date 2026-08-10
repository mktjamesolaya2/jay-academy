/**
 * Lista as imagens e vídeos que moram em public/lp/ e grava em
 * lib/lp-assets.json.
 *
 * POR QUE UM MANIFESTO, e não ler a pasta na hora: os arquivos de public/ são
 * servidos pela CDN e não estão garantidamente no disco da função serverless
 * na Vercel. Ler com `fs` funcionaria no localhost e devolveria zero em
 * produção. Gerando na build, o JSON vira um import comum e funciona nos dois.
 *
 * Roda sozinho antes de `npm run build` (script `prebuild`), então a
 * biblioteca de mídia acompanha o repositório sem ninguém precisar lembrar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = path.join(RAIZ, "public", "lp");
const SAIDA = path.join(RAIZ, "lib", "lp-assets.json");

/** Resíduo de migração do WordPress — não é material da casa. */
const PULAR = /[\\/](wp-content|wp-includes|cache|flagcdn|node_modules|_next)[\\/]/i;
const MIDIA = /\.(jpe?g|png|webp|gif|svg|avif|mp4|webm)$/i;

function varrer(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (PULAR.test(p + path.sep)) return [];
    if (e.isDirectory()) return varrer(p);
    return MIDIA.test(e.name) ? [p] : [];
  });
}

const arquivos = varrer(BASE)
  .map((p) => {
    const rel = path.relative(BASE, p).replaceAll("\\", "/");
    return {
      lp: rel.split("/")[0],
      url: `/lp/${rel}`,
      nome: path.basename(rel),
      tamanho: fs.statSync(p).size,
    };
  })
  .sort((a, b) => a.url.localeCompare(b.url));

fs.writeFileSync(SAIDA, JSON.stringify(arquivos, null, 0) + "\n");

const porLp = arquivos.reduce((m, a) => ((m[a.lp] = (m[a.lp] || 0) + 1), m), {});
console.log(
  `lib/lp-assets.json — ${arquivos.length} arquivos em ${Object.keys(porLp).length} LPs: ` +
    Object.entries(porLp).map(([k, n]) => `${k} (${n})`).join(", ")
);
