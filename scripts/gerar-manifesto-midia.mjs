/**
 * Lista TODA imagem e vídeo que mora em public/ e grava em lib/midia-assets.json.
 *
 * POR QUE UM MANIFESTO, e não ler a pasta na hora: os arquivos de public/ são
 * servidos pela CDN e não estão garantidamente no disco da função serverless
 * na Vercel. Ler com `fs` funcionaria no localhost e devolveria zero em
 * produção. Gerando na build, o JSON vira um import comum e funciona nos dois.
 *
 * Roda sozinho antes de `npm run build` (script `prebuild`), então a biblioteca
 * de mídia acompanha o repositório sem ninguém precisar lembrar: arquivo novo
 * commitado = arquivo novo na galeria no primeiro acesso depois do deploy.
 *
 * ⚠️ Antes isto varria só public/lp/ e pulava wp-content. Ficavam de fora 590
 * arquivos — as imagens da Profissão Remove (que moram em wp-content/uploads),
 * PMU CLASS, Magic Shadow, JAY.O Laser, as páginas recriadas e o espelho do
 * WordPress. James: "não quero imagens faltando". Não voltar a estreitar.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { semVariantes } from "./variantes.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = path.join(RAIZ, "public");
const SAIDA = path.join(RAIZ, "lib", "midia-assets.json");

/** Pastas de build/dependência: nunca são material. */
const IGNORAR = /^(_next|node_modules|\.git)(\/|$)/;
const MIDIA = /\.(jpe?g|png|webp|gif|svg|avif|mp4|webm|mov|m4v)$/i;

/**
 * Chapa de plugin, ícone de tema, bandeira, sprite de cache — não é foto do
 * James. ⚠️ `uploads` só é técnico na RAIZ (public/uploads/wp é o depósito do
 * dev local): `wp-content/uploads/` é justamente onde moram as fotos de
 * verdade das páginas copiadas do WordPress.
 */
const TECNICO = [
  /^(wp-plugins|uploads)\//i,
  /\/(plugins|wp-includes|cache|flagcdn|fonts)\//i,
];

/**
 * A que álbum o arquivo pertence. Um slug por álbum; o nome bonito é resolvido
 * na hora de sincronizar (lib/media-repo-sync.ts).
 */
function grupoDe(rel) {
  const [primeiro, segundo] = rel.split("/");
  // O espelho do WP tem tratamento próprio: a maior parte já está na biblioteca
  // pela importação, com id derivado da URL original.
  if (primeiro === "wpmirror") return "espelho-wp";
  if (TECNICO.some((re) => re.test(rel))) return "sistema";
  if (primeiro === "lp" && segundo) return segundo;
  if (primeiro === "recriadas" && segundo) return `recriada-${segundo}`;
  // a pasta é "magicshadow", o cadastro da LP é "magic-shadow"
  if (primeiro === "magicshadow") return "magic-shadow";
  return primeiro;
}

function varrer(dir, rel = "") {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (IGNORAR.test(r)) return [];
    if (e.isDirectory()) return varrer(path.join(dir, e.name), r);
    if (!MIDIA.test(e.name)) return [];
    return [
      {
        g: grupoDe(r),
        url: "/" + r,
        nome: e.name,
        tamanho: fs.statSync(path.join(dir, e.name)).size,
      },
    ];
  });
}

const todos = varrer(BASE);
const arquivos = semVariantes(todos).sort((a, b) => a.url.localeCompare(b.url));

// A marca muda quando entra, sai ou muda de tamanho qualquer arquivo. É ela que
// faz a galeria se sincronizar sozinha depois de um deploy, sem ninguém clicar.
const marca = createHash("sha1")
  .update(arquivos.map((a) => `${a.url}:${a.tamanho}`).join("\n"))
  .digest("hex")
  .slice(0, 16);

fs.writeFileSync(SAIDA, JSON.stringify({ marca, arquivos }, null, 0) + "\n");

const porGrupo = arquivos.reduce((m, a) => ((m[a.g] = (m[a.g] || 0) + 1), m), {});
console.log(
  `lib/midia-assets.json — ${arquivos.length} arquivos em ${Object.keys(porGrupo).length} álbuns ` +
    `(${todos.length - arquivos.length} miniaturas do WP colapsadas, marca ${marca})`
);
console.log(
  Object.entries(porGrupo)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `  ${String(n).padStart(4)}  ${k}`)
    .join("\n")
);
