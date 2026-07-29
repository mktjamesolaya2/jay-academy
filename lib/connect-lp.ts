"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

const MARKER = "  // __INSERT_LP_HERE__";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// Esta ação INTERPOLA os campos dentro de um arquivo .ts do repositório, então
// escapar aspas e barras não basta: uma quebra de linha (ou caractere de
// controle) fecha a string e injeta código no landing-pages.ts. Achatamos
// controles em espaço ANTES de escapar.
function escape(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

/** slug e nome de pasta: só minúsculas, números e hífen. */
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;
/** Caminho local da LP: sem "..", sem barra invertida, sem controle. */
const SAFE_PATH = /^[A-Za-z0-9._\-/ ]+$/;

const ALLOWED_ACCENTS = [
  "pink-orange",
  "purple-fuchsia",
  "amber-orange",
  "gold-black",
  "rose",
] as const;

export async function connectLp(formData: FormData) {
  // Escreve num arquivo do repositório — só admin. A rota /lps/connect já fica
  // atrás do middleware, mas isso barra também o `viewer`, que é read-only.
  await requireAdmin();

  const folder = formData.get("folder")?.toString().trim() ?? "";
  const slug = formData.get("slug")?.toString().trim() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  const tagline = formData.get("tagline")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const stack = formData.get("stack")?.toString().trim() ?? "";
  const devUrl = formData.get("devUrl")?.toString().trim() ?? "";
  const accentRaw = formData.get("accent")?.toString().trim() ?? "rose";

  if (!folder || !slug || !name) {
    throw new Error("folder, slug e name são obrigatórios");
  }
  if (!SAFE_ID.test(slug)) {
    throw new Error("slug inválido: use só minúsculas, números e hífen");
  }
  if (!SAFE_PATH.test(folder) || folder.includes("..")) {
    throw new Error("pasta inválida");
  }
  if (devUrl && !/^https?:\/\//i.test(devUrl)) {
    throw new Error("devUrl precisa começar com http:// ou https://");
  }

  const accent = (ALLOWED_ACCENTS as readonly string[]).includes(accentRaw)
    ? accentRaw
    : "rose";

  const typeRaw = formData.get("type")?.toString().trim() ?? "lp";
  const type = ["website", "lp", "form"].includes(typeRaw) ? typeRaw : "lp";

  const filePath = path.resolve(process.cwd(), "lib/landing-pages.ts");
  const content = await fs.readFile(filePath, "utf-8");

  if (!content.includes(MARKER)) {
    throw new Error("Marker __INSERT_LP_HERE__ não encontrado em landing-pages.ts");
  }

  const devUrlLine = devUrl ? `\n    devUrl: "${escape(devUrl)}",` : "";

  const entry = `  {
    slug: "${escape(slug)}",
    name: "${escape(name)}",
    tagline: "${escape(tagline)}",
    description: "${escape(description)}",
    stack: "${escape(stack)}",
    status: "ready",
    type: "${type}",
    localPath: "${escape(folder)}",${devUrlLine}
    accent: "${accent}",
    createdAt: "${today()}",
  },
${MARKER}`;

  const updated = content.replace(MARKER, entry);
  await fs.writeFile(filePath, updated, "utf-8");

  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  redirect(`/lps/${slug}`);
}
