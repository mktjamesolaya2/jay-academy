import { ExternalLink, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { decideAction } from "@/app/wordpress/actions";
import { type WpDecision } from "@/lib/wp-decisions";
import { pageKey, type WpPage } from "@/lib/wp-api";

const buttonStyle: Record<WpDecision, string> = {
  copy: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25 hover:bg-emerald-500/25",
  ignore: "bg-neutral-500/15 text-neutral-400 ring-neutral-500/25 hover:bg-neutral-500/25",
  pending: "bg-rose-500/10 text-rose-300/80 ring-rose-500/20 hover:bg-rose-500/20",
};

const activeStyle: Record<WpDecision, string> = {
  copy: "bg-emerald-500/30 text-emerald-200 ring-emerald-400/40",
  ignore: "bg-neutral-500/30 text-neutral-200 ring-neutral-400/40",
  pending: "bg-neutral-500/5 text-neutral-600 ring-neutral-500/15 cursor-default",
};

const labelFor: Record<WpDecision, string> = {
  copy: "Copiar",
  ignore: "Ignorar",
  pending: "Desmarcar",
};

export function WpPageRow({
  page,
  decision,
  isSaved = false,
}: {
  page: WpPage;
  decision: WpDecision;
  isSaved?: boolean;
}) {
  const key = pageKey(page);

  return (
    <tr className="border-b border-[#161616] last:border-0 hover:bg-[#101010] transition">
      <td className="px-6 py-3.5 align-top">
        <div className="flex items-start gap-2">
          {isSaved && (
            <span
              title="Já copiada pro portal"
              className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300 bg-sky-500/10 ring-1 ring-sky-500/25 rounded-full px-2 py-0.5 shrink-0"
            >
              <CheckCircle2 size={10} strokeWidth={2.4} />
              Copiada
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm text-white font-semibold leading-tight line-clamp-2">
              {page.title}
            </p>
            <p className="text-[11px] text-neutral-500 font-mono mt-1 flex items-center gap-2">
              <span className="text-neutral-600">
                {page.domain === "main"
                  ? "jayacademy.com.br"
                  : "lp.jayacademy.com.br"}
              </span>
              <span>/{page.slug}</span>
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-3.5 align-top">
        <a
          href={page.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1 font-medium transition"
        >
          Ver no WP
          <ExternalLink size={10} strokeWidth={2} />
        </a>
      </td>
      <td className="px-6 py-3.5 align-top">
        <div className="flex items-center gap-1.5">
          {(["copy", "ignore", "pending"] as const).map((d) => {
            const isActive = decision === d;
            return (
              <form key={d} action={decideAction}>
                <input type="hidden" name="key" value={key} />
                <input type="hidden" name="decision" value={d} />
                <button
                  type="submit"
                  disabled={isActive && d === "pending"}
                  className={clsx(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold ring-1 transition",
                    isActive ? activeStyle[d] : buttonStyle[d]
                  )}
                >
                  {labelFor[d]}
                </button>
              </form>
            );
          })}
        </div>
      </td>
    </tr>
  );
}
