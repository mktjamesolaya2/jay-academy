import "server-only";
import { kvGet, kvSet } from "./storage";
import {
  landingPages as SEED_LPS,
  type LandingPage,
} from "./landing-pages";

const LPS_KEY = "lps:all";

/**
 * Lê as landing pages do storage.
 * Se vazio (primeira execução), faz seed com os dados iniciais do arquivo TS.
 */
export async function loadLps(): Promise<LandingPage[]> {
  const stored = await kvGet<LandingPage[]>(LPS_KEY);
  if (stored && stored.length > 0) {
    return stored;
  }
  // Seed inicial com os 3 LPs hardcoded
  await kvSet(LPS_KEY, SEED_LPS);
  return SEED_LPS;
}

export async function saveLps(lps: LandingPage[]): Promise<void> {
  await kvSet(LPS_KEY, lps);
}

export async function getLpFromStore(
  slug: string
): Promise<LandingPage | undefined> {
  const all = await loadLps();
  return all.find((lp) => lp.slug === slug);
}

export async function addLp(lp: LandingPage): Promise<void> {
  const all = await loadLps();
  if (all.find((x) => x.slug === lp.slug)) {
    throw new Error(`Já existe LP com slug "${lp.slug}"`);
  }
  all.push(lp);
  await saveLps(all);
}

export async function updateLp(
  slug: string,
  updates: Partial<LandingPage>
): Promise<void> {
  const all = await loadLps();
  const idx = all.findIndex((lp) => lp.slug === slug);
  if (idx === -1) throw new Error("LP não encontrada");
  all[idx] = { ...all[idx], ...updates };
  await saveLps(all);
}

export async function removeLp(slug: string): Promise<void> {
  const all = await loadLps();
  await saveLps(all.filter((lp) => lp.slug !== slug));
}
