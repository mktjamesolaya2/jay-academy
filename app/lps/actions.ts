"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

const MARKER = "  // __INSERT_LP_HERE__";

function escapeStr(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ALLOWED_ACCENTS = [
  "pink-orange",
  "purple-fuchsia",
  "amber-orange",
  "gold-black",
  "rose",
] as const;

export async function createLpAction(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name")?.toString().trim() ?? "";
  const slugInput = formData.get("slug")?.toString().trim() ?? "";
  const tagline = formData.get("tagline")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const typeRaw = formData.get("type")?.toString().trim() ?? "lp";
  const accentRaw = formData.get("accent")?.toString().trim() ?? "rose";

  if (!name) throw new Error("Nome obrigatório");

  const slug = slugInput ? slugify(slugInput) : slugify(name);
  if (!slug) throw new Error("Slug inválido");

  const type = ["website", "lp", "form"].includes(typeRaw) ? typeRaw : "lp";
  const accent = (ALLOWED_ACCENTS as readonly string[]).includes(accentRaw)
    ? accentRaw
    : "rose";

  const filePath = path.resolve(process.cwd(), "lib/landing-pages.ts");
  const content = await fs.readFile(filePath, "utf-8");

  if (content.includes(`slug: "${slug}"`)) {
    throw new Error(`Já existe uma página com slug "${slug}"`);
  }
  if (!content.includes(MARKER)) {
    throw new Error("Marker não encontrado em landing-pages.ts");
  }

  const today = new Date().toISOString().split("T")[0];

  const entry = `  {
    slug: "${escapeStr(slug)}",
    name: "${escapeStr(name)}",
    tagline: "${escapeStr(tagline)}",
    description: "${escapeStr(description)}",
    stack: "",
    status: "draft",
    type: "${type}",
    localPath: "",
    accent: "${accent}",
    createdAt: "${today}",
  },
${MARKER}`;

  const updated = content.replace(MARKER, entry);
  await fs.writeFile(filePath, updated, "utf-8");

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  redirect(`/lps/${slug}?just-created=1`);
}

export async function duplicateLpAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) throw new Error("Slug obrigatório");

  const filePath = path.resolve(process.cwd(), "lib/landing-pages.ts");
  const content = await fs.readFile(filePath, "utf-8");

  // Acha o objeto da LP original pelo slug
  const slugRegex = new RegExp(
    `\\{\\s*slug:\\s*"${slug}",[\\s\\S]*?\\n\\s*\\},`,
    "m"
  );
  const match = content.match(slugRegex);
  if (!match) throw new Error("LP original não encontrada");

  const original = match[0];

  // Gera novo slug único
  let suffix = 1;
  let newSlug = `${slug}-copy-${suffix}`;
  while (content.includes(`slug: "${newSlug}"`)) {
    suffix++;
    newSlug = `${slug}-copy-${suffix}`;
  }

  // Substitui slug e marca como draft
  const duplicated = original
    .replace(`slug: "${slug}"`, `slug: "${newSlug}"`)
    .replace(/status:\s*"[^"]*"/, `status: "draft"`)
    .replace(
      /name:\s*"([^"]*)"/,
      (_m, name) => `name: "${name} (Cópia)"`
    );

  // Insere antes do marker
  const updated = content.replace(MARKER, `${duplicated}\n${MARKER}`);
  await fs.writeFile(filePath, updated, "utf-8");

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  redirect(`/lps/${newSlug}`);
}

export async function editLpMetadataAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) throw new Error("Slug obrigatório");

  const name = formData.get("name")?.toString().trim() ?? "";
  const tagline = formData.get("tagline")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const typeRaw = formData.get("type")?.toString().trim() ?? "lp";
  const accentRaw = formData.get("accent")?.toString().trim() ?? "rose";

  const type = ["website", "lp", "form"].includes(typeRaw) ? typeRaw : "lp";
  const accent = (ALLOWED_ACCENTS as readonly string[]).includes(accentRaw)
    ? accentRaw
    : "rose";

  const filePath = path.resolve(process.cwd(), "lib/landing-pages.ts");
  const content = await fs.readFile(filePath, "utf-8");

  const slugRegex = new RegExp(
    `(\\{\\s*slug:\\s*"${slug}",)([\\s\\S]*?)(\\n\\s*\\},)`,
    "m"
  );
  const match = content.match(slugRegex);
  if (!match) throw new Error("LP não encontrada");

  const body = match[2];
  let newBody = body
    .replace(/name:\s*"[^"]*"/, `name: "${escapeStr(name)}"`)
    .replace(/tagline:\s*"[^"]*"/, `tagline: "${escapeStr(tagline)}"`)
    .replace(/description:\s*"[^"]*"/, `description: "${escapeStr(description)}"`)
    .replace(/type:\s*"[^"]*"/, `type: "${type}"`)
    .replace(/accent:\s*"[^"]*"/, `accent: "${accent}"`);

  const updated = content.replace(slugRegex, `$1${newBody}$3`);
  await fs.writeFile(filePath, updated, "utf-8");

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath(`/lps/${slug}`);
}

export async function moveToTrashAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) return;

  const filePath = path.resolve(process.cwd(), "lib/landing-pages.ts");
  const content = await fs.readFile(filePath, "utf-8");

  const now = new Date().toISOString();
  const slugRegex = new RegExp(
    `(\\{\\s*slug:\\s*"${slug}",[\\s\\S]*?)(\\n\\s*\\},)`,
    "m"
  );
  const match = content.match(slugRegex);
  if (!match) return;

  let body = match[1];
  if (/trashed:\s*(?:true|false)/.test(body)) {
    body = body.replace(/trashed:\s*(?:true|false)/, `trashed: true`);
  } else {
    body = body + `\n    trashed: true,`;
  }
  if (/trashedAt:\s*"[^"]*"/.test(body)) {
    body = body.replace(/trashedAt:\s*"[^"]*"/, `trashedAt: "${now}"`);
  } else {
    body = body + `\n    trashedAt: "${now}",`;
  }

  const updated = content.replace(slugRegex, `${body}${match[2]}`);
  await fs.writeFile(filePath, updated, "utf-8");

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath("/lixeira");
  redirect("/lps");
}

export async function restoreFromTrashAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) return;

  const filePath = path.resolve(process.cwd(), "lib/landing-pages.ts");
  const content = await fs.readFile(filePath, "utf-8");

  const slugRegex = new RegExp(
    `(\\{\\s*slug:\\s*"${slug}",[\\s\\S]*?)(\\n\\s*\\},)`,
    "m"
  );
  const match = content.match(slugRegex);
  if (!match) return;

  let body = match[1];
  body = body.replace(/\n\s*trashed:\s*(?:true|false),?/g, "");
  body = body.replace(/\n\s*trashedAt:\s*"[^"]*",?/g, "");

  const updated = content.replace(slugRegex, `${body}${match[2]}`);
  await fs.writeFile(filePath, updated, "utf-8");

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath("/lixeira");
}

export async function permanentDeleteAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) return;

  const filePath = path.resolve(process.cwd(), "lib/landing-pages.ts");
  const content = await fs.readFile(filePath, "utf-8");

  const slugRegex = new RegExp(
    `\\s*\\{\\s*slug:\\s*"${slug}",[\\s\\S]*?\\n\\s*\\},`,
    "m"
  );
  const updated = content.replace(slugRegex, "");
  await fs.writeFile(filePath, updated, "utf-8");

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath("/lixeira");
}

export async function setLpStatusAction(formData: FormData) {
  const slug = formData.get("slug")?.toString() ?? "";
  const status = formData.get("status")?.toString() ?? "";
  const validStatuses = ["draft", "published", "archived", "deploying", "error"];
  if (!slug || !validStatuses.includes(status)) return;

  const filePath = path.resolve(process.cwd(), "lib/landing-pages.ts");
  const content = await fs.readFile(filePath, "utf-8");

  const slugRegex = new RegExp(
    `(\\{\\s*slug:\\s*"${slug}",[\\s\\S]*?)status:\\s*"[^"]*"`,
    "m"
  );
  const updated = content.replace(slugRegex, `$1status: "${status}"`);

  await fs.writeFile(filePath, updated, "utf-8");
  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath(`/lps/${slug}`);
}
