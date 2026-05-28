import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { EmptyState } from "@/components/empty-state";
import { typeLabel } from "@/lib/landing-pages";
import { loadLps } from "@/lib/lp-store";
import { listSaved } from "@/lib/wp-content-storage";
import {
  restoreFromTrashAction,
  permanentDeleteAction,
} from "@/app/lps/actions";

export const dynamic = "force-dynamic";

export default async function LixeiraPage() {
  const [landingPages, savedWp] = await Promise.all([loadLps(), listSaved()]);
  const trashed = landingPages.filter((lp) => lp.trashed);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar landingPages={landingPages} savedWp={savedWp} />

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
              Lixeira
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {trashed.length === 0
                ? "Nada na lixeira"
                : `${trashed.length} ${trashed.length === 1 ? "item" : "itens"}`}
            </p>
          </div>

          {trashed.length === 0 ? (
            <EmptyState
              icon={Trash2}
              title="Lixeira vazia"
              description="Páginas que você mover pra lixeira vão aparecer aqui. Dá pra restaurar ou excluir permanentemente."
            />
          ) : (
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1.5fr_100px_140px_auto] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[0.12em] text-neutral-600 font-semibold border-b border-[#1f1f1f]">
                <div>Nome</div>
                <div>Tipo</div>
                <div>Movida em</div>
                <div className="text-right">Ações</div>
              </div>
              {trashed.map((lp) => (
                <div
                  key={lp.slug}
                  className="grid grid-cols-[1.5fr_100px_140px_auto] gap-3 items-center px-5 py-3 border-b border-[#161616] last:border-0 hover:bg-[#101010] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-12 rounded-md bg-gradient-to-br from-rose-500/40 to-rose-700/40 ring-1 ring-rose-500/25 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {lp.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        /{lp.slug}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] bg-[#161616] text-neutral-300 px-2 py-1 rounded inline-block w-fit">
                    {typeLabel[lp.type]}
                  </span>
                  <p className="text-xs text-neutral-500">
                    {lp.trashedAt
                      ? new Date(lp.trashedAt).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <form action={restoreFromTrashAction}>
                      <input type="hidden" name="slug" value={lp.slug} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20 transition"
                      >
                        <RotateCcw size={11} strokeWidth={2.4} />
                        Restaurar
                      </button>
                    </form>
                    <DeleteForeverButton slug={lp.slug} name={lp.name} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {trashed.length > 0 && (
            <div className="mt-5 bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 max-w-xl">
              <AlertTriangle
                size={14}
                strokeWidth={2.2}
                className="text-rose-300 mt-0.5 shrink-0"
              />
              <p className="text-xs text-neutral-400 leading-relaxed">
                <span className="text-rose-300 font-semibold">
                  Exclusão permanente é irreversível.
                </span>{" "}
                Páginas excluídas saem da lixeira e do código —
                <span className="text-neutral-300">
                  {" "}
                  não dá pra recuperar depois.
                </span>
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function DeleteForeverButton({ slug, name }: { slug: string; name: string }) {
  return (
    <form action={permanentDeleteAction}>
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        formNoValidate
        onClick={(e) => {
          if (
            !confirm(
              `Excluir "${name}" PERMANENTEMENTE? Isso não pode ser desfeito.`
            )
          ) {
            e.preventDefault();
          }
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition"
      >
        <Trash2 size={11} strokeWidth={2.4} />
        Excluir
      </button>
    </form>
  );
}
