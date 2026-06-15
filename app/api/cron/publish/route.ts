import { NextResponse } from "next/server";
import {
  listSaved,
  loadContent,
  setPublished,
  unsetPublished,
  saveContent,
} from "@/lib/wp-content-storage";
import { ensurePageSummary } from "@/lib/page-summary";
import { logActivity } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

/**
 * Worker do agendamento. Roda via Vercel Cron (ver vercel.json).
 * Publica/despublica as páginas cuja hora agendada já chegou.
 */
export async function GET(req: Request) {
  // Segurança: se CRON_SECRET estiver setado (Vercel), exige o header.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const now = Date.now();
  const saved = await listSaved();
  let published = 0;
  let unpublished = 0;

  for (const s of saved) {
    let content = await loadContent(s.domain, s.slug);
    if (!content) continue;

    // Publicação agendada
    if (
      content.scheduledPublishAt &&
      Date.parse(content.scheduledPublishAt) <= now
    ) {
      content.scheduledPublishAt = undefined;
      if (!content.published) {
        const publicSlug = content.publicSlug || content.slug;
        await setPublished(content, publicSlug);
        await ensurePageSummary(s.domain, s.slug);
        published++;
      } else {
        await saveContent(content);
      }
      content = await loadContent(s.domain, s.slug);
    }

    // Despublicação agendada
    if (
      content &&
      content.scheduledUnpublishAt &&
      Date.parse(content.scheduledUnpublishAt) <= now
    ) {
      content.scheduledUnpublishAt = undefined;
      if (content.published) {
        await unsetPublished(content);
        unpublished++;
      } else {
        await saveContent(content);
      }
    }
  }

  if (published || unpublished) {
    await logActivity(
      "wp.publish",
      "Agendador",
      `${published} publicada(s), ${unpublished} despublicada(s)`
    );
  }

  return NextResponse.json({
    ok: true,
    checked: saved.length,
    published,
    unpublished,
    ranAt: new Date(now).toISOString(),
  });
}
