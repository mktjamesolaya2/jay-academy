import "server-only";
import { kvGet, kvSet } from "./storage";

export type WpDecision = "copy" | "ignore" | "pending";

const DECISIONS_KEY = "wp:decisions";

export async function loadDecisions(): Promise<Record<string, WpDecision>> {
  const stored = await kvGet<Record<string, WpDecision>>(DECISIONS_KEY);
  return stored || {};
}

export async function saveDecision(
  key: string,
  decision: WpDecision
): Promise<void> {
  const current = await loadDecisions();
  if (decision === "pending") {
    delete current[key];
  } else {
    current[key] = decision;
  }
  await kvSet(DECISIONS_KEY, current);
}

export async function replaceAllDecisions(
  next: Record<string, WpDecision>
): Promise<void> {
  const clean: Record<string, WpDecision> = {};
  for (const [k, v] of Object.entries(next)) {
    if (v !== "pending") clean[k] = v;
  }
  await kvSet(DECISIONS_KEY, clean);
}
