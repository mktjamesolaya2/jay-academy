import "server-only";
import { kvGet, kvSet } from "./storage";
import { getCurrentUser } from "./auth";

export type ActivityKind =
  | "wp.copy"
  | "wp.delete"
  | "wp.publish"
  | "wp.unpublish"
  | "wp.categorize"
  | "wp.edit"
  | "lp.create"
  | "lp.update"
  | "lp.delete"
  | "lp.duplicate"
  | "lp.restore"
  | "user.promote"
  | "user.demote"
  | "user.delete";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  userId: string;
  userName: string;
  target: string; // ex: "lips-sense" ou "Magic Shadow 3"
  details?: string; // texto livre opcional
  at: string; // ISO timestamp
};

const KEY = "activity:log";
const MAX_ENTRIES = 200;

/**
 * Loga uma atividade. Pega o usuário da sessão atual.
 * Nunca lança — se o KV falhar, perdemos o log mas não quebramos a ação.
 */
export async function logActivity(
  kind: ActivityKind,
  target: string,
  details?: string
): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const entry: ActivityEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      userId: user.id,
      userName: user.name,
      target,
      details,
      at: new Date().toISOString(),
    };
    const existing = (await kvGet<ActivityEntry[]>(KEY)) || [];
    const next = [entry, ...existing].slice(0, MAX_ENTRIES);
    await kvSet(KEY, next);
  } catch {
    // silencioso: log não pode quebrar a operação principal
  }
}

export async function readActivityLog(
  limit = 30
): Promise<ActivityEntry[]> {
  const entries = (await kvGet<ActivityEntry[]>(KEY)) || [];
  return entries.slice(0, limit);
}

export function describeActivity(entry: ActivityEntry): string {
  const t = entry.target;
  switch (entry.kind) {
    case "wp.copy":
      return `copiou a página "${t}" do WordPress`;
    case "wp.delete":
      return `excluiu a página "${t}"`;
    case "wp.publish":
      return `publicou "${t}"`;
    case "wp.unpublish":
      return `despublicou "${t}"`;
    case "wp.categorize":
      return `categorizou "${t}"${entry.details ? ` como ${entry.details}` : ""}`;
    case "wp.edit":
      return `editou "${t}"${entry.details ? ` — ${entry.details}` : ""}`;
    case "lp.create":
      return `criou a LP "${t}"`;
    case "lp.update":
      return `atualizou a LP "${t}"`;
    case "lp.delete":
      return `excluiu a LP "${t}"`;
    case "lp.duplicate":
      return `duplicou a LP "${t}"`;
    case "lp.restore":
      return `restaurou a LP "${t}"`;
    case "user.promote":
      return `promoveu ${t} a admin`;
    case "user.demote":
      return `removeu admin de ${t}`;
    case "user.delete":
      return `excluiu o usuário ${t}`;
  }
}
