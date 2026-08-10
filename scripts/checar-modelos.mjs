/**
 * Confere a cadeia de modelos do chat do PMU CLASS contra o catálogo público
 * da OpenRouter. NÃO precisa de chave de API — a lista de modelos é aberta.
 *
 * Existe porque em 17/07 o chat estava lento e caindo, e a causa era ID de
 * modelo aposentado: a rota tenta o próximo em silêncio, então o defeito não
 * aparece em lugar nenhum. Rodar quando o chat der sinal de lentidão ou erro.
 *
 *   npm run checar-modelos
 *
 * Sai com código 1 se algum ID da cadeia não existir — dá pra pendurar num CI.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Lê os IDs do lib/chat-models.ts sem precisar compilar TypeScript. */
function cadeiaDoArquivo() {
  const fonte = readFileSync(path.join(RAIZ, "lib", "chat-models.ts"), "utf8");
  const bloco = fonte.match(/MODEL_CHAIN\s*=\s*\[([\s\S]*?)\]/);
  if (!bloco) throw new Error("não achei MODEL_CHAIN em lib/chat-models.ts");
  return [...bloco[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const cadeia = cadeiaDoArquivo();
console.log(`cadeia atual (${cadeia.length} modelos):\n`);

const resp = await fetch("https://openrouter.ai/api/v1/models");
if (!resp.ok) {
  console.error(`não consegui listar os modelos da OpenRouter: ${resp.status}`);
  process.exit(2);
}
const { data } = await resp.json();
const existentes = new Set(data.map((m) => m.id));

let mortos = 0;
for (const id of cadeia) {
  const ok = existentes.has(id);
  if (!ok) mortos++;
  console.log(`  ${ok ? "ok" : "MORTO"}  ${id}`);
}

if (mortos) {
  const livres = data
    .filter((m) => m.id.endsWith(":free"))
    .sort((a, b) => (b.context_length || 0) - (a.context_length || 0))
    .slice(0, 8)
    .map((m) => `    ${String(m.context_length).padStart(8)}  ${m.id}`);
  console.error(
    `\n${mortos} modelo(s) da cadeia não existem mais. Toda conversa gasta uma ` +
      `chamada falha em cada um antes de chegar num que funciona.\n` +
      `\nSubstitutos gratuitos com mais contexto hoje:\n${livres.join("\n")}\n` +
      `\nCorrigir em lib/chat-models.ts.`
  );
  process.exit(1);
}

console.log(`\ntodos os ${cadeia.length} modelos da cadeia existem.`);
