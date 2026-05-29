"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  loadDecisions,
  replaceAllDecisions,
  saveDecision,
  type WpDecision,
} from "@/lib/wp-decisions";
import { fetchAllWpPages, pageKey, type WpDomain } from "@/lib/wp-api";
import { suggestionForPage } from "@/lib/wp-categorize";
import { fetchPageContent } from "@/lib/wp-fetch-page";
import { listSaved, saveContent } from "@/lib/wp-content-storage";

export async function decideAction(formData: FormData) {
  await requireAdmin();
  const key = formData.get("key")?.toString() ?? "";
  const decision = formData.get("decision")?.toString() as WpDecision;
  if (!key || !decision) return;
  await saveDecision(key, decision);
  revalidatePath("/wordpress");
}

export async function applyAllSuggestionsAction() {
  await requireAdmin();
  const pages = await fetchAllWpPages();
  const batch: Record<string, WpDecision> = {};
  for (const page of pages) {
    batch[pageKey(page)] = suggestionForPage(page);
  }
  await replaceAllDecisions(batch);
  revalidatePath("/wordpress");
}

export async function clearAllDecisionsAction() {
  await requireAdmin();
  await replaceAllDecisions({});
  revalidatePath("/wordpress");
}

async function runCopy(
  targets: { domain: WpDomain; id: number }[]
): Promise<number> {
  const CONCURRENCY = 4;
  let copied = 0;
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ domain, id }) => {
        const content = await fetchPageContent(domain, id);
        if (content) {
          await saveContent(content);
          await logActivity("wp.copy", content.title || content.slug);
          copied++;
        }
      })
    );
  }
  return copied;
}

export async function copyMarkedPagesAction() {
  await requireAdmin();
  const decisions = await loadDecisions();
  const toCopy = Object.entries(decisions)
    .filter(([, d]) => d === "copy")
    .map(([key]) => {
      const [domain, idStr] = key.split(":");
      return { domain: domain as WpDomain, id: parseInt(idStr, 10) };
    });

  await runCopy(toCopy);
  revalidatePath("/wordpress");
  revalidatePath("/dashboard");
}

export async function copyOnlyNewPagesAction() {
  await requireAdmin();
  const [pages, decisions, saved] = await Promise.all([
    fetchAllWpPages(),
    loadDecisions(),
    listSaved(),
  ]);

  const savedSet = new Set(saved.map((s) => `${s.domain}:${s.slug}`));

  const toCopy = pages
    .filter((p) => decisions[pageKey(p)] === "copy")
    .filter((p) => !savedSet.has(`${p.domain}:${p.slug}`))
    .map((p) => ({ domain: p.domain, id: p.id }));

  await runCopy(toCopy);
  revalidatePath("/wordpress");
  revalidatePath("/dashboard");
}
