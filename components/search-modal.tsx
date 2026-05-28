"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Layout,
  Globe,
  FileText,
  FileCode2,
  CornerDownLeft,
} from "lucide-react";
import { type LandingPage } from "@/lib/landing-pages";
import { type SavedSummary } from "@/lib/wp-content-storage";

type Result = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  kind: "lp" | "wp";
  icon: typeof Layout;
};

export function SearchModal({
  open,
  onClose,
  landingPages,
  savedWp,
}: {
  open: boolean;
  onClose: () => void;
  landingPages: LandingPage[];
  savedWp: SavedSummary[];
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = query.toLowerCase().trim();
    const all: Result[] = [
      ...landingPages.map((lp) => ({
        id: `lp-${lp.slug}`,
        title: lp.name,
        subtitle: `${lp.type === "website" ? "Website" : "Landing page"} · /${lp.slug}`,
        href: `/lps/${lp.slug}`,
        kind: "lp" as const,
        icon: lp.type === "website" ? Globe : Layout,
      })),
      ...savedWp.map((wp) => ({
        id: `wp-${wp.domain}-${wp.slug}`,
        title: wp.title.replace(/<[^>]*>/g, ""),
        subtitle: `WP · ${wp.domain === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br"}/${wp.slug}`,
        href: `/wp-pages/${wp.domain}/${encodeURIComponent(wp.slug)}`,
        kind: "wp" as const,
        icon: FileCode2,
      })),
    ];
    if (!q) return all.slice(0, 8);
    return all
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.subtitle.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, landingPages, savedWp]);

  useEffect(() => {
    if (selectedIndex >= results.length) setSelectedIndex(0);
  }, [results.length, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const r = results[selectedIndex];
        if (r) {
          router.push(r.href);
          onClose();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, selectedIndex, router, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1f1f1f]">
          <Search size={16} className="text-neutral-500" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas, LPs, formulários..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition"
          >
            <kbd className="text-[10px] font-mono bg-[#161616] border border-[#1f1f1f] rounded px-1.5 py-0.5">
              esc
            </kbd>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-500">
              Nada encontrado pra <span className="text-white">"{query}"</span>
            </div>
          ) : (
            results.map((r, i) => (
              <Link
                key={r.id}
                href={r.href}
                onClick={onClose}
                onMouseEnter={() => setSelectedIndex(i)}
                className={
                  selectedIndex === i
                    ? "flex items-center gap-3 px-4 py-2.5 bg-[#161616] text-white transition"
                    : "flex items-center gap-3 px-4 py-2.5 text-neutral-300 hover:bg-[#121212] transition"
                }
              >
                <span className="w-8 h-8 rounded-md bg-[#161616] flex items-center justify-center shrink-0">
                  <r.icon size={13} strokeWidth={2} className="text-neutral-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.title}</p>
                  <p className="text-[11px] text-neutral-500 truncate">
                    {r.subtitle}
                  </p>
                </div>
                {selectedIndex === i && (
                  <CornerDownLeft
                    size={12}
                    strokeWidth={2}
                    className="text-neutral-500"
                  />
                )}
              </Link>
            ))
          )}
        </div>

        <div className="border-t border-[#1f1f1f] px-4 py-2 flex items-center justify-between text-[10px] text-neutral-600">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="font-mono bg-[#161616] border border-[#1f1f1f] rounded px-1 py-0.5">↑↓</kbd>
              navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="font-mono bg-[#161616] border border-[#1f1f1f] rounded px-1 py-0.5">↵</kbd>
              abrir
            </span>
          </div>
          <span>{results.length} resultados</span>
        </div>
      </div>
    </div>
  );
}
