import { NextResponse } from "next/server";
import { listSaved, loadContent } from "@/lib/wp-content-storage";
import { localizePage, buildSlugToPublic } from "@/lib/wp-localize";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";
// ⚠️ 300s: é o conserto de quem ficou pra trás. Com 60s ele mal dava conta
// de duas páginas, e a fila só andava no dia seguinte.
export const maxDuration = 300;

// Quantas páginas localizar por execução. Cada uma baixa dezenas–centenas de
// assets; 2 cabe no teto de 60s da function (mesmo valor do backfill manual).
/**
 * Quantas páginas o cron conserta por execução.
 *
 * ⚠️ Era 2. Com uma execução por dia, três páginas pendentes levavam dois
 * dias pra ficar prontas — e nesse meio tempo elas dependem do site de origem
 * continuar no ar. Com 300s de orçamento dá pra fazer bem mais.
 */
const BATCH = 8;

/**
 * Rede de segurança da localização. Roda via Vercel Cron (ver vercel.json).
 *
 * Localizar (baixar os assets do WP pro storage) saiu do caminho síncrono da
 * cópia — lá roda em background com after(), mas páginas grandes podem não
 * terminar. Este worker pega as páginas que ainda NÃO estão localizadas
 * (`localizedAt` ausente) e localiza um lote pequeno por execução, retomando de
 * onde parou nas próximas rodadas. Assim toda LP copiada acaba independente do
 * WP (rápida) sem depender de ninguém abrir a URL de backfill manual.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const saved = await listSaved();

  // Descobre quais ainda precisam localizar. Publicadas primeiro (estão no ar).
  const pending: { domain: (typeof saved)[number]["domain"]; slug: string; published: boolean }[] = [];
  for (const s of saved) {
    const c = await loadContent(s.domain, s.slug);
    if (!c || c.trashed) continue;
    if (!c.localizedAt) pending.push({ domain: s.domain, slug: s.slug, published: !!c.published });
  }
  pending.sort((a, b) => Number(b.published) - Number(a.published));

  const batch = pending.slice(0, BATCH);
  const slugToPublic = await buildSlugToPublic();
  const done: { slug: string; localized: number; failed: number }[] = [];

  for (const pg of batch) {
    try {
      const st = await localizePage(pg.domain, pg.slug, { slugToPublic });
      done.push({ slug: pg.slug, localized: st.localized, failed: st.failed });
      if (st.total > 0 && st.localized === 0) {
        await logActivity(
          "wp.localize.fail",
          pg.slug,
          `cron: 0/${st.total} assets (storage indisponível?)`
        ).catch(() => {});
      }
    } catch (e) {
      done.push({ slug: pg.slug, localized: 0, failed: -1 });
      await logActivity(
        "wp.localize.fail",
        pg.slug,
        e instanceof Error ? e.message : "cron: erro"
      ).catch(() => {});
    }
  }

  const totalLocalized = done.reduce((n, d) => n + d.localized, 0);
  if (totalLocalized > 0) {
    await logActivity(
      "wp.localize",
      "Cron",
      `${totalLocalized} assets localizados (${done.length} página(s))`
    ).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    pendingTotal: pending.length,
    processed: done.length,
    remaining: Math.max(0, pending.length - batch.length),
    done,
    ranAt: new Date().toISOString(),
  });
}
