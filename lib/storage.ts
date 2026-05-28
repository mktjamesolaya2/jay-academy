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
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set(key, value);
    } catch {
      // ignora — não bloqueia user flow
    }
    return;
  }
  // Fallback filesystem
  try {
    const filePath = path.join(LOCAL_DATA, `${kvKeyToFile(key)}.json`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf-8");
  } catch {
    // Filesystem read-only (Vercel sem KV configurado) — falha silenciosa
  }
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
    } catch {
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
