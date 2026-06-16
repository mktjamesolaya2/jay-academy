import "server-only";

export type VercelDeploy = {
  id: string;
  state: string; // READY, BUILDING, ERROR, QUEUED, CANCELED, INITIALIZING
  url: string;
  createdAt: number;
  commitMessage?: string;
  branch?: string;
};

type RawDeploy = {
  uid?: string;
  state?: string;
  readyState?: string;
  url?: string;
  created?: number;
  createdAt?: number;
  meta?: { githubCommitMessage?: string; githubCommitRef?: string };
};

const TOKEN = process.env.VERCEL_API_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TEAM_ID = process.env.VERCEL_TEAM_ID;

export function hasVercelConfig(): boolean {
  return !!TOKEN && !!PROJECT_ID;
}

/**
 * Busca os deploys recentes do projeto na API da Vercel.
 * Retorna null se não houver token/projeto configurado (mostra o placeholder).
 */
export async function getRecentDeploys(
  limit = 6
): Promise<VercelDeploy[] | null> {
  if (!TOKEN || !PROJECT_ID) return null;
  try {
    const params = new URLSearchParams({
      projectId: PROJECT_ID,
      limit: String(limit),
    });
    if (TEAM_ID) params.set("teamId", TEAM_ID);

    const res = await fetch(
      `https://api.vercel.com/v6/deployments?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${TOKEN}` },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { deployments?: RawDeploy[] };
    return (data.deployments ?? []).map((d) => ({
      id: d.uid ?? "",
      state: (d.state || d.readyState || "—").toUpperCase(),
      url: d.url ? `https://${d.url}` : "",
      createdAt: d.created ?? d.createdAt ?? 0,
      commitMessage: d.meta?.githubCommitMessage,
      branch: d.meta?.githubCommitRef,
    }));
  } catch {
    return null;
  }
}
