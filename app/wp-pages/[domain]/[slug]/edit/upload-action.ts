"use server";

import { blobUpload } from "@/lib/storage";

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

  const ext = file.name.includes(".") ? "." + file.name.split(".").pop() : "";
  const base =
    sanitizeName(file.name.replace(/\.[^.]+$/, "")) || "img";
  const filename = `${base}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await blobUpload(filename, buffer, file.type);
  return { ok: true, url: result.url };
}
