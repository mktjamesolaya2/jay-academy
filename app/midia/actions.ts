"use server";

import { sincronizarMidiasDoRepositorio } from "@/lib/media-repo-sync";
import { organizeImportedMediaByPage } from "@/lib/wp-localize";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { blobUpload } from "@/lib/storage";
import { logActivity } from "@/lib/activity-log";
import {
  addMedia,
  deleteMedia,
  updateMedia,
  listMedia,
  assignMediaToPage,
  clearPageFromMedia,
} from "@/lib/media-store";
import {
  createPage,
  renamePage,
  deletePage,
} from "@/lib/media-pages-store";
import type { MediaItem } from "@/lib/media-types";
import {
  mediaTypeFromContentType,
  mediaTypeFromUrl,
} from "@/lib/media-types";

const MAX = 10 * 1024 * 1024; // 10MB

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Upload de arquivo (imagem/vídeo/doc) pra Vercel Blob + registro na biblioteca. */
export async function uploadMediaAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const file = formData.get("file");
    const category = (formData.get("category")?.toString() || "Outros").trim();
    if (!(file instanceof File)) return { ok: false, error: "Arquivo inválido" };
    if (file.size === 0) return { ok: false, error: "Arquivo vazio" };
    if (file.size > MAX)
      return {
        ok: false,
        error:
          "Máx 10MB por upload. Pra vídeos/arquivos grandes, use 'Adicionar por URL'.",
      };

    const ext = file.name.includes(".") ? "." + file.name.split(".").pop() : "";
    const base = sanitizeName(file.name.replace(/\.[^.]+$/, "")) || "arquivo";
    const filename = `media/${base}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await blobUpload(filename, buffer, file.type);

    const pageId = formData.get("pageId")?.toString() || undefined;
    await addMedia({
      id: newId(),
      name: file.name,
      url,
      category,
      type: mediaTypeFromContentType(file.type),
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      ...(pageId ? { pageId } : {}),
    });
    await logActivity("wp.edit", file.name, "mídia enviada");

    revalidatePath("/midia");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro no upload" };
  }
}

/** Adiciona um arquivo por URL externa (ex: vídeo hospedado fora). */
export async function addMediaByUrlAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const url = (formData.get("url")?.toString() || "").trim();
    const category = (formData.get("category")?.toString() || "Outros").trim();
    const name =
      (formData.get("name")?.toString() || "").trim() ||
      url.split("/").pop()?.split("?")[0] ||
      "arquivo";
    if (!url) return { ok: false, error: "URL vazia" };
    if (!/^https?:\/\//i.test(url))
      return { ok: false, error: "URL precisa começar com http(s)://" };

    const pageId = formData.get("pageId")?.toString() || undefined;
    await addMedia({
      id: newId(),
      name,
      url,
      category,
      type: mediaTypeFromUrl(url),
      uploadedAt: new Date().toISOString(),
      ...(pageId ? { pageId } : {}),
    });

    revalidatePath("/midia");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

/** Lista só as imagens — usado pelo seletor "Escolher da biblioteca". */
export async function listMediaImagesAction(): Promise<MediaItem[]> {
  await requireAdmin();
  const items = await listMedia();
  return items.filter((i) => i.type === "image");
}

export async function deleteMediaAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  if (id) await deleteMedia(id);
  revalidatePath("/midia");
}

export async function setMediaCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const category = formData.get("category")?.toString() ?? "Outros";
  if (id) await updateMedia(id, { category });
  revalidatePath("/midia");
}

// ─── Páginas de mídia (coleções) ──────────────────────────────────────────

export async function createMediaPageAction(
  formData: FormData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    await requireAdmin();
    const name = (formData.get("name")?.toString() || "").trim();
    if (!name) return { ok: false, error: "Dê um nome pra página" };
    const page = await createPage(name, newId);
    revalidatePath("/midia");
    return { ok: true, id: page.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}

export async function renameMediaPageAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const name = formData.get("name")?.toString() ?? "";
  if (id && name.trim()) await renamePage(id, name);
  revalidatePath("/midia");
}

export async function deleteMediaPageAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  if (id) {
    // Não apaga as mídias — só desfaz o vínculo (voltam pra "Sem página").
    await clearPageFromMedia(id);
    await deletePage(id);
  }
  revalidatePath("/midia");
}

/** Move uma ou mais mídias pra uma página (ou pra "sem página" se vazio). */
export async function moveMediaToPageAction(
  ids: string[],
  pageId: string | null
): Promise<{ ok: boolean }> {
  await requireAdmin();
  await assignMediaToPage(ids, pageId);
  revalidatePath("/midia");
  return { ok: true };
}

/**
 * Traz pra biblioteca toda imagem e vídeo que mora no repositório (public/),
 * agrupados por álbum, e conserta as importadas do WP que ficaram apontando pro
 * armazenamento morto. É idempotente: roda quantas vezes quiser, só entra o que
 * ainda não estava lá.
 *
 * Normalmente nem precisa: a galeria se sincroniza sozinha quando o repositório
 * muda (ver sincronizarSeMudou). O botão fica como conserto manual.
 */
export async function sincronizarRepositorioAction(): Promise<{
  ok: boolean;
  albuns?: number;
  arquivos?: number;
  novos?: number;
  consertados?: number;
  removidas?: number;
  paginasWp?: number;
  semImagem?: number;
  error?: string;
}> {
  await requireAdmin();
  try {
    const r = await sincronizarMidiasDoRepositorio();
    // Reconstrói também os álbuns das páginas do WordPress a partir do HTML
    // guardado de cada uma — é o que devolve as páginas que só usavam imagem
    // compartilhada e por isso apareciam vazias.
    const wp = await organizeImportedMediaByPage();
    revalidatePath("/midia");
    return { ok: true, ...r, paginasWp: wp.pages, semImagem: wp.semImagem };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao sincronizar" };
  }
}
