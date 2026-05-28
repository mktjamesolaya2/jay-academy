"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";

export function CollapsibleSection({
  title,
  count,
  copyCount,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  copyCount?: number;
  hint?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#121212] transition"
      >
        <span className="flex items-center gap-3 min-w-0">
          <ChevronDown
            size={14}
            strokeWidth={2.4}
            className={clsx(
              "transition-transform duration-200 text-neutral-400 shrink-0",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
          <span className="min-w-0">
            <span className="text-base font-semibold text-white tracking-[-0.02em]">
              {title}
            </span>
            <span className="text-neutral-500 font-medium ml-2">({count})</span>
            {hint && (
              <span className="block text-[11px] text-neutral-500 font-medium mt-0.5">
                {hint}
              </span>
            )}
          </span>
        </span>
        {typeof copyCount === "number" && copyCount > 0 && (
          <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/25 rounded-full px-2.5 py-1 shrink-0">
            {copyCount} pra copiar
          </span>
        )}
      </button>
      {open && (
        <div className="border-t border-[#1f1f1f]">{children}</div>
      )}
    </section>
  );
}
