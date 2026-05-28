import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import {
  type LandingPage,
  statusLabel,
  statusColors,
  accentClasses,
} from "@/lib/landing-pages";

export function LpCard({ lp }: { lp: LandingPage }) {
  const style = statusColors[lp.status];

  return (
    <article className="group bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#2a2a2a] transition">
      <div
        className={clsx(
          "h-24 bg-gradient-to-br",
          accentClasses[lp.accent]
        )}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              /{lp.slug}
            </p>
            <h3 className="font-semibold text-lg text-white mt-1 tracking-tight truncate">
              {lp.name}
            </h3>
          </div>
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 shrink-0",
              style.bg,
              style.text
            )}
          >
            <span className={clsx("w-1.5 h-1.5 rounded-full", style.dot)} />
            {statusLabel[lp.status]}
          </span>
        </div>

        {lp.tagline && (
          <p className="text-sm text-neutral-300 font-medium mb-2">
            {lp.tagline}
          </p>
        )}
        {lp.description && (
          <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
            {lp.description}
          </p>
        )}

        {lp.stack && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-[#161616] text-neutral-400">
              {lp.stack}
            </span>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-[#1a1a1a] flex items-center justify-between gap-3">
          <Link
            href={`/lps/${lp.slug}`}
            className="text-sm font-semibold text-white hover:text-blue-400 flex items-center gap-1.5 transition"
          >
            Abrir detalhes
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
          {lp.devUrl && (
            <a
              href={lp.devUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-neutral-500 hover:text-white flex items-center gap-1.5 transition"
            >
              {lp.devUrl.replace("http://", "")}
              <ExternalLink size={11} strokeWidth={2} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
