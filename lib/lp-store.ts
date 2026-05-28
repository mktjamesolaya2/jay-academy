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
 *
 * Para LPs que existem no seed, sempre puxa os campos técnicos
 * (productionUrl, devUrl, devPort, stack, localPath) do seed — assim
 * mudanças no código refletem na UI sem precisar resetar o KV.
 * Os campos editáveis pelo admin (name, tagline, description, status)
 * ficam do que está no KV.
 */
export async function loadLps(): Promise<LandingPage[]> {
  const stored = await kvGet<LandingPage[]>(LPS_KEY);
  if (stored && stored.length > 0) {
    return stored.map((lp) => {
      const seed = SEED_LPS.find((s) => s.slug === lp.slug);
      if (!seed) return lp;
      return {
        ...lp,
        productionUrl: seed.productionUrl ?? lp.productionUrl,
        devUrl: seed.devUrl ?? lp.devUrl,
        devPort: seed.devPort ?? lp.devPort,
        stack: seed.stack || lp.stack,
        localPath: seed.localPath ?? lp.localPath,
      };
    });
  }
  // Seed inicial com os LPs hardcoded
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
