// Heurística: depois de tirar script/style/tags, sobra texto visível suficiente?
// Casca de SPA (#root/#__next vazios) ou "enable JavaScript" => vazia.
export function looksEmpty(html: string): boolean {
  const emptyRoot = /<div[^>]+id=["'](root|__next|app)["'][^>]*>\s*<\/div>/i.test(html);
  const needsJs = /enable JavaScript|habilite o JavaScript/i.test(html);
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tooShort = text.length < 200;
  // Vazia se: é casca de SPA, OU pede JS explicitamente, OU quase não tem texto.
  return emptyRoot || needsJs || tooShort;
}

// Content-Type é HTML (ou desconhecido — deixa passar) vs. arquivo binário/PDF/imagem.
export function isHtmlContentType(ct: string | null): boolean {
  if (!ct) return true; // desconhecido: permite (ex: servidores sem header)
  return /text\/html|application\/xhtml/i.test(ct);
}

// Descobre o charset da página: 1º do header Content-Type, senão do <meta charset>
// no começo do HTML, senão utf-8. Sem isso, um site em ISO-8859-1/windows-1252
// (comum em CMS antigos BR/ES) vira mojibake ("Ã§Ã£o") ao decodificar como utf-8.
export function detectCharset(headerCt: string | null, headSample: string): string {
  const fromHeader = headerCt?.match(/charset=["']?([\w-]+)/i)?.[1];
  if (fromHeader) return fromHeader.toLowerCase();
  const fromMeta =
    headSample.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ||
    headSample.match(/charset=["']?([\w-]+)/i)?.[1];
  return (fromMeta || "utf-8").toLowerCase();
}

// Parte 2 — orquestra; NÃO importa headless-fetch no topo do arquivo
// pra manter looksEmpty testável sem "server-only".
const UA = "Mozilla/5.0 (compatible; jayacademy-portal-copy/1.0)";

/** Lê o corpo da resposta em stream, abortando se passar de `max` bytes (não
 * bufferiza o corpo inteiro — evita OOM em servidor sem/mentindo Content-Length). */
async function readCapped(res: Response, max: number): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > max)
      throw new Error("Página grande demais para copiar (limite ~15MB)");
    return buf;
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > max) {
        await reader.cancel().catch(() => {});
        throw new Error("Página grande demais para copiar (limite ~15MB)");
      }
      chunks.push(Buffer.from(value));
    }
  }
  return Buffer.concat(chunks);
}

export async function fetchAnyUrl(
  url: string,
  opts: { forceHeadless?: boolean } = {}
): Promise<{ html: string; finalUrl: string; usedHeadless: boolean }> {
  const runHeadless = async () => {
    const { renderHeadless } = await import("./headless-fetch");
    const { html, finalUrl } = await renderHeadless(url);
    return { html, finalUrl, usedHeadless: true };
  };

  if (opts.forceHeadless) return runHeadless();

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error("O site não respondeu a tempo (timeout) ou está fora do ar");
  }
  if (!res.ok) throw new Error(`O site respondeu ${res.status}`);
  const ct = res.headers.get("content-type");
  if (!isHtmlContentType(ct)) {
    throw new Error("O link não é uma página web (parece um arquivo/PDF/imagem)");
  }
  const MAX = 15 * 1024 * 1024;
  const len = Number(res.headers.get("content-length") || 0);
  if (len > MAX) {
    throw new Error("Página grande demais para copiar (limite ~15MB)");
  }
  // Lê em STREAM com teto: um servidor sem/mentindo Content-Length não pode
  // estourar a memória (arrayBuffer() sem limite baixaria o corpo inteiro antes
  // de checar, e um OOM mata o processo — perde o lote todo).
  const bytes = await readCapped(res, MAX);
  const headSample = bytes.subarray(0, 4096).toString("latin1");
  const charset = detectCharset(ct, headSample);
  let html: string;
  try {
    html = new TextDecoder(charset).decode(bytes);
  } catch {
    html = new TextDecoder("utf-8").decode(bytes); // charset exótico: cai no utf-8
  }
  if (looksEmpty(html)) return runHeadless();
  return { html, finalUrl: res.url || url, usedHeadless: false };
}
