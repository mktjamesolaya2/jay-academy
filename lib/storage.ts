import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Camada de abstração de storage.
 *
 * Em produção (Vercel): usa @vercel/kv (Redis) + @vercel/blob.
 * Em desenvolvimento (sem env vars): fallback pra filesystem local.
 *
 * Detecção: verifica KV_REST_API_URL — se existe, está em modo Vercel.
 */

const HAS_KV =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// Storage S3-compatível (Supabase Storage, Cloudflare R2, Backblaze B2, AWS S3…).
// Genérico: basta setar as envs S3_*. Quando configurado, é o destino preferencial
// dos uploads (à frente do Vercel Blob). Aceita também os nomes R2_* (compat).
// Lê env var e LIMPA espaços/quebras de linha (evita header inválido na assinatura
// quando o valor é colado com um \n no fim).
const env = (...names: string[]): string => {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  return "";
};

const S3 = {
  endpoint: (
    env("S3_ENDPOINT") ||
    (env("R2_ACCOUNT_ID")
      ? `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`
      : "")
  ).replace(/\/$/, ""),
  region: env("S3_REGION", "R2_REGION") || "auto",
  accessKeyId: env("S3_ACCESS_KEY_ID", "R2_ACCESS_KEY_ID"),
  secretAccessKey: env("S3_SECRET_ACCESS_KEY", "R2_SECRET_ACCESS_KEY"),
  bucket: env("S3_BUCKET", "R2_BUCKET"),
  publicUrl: env("S3_PUBLIC_URL", "R2_PUBLIC_URL").replace(/\/$/, ""),
};
const HAS_S3 =
  !!S3.endpoint &&
  !!S3.accessKeyId &&
  !!S3.secretAccessKey &&
  !!S3.bucket &&
  !!S3.publicUrl;

const LOCAL_DATA = path.resolve(process.cwd(), "data");
const LOCAL_UPLOADS = path.resolve(process.cwd(), "public/uploads/wp");

// ─────────────────────────────────────────────
// KV Operations
// ─────────────────────────────────────────────

export async function kvGet<T>(key: string): Promise<T | null> {
  if (HAS_KV) {
    try {
      const { kv } = await import("@vercel/kv");
      const value = await kv.get<T>(key);
      return value;
    } catch {
      return null;
    }
  }
  // Fallback filesystem
  try {
    const filePath = path.join(LOCAL_DATA, `${kvKeyToFile(key)}.json`);
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (HAS_KV) {
    // NÃO engole mais o erro: se a gravação falhar, deixa estourar pra quem
    // salvou saber (evita o "Salvo" fantasma — mostrar sucesso e perder o dado).
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value);
    return;
  }
  // Fallback filesystem (dev local) — também propaga o erro.
  const filePath = path.join(LOCAL_DATA, `${kvKeyToFile(key)}.json`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
}

export async function kvDel(key: string): Promise<void> {
  if (HAS_KV) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.del(key);
    } catch {
      // ignora
    }
    return;
  }
  try {
    const filePath = path.join(LOCAL_DATA, `${kvKeyToFile(key)}.json`);
    await fs.unlink(filePath);
  } catch {
    // ok
  }
}

export async function kvKeys(pattern: string): Promise<string[]> {
  if (HAS_KV) {
    try {
      const { kv } = await import("@vercel/kv");
      return await kv.keys(pattern);
    } catch (e) {
      // Não mascarar falha de KV como "nenhuma chave" — logar antes do fallback.
      console.error(`[storage] kvKeys("${pattern}") falhou:`, e);
      return [];
    }
  }
  // Fallback filesystem
  try {
    const files = await fs.readdir(LOCAL_DATA, { withFileTypes: true });
    return files
      .filter((f) => f.isFile() && f.name.endsWith(".json"))
      .map((f) => f.name.replace(/\.json$/, "").replace(/_/g, ":"))
      .filter((key) => key.startsWith(pattern.replace(/\*$/, "")));
  } catch {
    return [];
  }
}

/**
 * Contador atômico com TTL — base do rate-limit (lib/rate-limit.ts). Incrementa
 * a chave e, na primeira vez, define expiração da janela. No fallback local
 * (sem KV) retorna sempre 1 (limiter no-op — dev não tem tráfego pra limitar).
 */
export async function kvIncr(key: string, windowSec: number): Promise<number> {
  if (HAS_KV) {
    try {
      const { kv } = await import("@vercel/kv");
      const n = await kv.incr(key);
      if (n === 1) await kv.expire(key, windowSec);
      return n;
    } catch {
      return 1; // falha do KV não pode derrubar o endpoint — não limita
    }
  }
  return 1;
}

/**
 * Lê várias chaves de uma vez. No Vercel KV vira `kv.mget` — mas EM LOTES: um
 * único mget sobre dezenas de valores grandes (ex: páginas WP com fullHtml de
 * ~250KB) estoura o limite de resposta do Upstash e lança, o que antes virava
 * "tudo null" silencioso e sumia com as páginas no painel. Fatiar em lotes
 * mantém cada resposta abaixo do teto. No fallback local lê em paralelo.
 */
const MGET_BATCH = 10;

export async function kvMget<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];
  if (HAS_KV) {
    try {
      const { kv } = await import("@vercel/kv");
      const out: (T | null)[] = [];
      for (let i = 0; i < keys.length; i += MGET_BATCH) {
        const batch = keys.slice(i, i + MGET_BATCH);
        const values = await kv.mget<T[]>(...batch);
        out.push(...values);
      }
      return out;
    } catch (e) {
      // Não mascarar falha de KV como "0 páginas" — logar antes do fallback.
      console.error(`[storage] kvMget de ${keys.length} chaves falhou:`, e);
      return keys.map(() => null);
    }
  }
  // Fallback filesystem: sem mget nativo, lê em paralelo.
  return Promise.all(keys.map((k) => kvGet<T>(k)));
}

function kvKeyToFile(key: string): string {
  // Converte "wp:content:main:slug" → "wp_content_main_slug"
  return key.replace(/:/g, "_");
}

// ─────────────────────────────────────────────
// Blob Operations (uploads)
// ─────────────────────────────────────────────

export async function blobUpload(
  filename: string,
  data: Buffer | Uint8Array,
  contentType?: string
): Promise<{ url: string }> {
  // Normaliza pra Buffer (funciona em ambos os caminhos)
  const buf: Buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

  // Storage S3-compatível (Supabase/R2/…) — preferencial quando configurado
  if (HAS_S3) {
    const { AwsClient } = await import("aws4fetch");
    const { randomBytes } = await import("node:crypto");
    const client = new AwsClient({
      accessKeyId: S3.accessKeyId,
      secretAccessKey: S3.secretAccessKey,
      service: "s3",
      region: S3.region,
    });
    // Sufixo aleatório (igual ao addRandomSuffix do Blob) pra evitar colisão.
    const suffix = randomBytes(5).toString("hex");
    const dot = filename.lastIndexOf(".");
    const key =
      dot > -1
        ? `${filename.slice(0, dot)}-${suffix}${filename.slice(dot)}`
        : `${filename}-${suffix}`;
    const endpoint = `${S3.endpoint}/${S3.bucket}/${encodeURI(key)}`;
    const res = await client.fetch(endpoint, {
      method: "PUT",
      body: new Uint8Array(buf),
      headers: { "Content-Type": contentType || "application/octet-stream" },
    });
    if (!res.ok) {
      throw new Error(`S3 upload falhou: ${res.status} ${await res.text()}`);
    }
    return { url: `${S3.publicUrl}/${key}` };
  }

  if (HAS_BLOB) {
    const { put } = await import("@vercel/blob");
    const result = await put(filename, buf, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return { url: result.url };
  }
  // Fallback filesystem (dev local)
  await fs.mkdir(LOCAL_UPLOADS, { recursive: true });
  const filePath = path.join(LOCAL_UPLOADS, filename);
  await fs.writeFile(filePath, buf);
  return { url: `/uploads/wp/${filename}` };
}

export function isVercel(): boolean {
  return HAS_KV;
}
