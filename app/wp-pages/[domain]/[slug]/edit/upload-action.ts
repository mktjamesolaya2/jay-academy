"use server";

import fs from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads/wp");

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadImageAction(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Arquivo inválido" };
  }
  if (file.size === 0) {
    return { ok: false, error: "Arquivo vazio" };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Arquivo maior que 10MB" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Tipo de arquivo deve ser imagem" };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name) || "";
  const base = sanitizeName(path.basename(file.name, ext)) || "img";
  const ts = Date.now();
  const filename = `${base}-${ts}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, buf);

  return { ok: true, url: `/uploads/wp/${filename}` };
}
