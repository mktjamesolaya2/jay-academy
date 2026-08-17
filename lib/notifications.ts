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

/**
 * Notificações = leads novos + pedidos de atendimento humano no suporte.
 *
 * ⚠️ O pedido de humano vem PRIMEIRO na lista: tem alguém esperando resposta do
 * outro lado. Lead pode esperar; gente parada numa conversa, não.
 */
export async function getNotifications(limit = 15): Promise<Notification[]> {
  const entries = await readActivityLog(80);
  const suporte = entries
    .filter((e) => e.kind === "suporte.humano")
    .map((e) => ({
      id: e.id,
      title: "Suporte: querem falar com atendente",
      detail: stripTags(e.details || e.target),
      at: e.at,
      href: "/suporte",
    }));
  const leads = entries
    .filter((e) => e.kind === "form.submission")
    .map((e) => ({
      id: e.id,
      title: `Novo lead — ${e.userName}`,
      detail: `em ${stripTags(e.target)}`,
      at: e.at,
      href: "/leads",
    }));
  return [...suporte, ...leads].slice(0, limit);
}

/** "Novos" = últimas 24h (pra mostrar a bolinha no sino). */
export function unreadCount(notifications: Notification[]): number {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return notifications.filter((n) => new Date(n.at).getTime() >= cutoff).length;
}
