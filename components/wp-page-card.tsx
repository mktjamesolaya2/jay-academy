import Link from "next/link";
import { ArrowRight, Globe, Lock } from "lucide-react";
import type { WpPageContent } from "@/lib/wp-content-storage";

type WpCardData = Pick<
  WpPageContent,
  "domain" | "slug" | "title" | "published" | "publicSlug"
>;

export function WpPageCard({ page }: { page: WpCardData }) {
  const publicSlug = page.publicSlug || page.slug;

  return (
    <article className="group bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden hover:border-[#2a2a2a] transition">
      <div className="h-24 bg-gradient-to-br from-blue-500/40 to-violet-500/40" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              /{page.slug}
            </p>
            <h3
              className="font-semibold text-lg text-white mt-1 tracking-tight truncate"
              dangerouslySetInnerHTML={{ __html: page.title }}
            />
          </div>
          {page.published ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 bg-emerald-500/10 text-emerald-300 ring-emerald-500/25 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Publicada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 bg-neutral-500/10 text-neutral-300 ring-neutral-500/25 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
              Rascunho
            </span>
          )}
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed">
          Copiada do WordPress · {page.domain === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br"}
        </p>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-[#161616] text-neutral-400 inline-flex items-center gap-1.5">
            {page.published ? (
              <>
                <Globe size={10} strokeWidth={2.4} />
                /p/{publicSlug}
              </>
            ) : (
              <>
                <Lock size={10} strokeWidth={2.4} />
                Sem URL pública
              </>
            )}
          </span>
        </div>

        <div className="mt-5 pt-4 border-t border-[#1a1a1a] flex items-center justify-between gap-3">
          <Link
            href={`/wp-pages/${page.domain}/${encodeURIComponent(page.slug)}`}
            className="text-sm font-semibold text-white hover:text-blue-400 flex items-center gap-1.5 transition"
          >
            Abrir detalhes
            <ArrowRight size={14} strokeWidth={2.2} />
          </Link>
          <Link
            href={`/wp-pages/${page.domain}/${encodeURIComponent(page.slug)}/edit`}
            className="text-xs font-medium text-neutral-500 hover:text-white transition"
          >
            Editar
          </Link>
        </div>
      </div>
    </article>
  );
}
