import "server-only";
import { kvGet, kvSet } from "./storage";

export type ProjectGroup = {
  id: string;
  name: string;
  /** Chave de gradiente (mesmas das LPs): pink-orange, purple-fuchsia, etc. */
  accent: string;
  createdAt: string;
};

const GROUPS_KEY = "project-groups:list";
const ASSIGN_KEY = "project-groups:assign"; // Record<projectKey, groupId>

export const GROUP_ACCENTS = [
  "pink-orange",
  "purple-fuchsia",
  "amber-orange",
  "blue-indigo",
  "rose",
  "gold-black",
  "emerald",
] as const;

export async function listGroups(): Promise<ProjectGroup[]> {
  const groups = (await kvGet<ProjectGroup[]>(GROUPS_KEY)) ?? [];
  return [...groups].sort((a, b) => a.name.localeCompare(b.name));
}

export async function createGroup(
  name: string,
  newId: () => string,
  accent?: string
): Promise<ProjectGroup> {
  const groups = (await kvGet<ProjectGroup[]>(GROUPS_KEY)) ?? [];
  const acc =
    accent && GROUP_ACCENTS.includes(accent as (typeof GROUP_ACCENTS)[number])
      ? accent
      : GROUP_ACCENTS[groups.length % GROUP_ACCENTS.length];
  const group: ProjectGroup = {
    id: `grp-${newId()}`,
    name: name.trim() || "Sem nome",
    accent: acc,
    createdAt: new Date().toISOString(),
  };
  await kvSet(GROUPS_KEY, [...groups, group]);
  return group;
}

export async function renameGroup(id: string, name: string): Promise<void> {
  const groups = (await kvGet<ProjectGroup[]>(GROUPS_KEY)) ?? [];
  await kvSet(
    GROUPS_KEY,
    groups.map((g) => (g.id === id ? { ...g, name: name.trim() || g.name } : g))
  );
}

export async function setGroupAccent(id: string, accent: string): Promise<void> {
  const groups = (await kvGet<ProjectGroup[]>(GROUPS_KEY)) ?? [];
  await kvSet(
    GROUPS_KEY,
    groups.map((g) => (g.id === id ? { ...g, accent } : g))
  );
}

export async function deleteGroup(id: string): Promise<void> {
  const groups = (await kvGet<ProjectGroup[]>(GROUPS_KEY)) ?? [];
  await kvSet(
    GROUPS_KEY,
    groups.filter((g) => g.id !== id)
  );
  // Remove esse grupo das atribuições (os projetos continuam em "Todos").
  const assign = (await kvGet<Record<string, string[]>>(ASSIGN_KEY)) ?? {};
  let changed = false;
  for (const k of Object.keys(assign)) {
    const next = (assign[k] || []).filter((g) => g !== id);
    if (next.length !== (assign[k] || []).length) {
      if (next.length) assign[k] = next;
      else delete assign[k];
      changed = true;
    }
  }
  if (changed) await kvSet(ASSIGN_KEY, assign);
}

/** Mapa projectKey → lista de grupos a que pertence (um projeto pode estar em
 * várias pastas; e continua sempre em "Todos os projetos"). */
export async function getAssignments(): Promise<Record<string, string[]>> {
  return (await kvGet<Record<string, string[]>>(ASSIGN_KEY)) ?? {};
}

/** Liga/desliga um projeto numa pasta (toggle). Não remove de "Todos". */
export async function toggleProjectGroup(
  projectKey: string,
  groupId: string
): Promise<void> {
  const assign = (await kvGet<Record<string, string[]>>(ASSIGN_KEY)) ?? {};
  const cur = assign[projectKey] || [];
  const next = cur.includes(groupId)
    ? cur.filter((g) => g !== groupId)
    : [...cur, groupId];
  if (next.length) assign[projectKey] = next;
  else delete assign[projectKey];
  await kvSet(ASSIGN_KEY, assign);
}
