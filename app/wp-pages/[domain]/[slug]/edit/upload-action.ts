"use server";

import { blobUpload } from "@/lib/storage";
import { requireAdmin } from "@/lib/auth";
import { rateLimitByIp, clientIpFromHeaders } from "@/lib/rate-limit";

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
  // Era a única server action de escrita sem checagem própria. O Next só
  // despacha ela nas 3 rotas que a importam (/lps/…/build, /lps/…/edit-visual,
  // /wp-pages/…/edit), todas atrás do middleware — então anônimo não chegava
  // aqui. Mas QUALQUER usuário logado chegava, inclusive `viewer`, que é
  // read-only. requireAdmin fecha isso e vale como defesa em profundidade se
  // um dia a ação for importada por uma página pública.
  await requireAdmin();

  // Teto por IP: sem isso, uma conta comprometida enche o bucket sem limite.
  const ip = await clientIpFromHeaders();
  if (!(await rateLimitByIp("upload-image", ip, 60, 60)).ok) {
    return { ok: false, error: "Muitos uploads seguidos. Espere um minuto." };
  }

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
