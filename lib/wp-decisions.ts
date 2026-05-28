import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type WpDecision = "copy" | "ignore" | "pending";

const FILE = path.resolve(process.cwd(), "data/wp-decisions.json");

export async function loadDecisions(): Promise<Record<string, WpDecision>> {
  try {
    const content = await fs.readFile(FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function saveDecision(
  key: string,
  decision: WpDecision
): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const current = await loadDecisions();
  if (decision === "pending") {
    delete current[key];
  } else {
    current[key] = decision;
  }
  await fs.writeFile(FILE, JSON.stringify(current, null, 2), "utf-8");
}

export async function replaceAllDecisions(
  next: Record<string, WpDecision>
): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const clean: Record<string, WpDecision> = {};
  for (const [k, v] of Object.entries(next)) {
    if (v !== "pending") clean[k] = v;
  }
  await fs.writeFile(FILE, JSON.stringify(clean, null, 2), "utf-8");
}
