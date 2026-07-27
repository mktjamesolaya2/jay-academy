import Link from "next/link";
import { ArrowLeft, Globe, Lock, LayoutGrid } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ConfirmSubmit } from "@/components/wp-manage-buttons";
import { WpManageList } from "@/components/wp-manage-list";
import { ImportByLink } from "@/components/import-by-link";
import { listSaved } from "@/lib/wp-content-storage";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { publishAllAction, unpublishAllAction } from "./manage-actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Gestão das páginas migradas do WordPress (cópias completas no KV, servidas
// em /[slug]). A antiga seção "Importar do WordPress" — que consultava o WP
// ao vivo — foi removida em 07/2026: a migração terminou e o servidor
// WordPress será desligado.
export default async function WpPagesHub() {
  const [saved, me] = await Promise.all([listSaved(), getCurrentUser()]);

  const userCanEdit = canEdit(me);

  const publishedCount = saved.filter((s) => s.published).length;
  const unpublishedCount = saved.length - publishedCount;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pro dashboard
          </Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                Páginas copiadas
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
                {saved.length} página{saved.length === 1 ? "" : "s"}
              </h2>
              <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
                Páginas copiadas de qualquer URL — o conteúdo vive aqui no
                portal, independente do site de origem. Publicar libera a URL
                pública <span className="text-neutral-300 font-mono">/[slug]</span>.
              </p>
            </div>
            {userCanEdit && <ImportByLink />}
          </div>
        </header>

        {/* ═══════════ GERENCIAR ═══════════ */}
        <section id="gerenciar">
          <div className="px-5 pt-7 pb-4 lg:px-10">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-sky-400/80 font-semibold flex items-center gap-1.5">
                  <LayoutGrid size={12} strokeWidth={2.5} />
                  Gerenciar copiadas
                </p>
                <p className="text-neutral-400 mt-1.5 max-w-2xl text-[14px]">
                  Busque, filtre e gerencie em lote. Publicar libera a URL
                  pública.
                </p>
              </div>
              {userCanEdit && saved.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {unpublishedCount > 0 && (
                    <form action={publishAllAction}>
                      <ConfirmSubmit
                        pendingLabel="Publicando..."
                        confirmMessage={`Publicar todas as ${unpublishedCount} páginas ainda não publicadas?`}
                        className="btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold"
                        icon={<Globe size={14} strokeWidth={2.5} />}
                      >
                        Publicar todas ({unpublishedCount})
                      </ConfirmSubmit>
                    </form>
                  )}
                  {publishedCount > 0 && (
                    <form action={unpublishAllAction}>
                      <ConfirmSubmit
                        pendingLabel="Despublicando..."
                        confirmMessage={`Despublicar todas as ${publishedCount} páginas publicadas?`}
                        className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-300 hover:text-rose-200"
                        icon={<Lock size={14} strokeWidth={2.5} />}
                      >
                        Despublicar todas
                      </ConfirmSubmit>
                    </form>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-5 max-w-xl">
              <Stat label="Total" value={saved.length} tint="text-white" />
              <Stat
                label="Publicadas"
                value={publishedCount}
                tint="text-emerald-300"
              />
              <Stat
                label="Não publicadas"
                value={unpublishedCount}
                tint="text-neutral-300"
              />
            </div>
          </div>

          <div className="px-5 pb-8 lg:px-10">
            {saved.length === 0 ? (
              <div className="border border-dashed border-[#262626] rounded-2xl py-16 text-center">
                <LayoutGrid
                  size={28}
                  strokeWidth={1.6}
                  className="mx-auto text-neutral-600 mb-3"
                />
                <p className="text-neutral-300 font-semibold">
                  Nenhuma página copiada ainda
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  As páginas que você copiar (do WordPress ou de qualquer site) aparecem aqui.
                </p>
              </div>
            ) : (
              <WpManageList pages={saved} canEdit={userCanEdit} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold">
        {label}
      </p>
      <p className={`text-2xl font-semibold tracking-[-0.02em] mt-1 ${tint}`}>
        {value}
      </p>
    </div>
  );
}
