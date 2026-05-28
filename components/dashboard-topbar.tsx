"use client";

import { Search, Bell, HelpCircle } from "lucide-react";
import { SearchModal } from "./search-modal";
import { useEffect, useState } from "react";
import { type LandingPage } from "@/lib/landing-pages";
import { type SavedSummary } from "@/lib/wp-content-storage";

export function DashboardTopbar({
  landingPages,
  savedWp,
}: {
  landingPages: LandingPage[];
  savedWp: SavedSummary[];
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
      <header className="h-16 border-b border-[#1f1f1f] bg-[#0a0a0a] px-6 flex items-center gap-4 shrink-0">
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

        <button
          type="button"
          className="relative w-9 h-9 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
          aria-label="Notificações"
        >
          <Bell size={15} strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#0a0a0a]" />
        </button>

        <button
          type="button"
          className="w-9 h-9 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
          aria-label="Ajuda"
        >
          <HelpCircle size={15} strokeWidth={2} />
        </button>
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
