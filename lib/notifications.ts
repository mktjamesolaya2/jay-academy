import "server-only";
import { readActivityLog } from "./activity-log";

export type Notification = {
  id: string;
  title: string;
  detail: string;
  at: string;
  href: string;
};

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

/** Notificações = leads novos (submissões de formulário). */
export async function getNotifications(limit = 15): Promise<Notification[]> {
  const entries = await readActivityLog(80);
  return entries
    .filter((e) => e.kind === "form.submission")
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      title: `Novo lead — ${e.userName}`,
      detail: `em ${stripTags(e.target)}`,
      at: e.at,
      href: "/forms",
    }));
}

/** "Novos" = últimas 24h (pra mostrar a bolinha no sino). */
export function unreadCount(notifications: Notification[]): number {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return notifications.filter((n) => new Date(n.at).getTime() >= cutoff).length;
}
