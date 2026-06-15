"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  listSaved,
  loadContent,
  saveContent,
  setPublished,
  unsetPublished,
  trashContent,
  markPlaced,
  type PlacementType,
} from "@/lib/wp-content-storage";
import { generatePageSummary } from "@/lib/ai-summary";
import { ensurePageSummary } from "@/lib/page-summary";
import type { WpDomain } from "@/lib/wp-api";

type Item = { domain: WpDomain; slug: string };

/** Publica uma página com o slug público padrão (sem abrir o form de slug). */
export async function quickPublishAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  if (!domain || !slug) return;

  const content = await loadContent(domain, slug);
  if (!content) return;

  const publicSlug = content.publicSlug || slug;
  await setPublished(content, publicSlug);
  await logActivity("wp.publish", content.title || slug, `/p/${publicSlug}`);

  // Resumo inteligente gerado automaticamente na publicação.
  await ensurePageSummary(domain, slug);

  revalidatePath("/wp-pages");
  revalidatePath("/dashboard");
  revalidatePath(`/wp-pages/${domain}/${slug}`);
  revalidatePath(`/p/${publicSlug}`);
}

/** Despublica uma página. */
export async function quickUnpublishAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  if (!domain || !slug) return;

  const content = await loadContent(domain, slug);
  if (!content) return;

  const oldPublicSlug = content.publicSlug;
  await unsetPublished(content);
  await logActivity("wp.unpublish", content.title || slug);

  revalidatePath("/wp-pages");
  revalidatePath("/dashboard");
  if (oldPublicSlug) revalidatePath(`/p/${oldPublicSlug}`);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Salva o SEO da página (título, descrição, imagem, canonical, noindex, slug). */
export async function saveSeoAction(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await requireAdmin();
    const domain = formData.get("domain")?.toString() as WpDomain;
    const slug = formData.get("slug")?.toString() ?? "";
    if (!domain || !slug) return { error: "Faltam dados" };

    const content = await loadContent(domain, slug);
    if (!content) return { error: "Página não encontrada" };

    const str = (k: string) => formData.get(k)?.toString().trim() || undefined;
    content.seoTitle = str("seoTitle");
    content.seoDescription = str("seoDescription");
    content.seoImage = str("seoImage");
    content.seoCanonical = str("seoCanonical");
    content.seoNoIndex = formData.get("seoNoIndex") === "1";

    // Slug / permalink — pode mudar a URL pública
    const rawSlug = formData.get("publicSlug")?.toString().trim() ?? "";
    const newSlug = rawSlug ? slugify(rawSlug) : "";
    const currentSlug = content.publicSlug || content.slug;
    if (newSlug && newSlug !== currentSlug) {
      if (content.published) {
        // setPublished cuida do índice + conflito (lança se já existir)
        await setPublished(content, newSlug);
      } else {
        content.publicSlug = newSlug;
      }
    }

    await saveContent(content);
    await logActivity("wp.edit", content.title || slug, "SEO atualizado");

    const finalSlug = content.publicSlug || content.slug;
    revalidatePath(`/wp-pages/${domain}/${slug}`);
    revalidatePath(`/p/${finalSlug}`);
    revalidatePath("/wp-pages");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar SEO" };
  }
}

/** Agenda (ou cancela) a publicação/despublicação automática. */
export async function scheduleAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  const mode = formData.get("mode")?.toString(); // "publish" | "unpublish"
  const clear = formData.get("clear") === "1";
  const when = formData.get("when")?.toString() ?? "";
  if (!domain || !slug) return;

  const content = await loadContent(domain, slug);
  if (!content) return;

  const iso = clear || !when ? undefined : new Date(when).toISOString();
  if (mode === "publish") content.scheduledPublishAt = iso;
  else if (mode === "unpublish") content.scheduledUnpublishAt = iso;

  await saveContent(content);
  await logActivity(
    "wp.edit",
    content.title || slug,
    clear ? "agendamento cancelado" : `agendado (${mode})`
  );
  revalidatePath(`/wp-pages/${domain}/${slug}`);
  revalidatePath("/wp-pages");
}

/** Renomeia o NOME (título) da página. Não mexe no slug nem na URL pública. */
export async function renameWpPageAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  if (!domain || !slug || !name) return;

  const content = await loadContent(domain, slug);
  if (!content) return;

  content.title = name;
  await saveContent(content);
  await logActivity("wp.edit", name, "renomeada");

  revalidatePath("/wp-pages");
  revalidatePath(`/wp-pages/${domain}/${slug}`);
  revalidatePath("/dashboard");
}

/** Lê o conteúdo da página com IA e salva um resumo inteligente.
   State-returning pra mostrar erro inline (useActionState). */
export async function generateSummaryAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    const domain = formData.get("domain")?.toString() as WpDomain;
    const slug = formData.get("slug")?.toString() ?? "";
    if (!domain || !slug) return { error: "Faltam dados" };

    const content = await loadContent(domain, slug);
    if (!content) return { error: "Página não encontrada" };

    const summary = await generatePageSummary({
      title: content.title,
      body: content.content || content.fullHtml || content.excerpt || "",
      kind: content.placed,
    });

    content.summary = summary;
    content.summaryAt = new Date().toISOString();
    await saveContent(content);

    revalidatePath(`/wp-pages/${domain}/${slug}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar resumo" };
  }
}

/** Duplica a página numa cópia nova (slug livre, não publicada). */
export async function duplicateWpPageAction(formData: FormData) {
  await requireAdmin();
  const domain = formData.get("domain")?.toString() as WpDomain;
  const slug = formData.get("slug")?.toString() ?? "";
  if (!domain || !slug) return;

  const content = await loadContent(domain, slug);
  if (!content) return;

  // Acha um slug livre: slug-copia, slug-copia-2, ...
  let newSlug = `${slug}-copia`;
  let n = 2;
  while (await loadContent(domain, newSlug)) {
    newSlug = `${slug}-copia-${n}`;
    n++;
  }

  const copy = {
    ...content,
    slug: newSlug,
    title: `${content.title} (cópia)`,
    published: false,
    publishedAt: undefined,
    publicSlug: undefined,
    trashed: false,
    trashedAt: undefined,
    fetchedAt: new Date().toISOString(),
  };
  await saveContent(copy);
  await logActivity("wp.copy", copy.title, "duplicada");

  revalidatePath("/wp-pages");
  revalidatePath("/dashboard");
  redirect(`/wp-pages/${domain}/${encodeURIComponent(newSlug)}`);
}

/** Publica de uma vez TODAS as páginas copiadas que ainda não estão publicadas. */
export async function publishAllAction() {
  await requireAdmin();
  const saved = await listSaved();

  const justPublished: Array<{ domain: WpDomain; slug: string }> = [];
  for (const s of saved) {
    if (s.published) continue;
    const content = await loadContent(s.domain, s.slug);
    if (!content) continue;
    const publicSlug = content.publicSlug || content.slug;
    await setPublished(content, publicSlug);
    revalidatePath(`/p/${publicSlug}`);
    justPublished.push({ domain: s.domain, slug: s.slug });
  }

  // Resumos gerados em paralelo (best-effort) pra não somar latência em série.
  await Promise.all(
    justPublished.map((p) => ensurePageSummary(p.domain, p.slug))
  );

  await logActivity(
    "wp.publish",
    `${justPublished.length} página(s)`,
    "publicadas em massa"
  );
  revalidatePath("/wp-pages");
  revalidatePath("/dashboard");
}

/** ===== Ações em lote sobre uma SELEÇÃO de páginas ===== */

export async function bulkPublishAction(items: Item[]) {
  await requireAdmin();
  const done: Item[] = [];
  for (const it of items) {
    const content = await loadContent(it.domain, it.slug);
    if (!content || content.published) continue;
    const publicSlug = content.publicSlug || content.slug;
    await setPublished(content, publicSlug);
    revalidatePath(`/p/${publicSlug}`);
    done.push(it);
  }
  await Promise.all(done.map((p) => ensurePageSummary(p.domain, p.slug)));
  await logActivity("wp.publish", `${done.length} página(s)`, "publicadas (seleção)");
  revalidatePath("/wp-pages");
  revalidatePath("/dashboard");
}

export async function bulkUnpublishAction(items: Item[]) {
  await requireAdmin();
  let n = 0;
  for (const it of items) {
    const content = await loadContent(it.domain, it.slug);
    if (!content || !content.published) continue;
    if (content.publicSlug) revalidatePath(`/p/${content.publicSlug}`);
    await unsetPublished(content);
    n++;
  }
  await logActivity("wp.unpublish", `${n} página(s)`, "despublicadas (seleção)");
  revalidatePath("/wp-pages");
  revalidatePath("/dashboard");
}

export async function bulkTrashAction(items: Item[]) {
  await requireAdmin();
  for (const it of items) {
    const content = await loadContent(it.domain, it.slug);
    await trashContent(it.domain, it.slug);
    if (content?.publicSlug) revalidatePath(`/p/${content.publicSlug}`);
  }
  await logActivity("wp.delete", `${items.length} página(s)`, "movidas pra lixeira (seleção)");
  revalidatePath("/wp-pages");
  revalidatePath("/dashboard");
  revalidatePath("/lixeira");
}

export async function bulkCategorizeAction(
  items: Item[],
  type: PlacementType | null
) {
  await requireAdmin();
  for (const it of items) {
    await markPlaced(it.domain, it.slug, type);
  }
  const label =
    type === "website"
      ? "Website"
      : type === "lp"
      ? "Landing page"
      : type === "form"
      ? "Formulário"
      : "sem categoria";
  await logActivity("wp.categorize", `${items.length} página(s)`, label);
  revalidatePath("/wp-pages");
  revalidatePath("/dashboard");
}

/** Despublica de uma vez TODAS as páginas que estão publicadas. */
export async function unpublishAllAction() {
  await requireAdmin();
  const saved = await listSaved();

  let count = 0;
  for (const s of saved) {
    if (!s.published) continue;
    const content = await loadContent(s.domain, s.slug);
    if (!content) continue;
    if (content.publicSlug) revalidatePath(`/p/${content.publicSlug}`);
    await unsetPublished(content);
    count++;
  }

  await logActivity("wp.unpublish", `${count} página(s)`, "despublicadas em massa");
  revalidatePath("/wp-pages");
  revalidatePath("/dashboard");
}
