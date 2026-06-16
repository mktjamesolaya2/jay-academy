"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Inbox, Users } from "lucide-react";
import { formatDateTimeBR } from "@/lib/format-date";
import type { Notification } from "@/lib/notifications";

export function NotificationsBell({
  notifications,
  unread,
}: {
  notifications: Notification[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
        aria-label="Notificações"
      >
        <Bell size={15} strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#0a0a0a]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-w-[90vw] bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl shadow-2xl z-[60] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
            <h3 className="text-sm font-semibold text-white">Notificações</h3>
            {unread > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300 bg-blue-500/10 ring-1 ring-blue-500/25 px-1.5 py-0.5 rounded">
                {unread} hoje
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Inbox
                size={22}
                strokeWidth={1.6}
                className="mx-auto text-neutral-600 mb-2"
              />
              <p className="text-xs text-neutral-500">
                Sem novidades. Leads novos aparecem aqui.
              </p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#161616]">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 px-4 py-3 hover:bg-[#121212] transition"
                >
                  <span className="w-7 h-7 rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Users size={12} strokeWidth={2.2} className="text-emerald-300" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {n.detail}
                    </p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">
                      {formatDateTimeBR(n.at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/forms"
            onClick={() => setOpen(false)}
            className="block text-center text-[11px] font-semibold text-neutral-400 hover:text-white transition py-2.5 border-t border-[#1f1f1f]"
          >
            Ver todos os leads
          </Link>
        </div>
      )}
    </div>
  );
}
