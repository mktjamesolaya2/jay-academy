"use client";

import { Search, Lightbulb } from "lucide-react";
import Link from "next/link";
import { SearchModal } from "./search-modal";
import { NotificationsBell } from "./notifications-bell";
import { useEffect, useState } from "react";
import { type LandingPage } from "@/lib/landing-pages";
import { type SavedSummary } from "@/lib/wp-content-storage";
import type { Notification } from "@/lib/notifications";

export function DashboardTopbar({
  landingPages,
  savedWp,
  notifications = [],
  unread = 0,
}: {
  landingPages: LandingPage[];
  savedWp: SavedSummary[];
  notifications?: Notification[];
  unread?: number;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="h-16 border-b border-[#1f1f1f] bg-[#0a0a0a] pl-16 lg:pl-6 pr-4 lg:pr-6 flex items-center gap-3 lg:gap-4 shrink-0">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-md flex items-center gap-2 bg-[#0f0f0f] border border-[#1f1f1f] hover:border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:text-neutral-300 transition"
        >
          <Search size={14} strokeWidth={2} />
          <span className="flex-1 text-left">Buscar tudo...</span>
          <kbd className="text-[10px] font-mono text-neutral-600 bg-[#161616] border border-[#1f1f1f] rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>

        <div className="flex-1" />

        <Link
          href="/sugestoes"
          className="w-9 h-9 rounded-md flex items-center justify-center text-neutral-400 hover:text-amber-300 hover:bg-[#161616] transition"
          aria-label="Sugestões"
          title="Sugestões"
        >
          <Lightbulb size={15} strokeWidth={2} />
        </Link>

        <NotificationsBell notifications={notifications} unread={unread} />
      </header>

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        landingPages={landingPages}
        savedWp={savedWp}
      />
    </>
  );
}
