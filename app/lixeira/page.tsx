import { Trash2, RotateCcw, AlertTriangle, FileText, Globe, Layout } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { EmptyState } from "@/components/empty-state";
import { ConfirmButton } from "@/components/confirm-button";
import { typeLabel } from "@/lib/landing-pages";
import { loadLps } from "@/lib/lp-store";
import { listSaved, listTrashed } from "@/lib/wp-content-storage";
import { listForms, listTrashedForms } from "@/lib/forms-store";
import {
  restoreFromTrashAction,
  permanentDeleteAction,
} from "@/app/lps/actions";
import {
  restoreWpPageAction,
  permanentDeleteWpPageAction,
} from "@/app/wp-pages/actions";
import {
  restoreFormAction,
  permanentDeleteFormAction,
} from "@/app/forms/actions";
import { formatDateTimeBR } from "@/lib/format-date";

export const dynamic = "force-dynamic";

export default async function LixeiraPage() {
  const [landingPages, savedWp, trashedWp, allForms, trashedForms] =
    await Promise.all([
      loadLps(),
      listSaved(),
      listTrashed(),
      listForms(),
      listTrashedForms(),
    ]);
  const trashedLps = landingPages.filter((lp) => lp.trashed);

  const total = trashedLps.length + trashedWp.length + trashedForms.length;

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
              {total === 0
                ? "Nada na lixeira"
                : `${total} ${total === 1 ? "item" : "itens"}`}
            </p>
          </div>

          {total === 0 ? (
            <EmptyState
              icon={Trash2}
              title="Lixeira vazia"
              description="Páginas, cópias do WordPress e formulários que você excluir aparecem aqui. Dá pra restaurar ou excluir permanentemente."
            />
          ) : (
            <div className="space-y-6">
              {trashedLps.length > 0 && (
                <TrashSection title="Páginas criadas no portal" count={trashedLps.length}>
                  {trashedLps.map((lp) => (
                    <TrashRow
                      key={lp.slug}
                      icon={Layout}
                      title={lp.name}
                      sub={`/${lp.slug}`}
                      badge={typeLabel[lp.type]}
                      trashedAt={lp.trashedAt}
                      restoreForm={
                        <form action={restoreFromTrashAction}>
                          <input type="hidden" name="slug" value={lp.slug} />
                          <RestoreButton />
                        </form>
                      }
                      deleteForm={
                        <form action={permanentDeleteAction}>
                          <input type="hidden" name="slug" value={lp.slug} />
                          <PermanentDeleteButton itemName={lp.name} />
                        </form>
                      }
                    />
                  ))}
                </TrashSection>
              )}

              {trashedWp.length > 0 && (
                <TrashSection title="Cópias do WordPress" count={trashedWp.length}>
                  {trashedWp.map((wp) => (
                    <TrashRow
                      key={`${wp.domain}_${wp.slug}`}
                      icon={Globe}
                      title={wp.title}
                      sub={`${wp.domain === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br"}/${wp.slug}`}
                      badge={wp.placed ? typeLabel[wp.placed] : "WP"}
                      trashedAt={wp.trashedAt}
                      restoreForm={
                        <form action={restoreWpPageAction}>
                          <input type="hidden" name="domain" value={wp.domain} />
                          <input type="hidden" name="slug" value={wp.slug} />
                          <RestoreButton />
                        </form>
                      }
                      deleteForm={
                        <form action={permanentDeleteWpPageAction}>
                          <input type="hidden" name="domain" value={wp.domain} />
                          <input type="hidden" name="slug" value={wp.slug} />
                          <PermanentDeleteButton
                            itemName={wp.title.replace(/<[^>]*>/g, "")}
                          />
                        </form>
                      }
                      titleIsHtml
                    />
                  ))}
                </TrashSection>
              )}

              {trashedForms.length > 0 && (
                <TrashSection title="Formulários" count={trashedForms.length}>
                  {trashedForms.map((f) => (
                    <TrashRow
                      key={f.id}
                      icon={FileText}
                      title={f.name}
                      sub={`/f/${f.slug}`}
                      badge="Form"
                      trashedAt={f.trashedAt}
                      restoreForm={
                        <form action={restoreFormAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <RestoreButton />
                        </form>
                      }
                      deleteForm={
                        <form action={permanentDeleteFormAction}>
                          <input type="hidden" name="id" value={f.id} />
                          <PermanentDeleteButton itemName={f.name} />
                        </form>
                      }
                    />
                  ))}
                </TrashSection>
              )}

              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 max-w-xl">
                <AlertTriangle
                  size={14}
                  strokeWidth={2.2}
                  className="text-rose-300 mt-0.5 shrink-0"
                />
                <p className="text-xs text-neutral-400 leading-relaxed">
                  <span className="text-rose-300 font-semibold">
                    Exclusão permanente é irreversível.
                  </span>{" "}
                  Itens excluídos saem da lixeira e do storage —{" "}
                  <span className="text-neutral-300">
                    não dá pra recuperar depois.
                  </span>
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function TrashSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="px-5 py-3 flex items-center gap-2.5 border-b border-[#1f1f1f]">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
          {count}
        </span>
      </div>
      <div>{children}</div>
    </section>
  );
}

function TrashRow({
  icon: Icon,
  title,
  sub,
  badge,
  trashedAt,
  restoreForm,
  deleteForm,
  titleIsHtml,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  sub: string;
  badge: string;
  trashedAt?: string;
  restoreForm: React.ReactNode;
  deleteForm: React.ReactNode;
  titleIsHtml?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.5fr_100px_140px_auto] gap-3 items-center px-5 py-3 border-b border-[#161616] last:border-0 hover:bg-[#101010] transition">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-12 rounded-md bg-gradient-to-br from-rose-500/30 to-rose-700/30 ring-1 ring-rose-500/20 shrink-0 flex items-center justify-center">
          <Icon size={13} strokeWidth={2.2} className="text-rose-200" />
        </span>
        <div className="min-w-0">
          {titleIsHtml ? (
            <p
              className="text-sm font-semibold text-white truncate"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          ) : (
            <p className="text-sm font-semibold text-white truncate">{title}</p>
          )}
          <p className="text-[11px] text-neutral-500 truncate font-mono">
            {sub}
          </p>
        </div>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] bg-[#161616] text-neutral-300 px-2 py-1 rounded inline-block w-fit">
        {badge}
      </span>
      <p className="text-xs text-neutral-500">
        {trashedAt ? formatDateTimeBR(trashedAt) : "—"}
      </p>
      <div className="flex items-center justify-end gap-2">
        {restoreForm}
        {deleteForm}
      </div>
    </div>
  );
}

function RestoreButton() {
  return (
    <ConfirmButton
      message="Restaurar item?"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20 transition disabled:opacity-60"
    >
      <RotateCcw size={11} strokeWidth={2.4} />
      Restaurar
    </ConfirmButton>
  );
}

function PermanentDeleteButton({ itemName }: { itemName: string }) {
  return (
    <ConfirmButton
      message={`Excluir "${itemName}" PERMANENTEMENTE? Isso não pode ser desfeito.`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition disabled:opacity-60"
    >
      <Trash2 size={11} strokeWidth={2.4} />
      Excluir
    </ConfirmButton>
  );
}
