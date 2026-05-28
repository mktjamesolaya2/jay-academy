import Link from "next/link";
import { ArrowRight, Globe, Layout, FileText, Inbox } from "lucide-react";
import type { SavedSummary, PlacementType } from "@/lib/wp-content-storage";

const placementMeta: Record<
  PlacementType,
  { label: string; tint: string; ring: string; icon: typeof Globe }
> = {
  website: {
    label: "Website",
    tint: "text-sky-300 bg-sky-500/10",
    ring: "ring-sky-500/25",
    icon: Globe,
  },
  lp: {
    label: "Landing page",
    tint: "text-violet-300 bg-violet-500/10",
    ring: "ring-violet-500/25",
    icon: Layout,
  },
  form: {
    label: "Formulário",
    tint: "text-amber-300 bg-amber-500/10",
    ring: "ring-amber-500/25",
    icon: FileText,
  },
};

export function WpSavedCard({ s }: { s: SavedSummary }) {
  const meta = s.placed ? placementMeta[s.placed] : null;
  const href = `/wp-pages/${s.domain}/${encodeURIComponent(s.slug)}`;

  return (
    <Link
      href={href}
      className="group block bg-[#0f0f0f] border border-[#1f1f1f] hover:border-neutral-700 rounded-2xl p-5 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold font-mono">
          /{s.slug}
        </span>
        {meta ? (
          <span
            className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${meta.tint} ring-1 ${meta.ring} rounded-full px-2 py-0.5`}
          >
            <meta.icon size={10} strokeWidth={2.4} />
            {meta.label}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500 bg-neutral-500/10 ring-1 ring-neutral-500/25 rounded-full px-2 py-0.5">
            <Inbox size={10} strokeWidth={2.4} />
            Sem categoria
          </span>
        )}
      </div>

      <h3
        className="font-semibold text-base text-white tracking-tight leading-tight line-clamp-2"
        dangerouslySetInnerHTML={{ __html: s.title }}
      />

      <p className="text-[11px] text-neutral-500 font-medium mt-2">
        {s.domain === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br"}
      </p>

      <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
        <span className="text-[11px] text-neutral-600 font-medium">
          Copiada {new Date(s.fetchedAt).toLocaleDateString("pt-BR")}
        </span>
        <span className="text-xs font-semibold text-white inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
          Abrir
          <ArrowRight size={13} strokeWidth={2.2} />
        </span>
      </div>
    </Link>
  );
}
