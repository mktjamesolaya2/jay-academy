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

// Cloudflare R2 (S3-compatível) — 10GB grátis + banda grátis. Quando configurado,
// é o destino preferencial dos uploads (à frente do Vercel Blob).
const R2 = {
  accountId: process.env.R2_ACCOUNT_ID || "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  bucket: process.env.R2_BUCKET || "",
  publicUrl: (process.env.R2_PUBLIC_URL || "").replace(/\/$/, ""),
};
const HAS_R2 =
  !!R2.accountId &&
  !!R2.accessKeyId &&
  !!R2.secretAccessKey &&
  !!R2.bucket &&
  !!R2.publicUrl;

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

  // Cloudflare R2 (preferencial quando configurado)
  if (HAS_R2) {
    const { AwsClient } = await import("aws4fetch");
    const { randomBytes } = await import("node:crypto");
    const client = new AwsClient({
      accessKeyId: R2.accessKeyId,
      secretAccessKey: R2.secretAccessKey,
      service: "s3",
      region: "auto",
    });
    // Sufixo aleatório (igual ao addRandomSuffix do Blob) pra evitar colisão.
    const suffix = randomBytes(5).toString("hex");
    const dot = filename.lastIndexOf(".");
    const key =
      dot > -1
        ? `${filename.slice(0, dot)}-${suffix}${filename.slice(dot)}`
        : `${filename}-${suffix}`;
    const endpoint = `https://${R2.accountId}.r2.cloudflarestorage.com/${R2.bucket}/${encodeURI(
      key
    )}`;
    const res = await client.fetch(endpoint, {
      method: "PUT",
      body: new Uint8Array(buf),
      headers: { "Content-Type": contentType || "application/octet-stream" },
    });
    if (!res.ok) {
      throw new Error(`R2 upload falhou: ${res.status} ${await res.text()}`);
    }
    return { url: `${R2.publicUrl}/${key}` };
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
