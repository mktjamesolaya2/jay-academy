"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { fetchPageContent } from "@/lib/wp-fetch-page";
import {
  saveContent,
  loadContent,
  setPublished,
  type WpPageContent,
} from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";
import { ensurePageSummary } from "@/lib/page-summary";
import { localizePage } from "@/lib/wp-localize";
import { logActivity } from "@/lib/activity-log";

type Result = { url: string; ok: boolean; message: string };

const API_BASE: Record<WpDomain, string> = {
  main: "https://jayacademy.com.br",
  lp: "https://lp.jayacademy.com.br",
};

/** Importa páginas do WordPress a partir dos links colados (1 por linha). */
export async function importByLinksAction(
  _prev: { results: Result[] } | undefined,
  formData: FormData
): Promise<{ results: Result[] }> {
  await requireAdmin();
  const raw = formData.get("links")?.toString() ?? "";
  const autoPublish = formData.get("publish") === "1";
  const urls = [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];

  const results: Result[] = [];

  for (const url of urls) {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");
      const domain: WpDomain = host.startsWith("lp.") ? "lp" : "main";
      const slug = decodeURIComponent(
        u.pathname
          .replace(/^\/+|\/+$/g, "")
          .split("/")
          .pop() || ""
      );
      if (!slug) {
        results.push({ url, ok: false, message: "Não achei o slug na URL" });
        continue;
      }

      const existing = await loadContent(domain, slug);

      // Descobre o ID da página pelo slug (REST API do WordPress)
      const res = await fetch(
        `${API_BASE[domain]}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}`,
        {
          cache: "no-store",
          headers: { "User-Agent": "Mozilla/5.0 jayacademy-portal/0.1" },
        }
      );
      if (!res.ok) {
        results.push({ url, ok: false, message: `WordPress respondeu ${res.status}` });
        continue;
      }
      const arr = (await res.json()) as Array<{ id?: number }>;
      const id = Array.isArray(arr) ? arr[0]?.id : undefined;
      if (!id) {
        results.push({
          url,
          ok: false,
          message: "Página não encontrada no WordPress (slug inexistente?)",
        });
        continue;
      }

      const content = await fetchPageContent(domain, id);
      if (!content) {
        results.push({ url, ok: false, message: "Falha ao buscar o conteúdo" });
        continue;
      }
      // Preserva categoria/publicação se já existia (re-importação = atualizar)
      const merged: WpPageContent = existing
        ? {
            ...content,
            placed: existing.placed,
            placedAt: existing.placedAt,
            published: existing.published,
            publishedAt: existing.publishedAt,
            publicSlug: existing.publicSlug,
          }
        : content;
      await saveContent(merged);

      // Baixa imagens/CSS/JS do WP pro storage local na hora da cópia — a página
      // já nasce independente do WP (não quebra quando ele sair do ar). Não-fatal:
      // se falhar, a página fica copiada e o backfill conserta depois.
      try {
        await localizePage(domain, merged.slug);
      } catch {
        // segue mesmo se a localização falhar
      }

      let published = false;
      if (autoPublish && !merged.published) {
        try {
          await setPublished(merged, merged.publicSlug || merged.slug);
          await ensurePageSummary(domain, merged.slug);
          published = true;
          revalidatePath(`/p/${merged.publicSlug || merged.slug}`);
        } catch {
          // se falhar ao publicar, segue só copiada
        }
      }

      results.push({
        url,
        ok: true,
        message: existing
          ? `Atualizada: ${content.title}`
          : published
          ? `Copiada e PUBLICADA: ${content.title}`
          : `Copiada: ${content.title}`,
      });
    } catch (e) {
      results.push({
        url,
        ok: false,
        message: e instanceof Error ? e.message : "Erro",
      });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  if (okCount) {
    await logActivity("wp.copy", `${okCount} página(s)`, "importadas por link");
    revalidatePath("/wp-pages");
    revalidatePath("/dashboard");
    revalidatePath("/wordpress");
  }

  return { results };
}
