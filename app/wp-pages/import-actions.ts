"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
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
import { fetchAnyUrl } from "@/lib/fetch-any-url";
import { deriveWebSlug, ensureScheme } from "@/lib/web-slug";
import { isBlockedHost } from "@/lib/net-guard";
import { sanitizeCopiedHtml } from "@/lib/sanitize-copied";
import {
  absolutizeUrls,
  delazyHtml,
  stripPlaceholderSources,
} from "@/lib/wp-localize-core";
import { isReservedSlug } from "@/lib/reserved-slugs";

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

  const forceHeadless = formData.get("forceHeadless") === "1";
  // Manter os scripts do site copiado (fica fiel a sites de JS pesado tipo Apple,
  // mas o JS de terceiros roda no domínio do painel — só quando o admin opta).
  const keepScripts = formData.get("keepScripts") === "1";
  const results: Result[] = [];

  for (const url of urls) {
    try {
      const normUrl = ensureScheme(url);
      const u = new URL(normUrl);
      const host = u.hostname.replace(/^www\./, "");
      const isWpJay =
        host === "jayacademy.com.br" || host === "lp.jayacademy.com.br";

      if (!isWpJay) {
        // Caminho web (qualquer site que não seja o WP legado da Jay Academy).
        if (isBlockedHost(u.hostname)) {
          results.push({
            url,
            ok: false,
            message: "Endereço interno/privado bloqueado por segurança",
          });
          continue;
        }
        const { html, finalUrl } = await fetchAnyUrl(normUrl, { forceHeadless });
        // Redirect: usa o host FINAL (destino real), não o do link colado — senão
        // o `domain` mentiria e a dedup ficaria inconsistente. Re-checa SSRF no
        // destino (um redirect podia levar a um IP interno).
        const finalUrlObj = new URL(finalUrl);
        if (isBlockedHost(finalUrlObj.hostname)) {
          results.push({
            url,
            ok: false,
            message: "Redirecionou pra endereço interno/privado — bloqueado",
          });
          continue;
        }
        const webHost = finalUrlObj.hostname.replace(/^www\./, "");
        const webSlug = deriveWebSlug(finalUrl);
        const title = (
          html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || webSlug
        ).trim();
        // Preparação da cópia web, em ordem:
        //  1) delazyHtml: promove data-src → src (imagens lazy aparecem)
        //  2) absolutizeUrls: URLs relativas → absolutas contra a origem
        //     (carrega os assets do site original na hora, sem depender de <base>,
        //     e faz a reescrita do localizador casar depois)
        //  3) sanitizeCopiedHtml: remove <script>/handlers (segurança same-origin) —
        //     PULADO quando o admin marca "manter scripts" (fidelidade > segurança).
        const prepared = absolutizeUrls(
          stripPlaceholderSources(delazyHtml(html)),
          finalUrl
        );
        const safeHtml = keepScripts ? prepared : sanitizeCopiedHtml(prepared);
        const existingWeb = await loadContent(webHost, webSlug);
        const webContent: WpPageContent = {
          id: 0,
          slug: webSlug,
          domain: webHost,
          title,
          content: "",
          fullHtml: safeHtml,
          excerpt: "",
          link: finalUrl,
          modified: new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          sourceKind: "web",
          sourceUrl: finalUrl,
          ...(existingWeb
            ? {
                placed: existingWeb.placed,
                placedAt: existingWeb.placedAt,
                published: existingWeb.published,
                publishedAt: existingWeb.publishedAt,
                publicSlug: existingWeb.publicSlug,
              }
            : {}),
        };
        await saveContent(webContent);

        after(async () => {
          try {
            const st = await localizePage(webHost, webSlug);
            if (st.total > 0 && st.localized === 0) {
              await logActivity(
                "wp.localize.fail",
                title,
                `0/${st.total} assets localizados (storage indisponível?)`
              ).catch(() => {});
            }
          } catch (e) {
            // segue; a página fica marcada como pendente pro cron consertar
            await logActivity(
              "wp.localize.fail",
              title,
              e instanceof Error ? e.message : "erro na localização"
            ).catch(() => {});
          }
        });

        const pubSlug = webContent.publicSlug || webContent.slug;
        // Slug reservado (rota do sistema ou LP estática) → publicar ali daria
        // página invisível ("publicado" falso). Não publica; avisa.
        const reservedSlug = isReservedSlug(pubSlug);
        let webPublished = false;
        if (autoPublish && !webContent.published && !reservedSlug) {
          try {
            await setPublished(webContent, pubSlug);
            await ensurePageSummary(webHost, webContent.slug);
            webPublished = true;
            revalidatePath(`/p/${pubSlug}`);
          } catch {
            // se falhar ao publicar, segue só copiada
          }
        }

        results.push({
          url,
          ok: true,
          message: existingWeb
            ? `Atualizada: ${title} — otimizando em 2º plano`
            : webPublished
            ? `Copiada e publicada: ${title} — otimizando em 2º plano`
            : autoPublish && reservedSlug
            ? `Copiada: ${title} — NÃO publiquei: o slug "${pubSlug}" colide com uma rota do sistema; publique num slug diferente`
            : `Copiada: ${title} — otimizando em 2º plano`,
        });
        continue;
      }

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

      // Localização (baixar imagens/CSS/JS do WP pro storage) SAI do caminho
      // síncrono: baixar 100–350 assets inline estourava o timeout serverless e
      // era engolido — a página nascia crua (lenta + hero dependente de JS) sem
      // ninguém saber. Agora roda em background com after() (não trava a resposta)
      // e, se falhar/localizar 0, fica registrado. A página não-localizada é
      // marcada como pendente (localizedAt não setado) e o cron
      // /api/cron/localize conserta depois. O de-lazy no serve já faz a hero
      // aparecer mesmo antes de localizar.
      const locDomain = domain;
      const locSlug = merged.slug;
      const locTitle = content.title;
      after(async () => {
        try {
          const st = await localizePage(locDomain, locSlug);
          if (st.total > 0 && st.localized === 0) {
            await logActivity(
              "wp.localize.fail",
              locTitle,
              `0/${st.total} assets localizados (storage indisponível?)`
            ).catch(() => {});
          }
        } catch (e) {
          await logActivity(
            "wp.localize.fail",
            locTitle,
            e instanceof Error ? e.message : "erro na localização"
          ).catch(() => {});
        }
      });

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
          ? `Atualizada: ${content.title} — reotimizando imagens em 2º plano`
          : published
          ? `Copiada e publicada: ${content.title} — otimizando imagens em 2º plano`
          : `Copiada: ${content.title} — otimizando imagens em 2º plano`,
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
