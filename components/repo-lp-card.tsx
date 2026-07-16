import { ExternalLink, GitBranch } from "lucide-react";
import { clsx } from "clsx";
import { accentClasses } from "@/lib/landing-pages";
import type { LpHtmlEntry } from "@/lib/lp-html-registry";
import { sourceColors, sourceLabel } from "@/lib/page-catalog-core";

/**
 * Card read-only das LPs servidas de lp-html/ (editadas por commit no repo,
 * sem CRUD no painel). Mostra visitas/leads quando disponíveis.
 */
export function RepoLpCard({
  entry,
  visits,
  leads,
}: {
  entry: LpHtmlEntry;
  visits?: number;
  leads?: number;
}) {
  const src = sourceColors["lp-html"];
  return (
    <article className="group bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#2a2a2a] transition">
      <div
        className={clsx(
          "h-24 bg-gradient-to-br",
          accentClasses[entry.accent ?? "rose"]
        )}
      />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              /{entry.slug}
            </p>
            <h3 className="font-semibold text-lg text-white mt-1 tracking-tight truncate">
              {entry.title}
            </h3>
          </div>
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 shrink-0",
              src.bg,
              src.text
            )}
          >
            <span className={clsx("w-1.5 h-1.5 rounded-full", src.dot)} />
            {sourceLabel["lp-html"]}
          </span>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed flex items-center gap-1.5">
          <GitBranch size={11} strokeWidth={2} className="shrink-0" />
          <span className="font-mono truncate">{entry.htmlFile}</span>
        </p>

        {(visits !== undefined || leads !== undefined) && (
          <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
            {visits !== undefined && (
              <span>
                <span className="text-white font-semibold">{visits}</span>{" "}
                visitas
              </span>
            )}
            {leads !== undefined && leads > 0 && (
              <span>
                <span className="text-emerald-300 font-semibold">{leads}</span>{" "}
                leads
              </span>
            )}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-[#1a1a1a] flex items-center justify-between gap-3">
          <a
            href={`/${entry.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white hover:text-blue-400 flex items-center gap-1.5 transition"
          >
            Abrir página
            <ExternalLink size={13} strokeWidth={2.2} />
          </a>
          <span className="text-[11px] text-neutral-600">
            editada via commit
          </span>
        </div>
      </div>
    </article>
  );
}
