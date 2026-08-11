"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { getLpFormConfig, setLpFormConfig } from "@/lib/lp-form-config";
import {
  addLp,
  getLpFromStore,
  loadLps,
  removeLp,
  saveLps,
  updateLp,
} from "@/lib/lp-store";
import type { LandingPage } from "@/lib/landing-pages";
import { deleteBuilderPage, emptyPage, saveBuilderPage } from "@/lib/page-builder-store";
import { resetEmbeddedHtml } from "@/lib/embedded-html-store";
import { temMarcacaoVisivel, somenteScript } from "@/lib/webhook-codigo";

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
  const useBuilder = formData.get("useBuilder")?.toString() === "1";

  if (!name) throw new Error("Nome obrigatório");
  const baseSlug = slugInput ? slugify(slugInput) : slugify(name);
  if (!baseSlug) throw new Error("Slug inválido");

  // Se o slug colide com LP existente, adiciona sufixo -2, -3, etc.
  // Em vez de jogar 500 na cara do user.
  const existing = await loadLps();
  let slug = baseSlug;
  let suffix = 2;
  while (existing.find((lp) => lp.slug === slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  const type = (["website", "lp", "form"].includes(typeRaw) ? typeRaw : "lp") as LandingPage["type"];
  const accent = ((ALLOWED_ACCENTS as readonly string[]).includes(accentRaw)
    ? accentRaw
    : "rose") as LandingPage["accent"];

  const now = new Date();
  await addLp({
    slug,
    name,
    tagline,
    description,
    stack: useBuilder ? "Blocos (page builder)" : "",
    status: "draft",
    type,
    localPath: "",
    accent,
    createdAt: now.toISOString().split("T")[0],
    lastEditedAt: now.toISOString(),
    // LPs criadas no painel são sempre do builder (mesmo sem blocos ainda)
    contentSource: "builder",
  });

  if (useBuilder) {
    await saveBuilderPage(emptyPage(slug));
  }

  await logActivity("lp.create", name);

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");

  if (useBuilder) {
    redirect(`/lps/${slug}/build`);
  }
  redirect(`/lps/${slug}?just-created=1`);
}

export async function duplicateLpAction(formData: FormData) {
  const me = await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) throw new Error("Slug obrigatório");

  const original = await getLpFromStore(slug);
  if (!original) throw new Error("LP original não encontrada");

  const all = await loadLps();
  let suffix = 1;
  let newSlug = `${slug}-copy-${suffix}`;
  while (all.find((lp) => lp.slug === newSlug)) {
    suffix++;
    newSlug = `${slug}-copy-${suffix}`;
  }

  const nowIso = new Date().toISOString();
  await addLp({
    ...original,
    slug: newSlug,
    name: `${original.name} (Cópia)`,
    status: "draft",
    trashed: false,
    trashedAt: undefined,
    createdAt: nowIso.split("T")[0],
    // marca como editada agora → aparece em "Recentes"
    lastEditedAt: nowIso,
    lastEditedBy: me.name,
  });
  await logActivity("lp.duplicate", original.name);

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

  const type = (["website", "lp", "form"].includes(typeRaw) ? typeRaw : "lp") as LandingPage["type"];
  const accent = ((ALLOWED_ACCENTS as readonly string[]).includes(accentRaw)
    ? accentRaw
    : "rose") as LandingPage["accent"];

  await updateLp(slug, {
    name,
    tagline,
    description,
    type,
    accent,
    lastEditedAt: new Date().toISOString(),
  });
  await logActivity("lp.update", name || slug);

  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath(`/lps/${slug}`);
}

export async function moveToTrashAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) return;
  const lp = await getLpFromStore(slug);
  await updateLp(slug, { trashed: true, trashedAt: new Date().toISOString() });
  await logActivity("lp.delete", lp?.name || slug, "movida para a lixeira");
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
  const lp = await getLpFromStore(slug);
  await updateLp(slug, { trashed: false, trashedAt: undefined });
  await logActivity("lp.restore", lp?.name || slug);
  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath("/lixeira");
}

export async function permanentDeleteAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  if (!slug) return;
  const lp = await getLpFromStore(slug);
  // Limpa todos os blobs relacionados pra não deixar lixo no KV
  await Promise.all([
    removeLp(slug),
    deleteBuilderPage(slug).catch(() => {}),
    resetEmbeddedHtml(slug).catch(() => {}),
  ]);
  await logActivity("lp.delete", lp?.name || slug, "excluída permanentemente");
  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath("/lixeira");
  revalidatePath(`/p/${slug}`);
}

export async function setLpStatusAction(formData: FormData) {
  await requireAdmin();
  const slug = formData.get("slug")?.toString() ?? "";
  const status = formData.get("status")?.toString() ?? "";
  const validStatuses = ["draft", "published", "archived", "deploying", "error"];
  if (!slug || !validStatuses.includes(status)) return;
  const lp = await getLpFromStore(slug);
  await updateLp(slug, {
    status: status as LandingPage["status"],
    lastEditedAt: new Date().toISOString(),
  });
  if (lp) {
    if (status === "published") {
      await logActivity("lp.update", lp.name, "publicada");
    } else if (status === "draft") {
      await logActivity("lp.update", lp.name, "despublicada");
    }
  }
  revalidatePath("/dashboard");
  revalidatePath("/lps");
  revalidatePath("/websites");
  revalidatePath(`/lps/${slug}`);
  revalidatePath(`/p/${slug}`);
}

/**
 * Guarda o código que o CRM gera pra uma página (formulário + script, ou só o
 * script). Ele é injetado antes de `</body>` na hora de servir — ver
 * `lib/serve-lp.ts`.
 *
 * Código vazio TIRA a integração daquela página: é como se desinstala, e por
 * isso não vale exigir conteúdo aqui.
 */
export async function salvarCodigoCrmAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const slug = (formData.get("slug")?.toString() ?? "").trim();
    if (!slug) return { ok: false, error: "Página não identificada" };
    const codigo = formData.get("codigo")?.toString() ?? "";

    // 200 KB é MUITO mais do que qualquer script de formulário — o teto está
    // aqui só pra ninguém colar uma página inteira por engano.
    if (codigo.length > 200_000) {
      return { ok: false, error: "Código grande demais — confira se colou só o trecho do CRM." };
    }

    // ⚠️ Recusa a variante "formulário pronto".
    //
    // Ela traz form + script. Injetada aqui, o formulário aparecia solto no
    // rodapé, sem estilo — James: "NÃO QUERO ISSO APARECENDO". E não adianta
    // só descartar o formulário: o script dela procura o formulário DELA
    // (getElementById("form-jayo")) e quebraria a página com erro de
    // JavaScript. A variante certa pras nossas páginas é a "só o envio", que
    // se liga no formulário que a página já tem.
    if (codigo.trim() && temMarcacaoVisivel(codigo)) {
      return {
        ok: false,
        error:
          "Esse é o código com formulário junto. Peça ao CRM a variante \"só o envio\" — as páginas daqui já têm o formulário delas.",
      };
    }
    if (codigo.trim() && !somenteScript(codigo)) {
      return {
        ok: false,
        error: "Não achei nenhum <script> nesse código. Copie no CRM o trecho do envio.",
      };
    }

    const atual = (await getLpFormConfig(slug)) ?? {};
    await setLpFormConfig(slug, { ...atual, codigoCrm: codigo });
    await logActivity(
      "wp.edit",
      slug,
      codigo.trim() ? "código do CRM instalado na página" : "código do CRM removido da página"
    );
    revalidatePath(`/lps/${slug}`);
    revalidatePath(`/${slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

/**
 * Devolve a página pro arquivo do repositório, apagando a versão editada no
 * painel.
 *
 * Existe porque o override é silencioso: depois de salvar pelo editor, mexer no
 * arquivo e dar push não muda mais nada na página. Sem este botão, a pessoa
 * ficaria editando o repositório sem entender por que não acontece nada.
 */
export async function voltarProOriginalAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const slug = (formData.get("slug")?.toString() ?? "").trim();
    if (!slug) return { ok: false, error: "Página não identificada" };
    await resetEmbeddedHtml(slug);
    await logActivity("wp.edit", slug, "voltou pro HTML do repositório");
    revalidatePath(`/lps/${slug}`);
    revalidatePath(`/${slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}
