import Link from "next/link";
import { ArrowLeft, Globe, Lock, LayoutGrid, Upload } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { listSaved } from "@/lib/wp-content-storage";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { ConfirmSubmit } from "@/components/wp-manage-buttons";
import { WpManageList } from "@/components/wp-manage-list";
import { ImportByLink } from "@/components/import-by-link";
import { publishAllAction, unpublishAllAction } from "./manage-actions";

export const dynamic = "force-dynamic";

export default async function WpManagePage() {
  const [saved, me] = await Promise.all([listSaved(), getCurrentUser()]);
  const userCanEdit = canEdit(me);

  const publishedCount = saved.filter((s) => s.published).length;
  const unpublishedCount = saved.length - publishedCount;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
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
                Gerenciar páginas
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
                {saved.length} página{saved.length === 1 ? "" : "s"} copiada
                {saved.length === 1 ? "" : "s"}
              </h2>
              <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
                Busque, filtre e gerencie em lote. Publicar libera a URL pública{" "}
                <span className="text-neutral-300 font-mono">/p/[slug]</span>.
              </p>
            </div>

            {userCanEdit && (
              <div className="flex items-center gap-2 flex-wrap">
                <ImportByLink />
                <Link
                  href="/wordpress"
                  className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                >
                  <Upload size={14} strokeWidth={2.5} />
                  Importar mais
                </Link>

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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 max-w-xl">
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
        </header>

        <div className="px-10 py-8">
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
                Importe páginas do WordPress pra publicar e editar aqui.
              </p>
              <Link
                href="/wordpress"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold mt-5"
              >
                <Upload size={14} strokeWidth={2.5} />
                Importar do WordPress
              </Link>
            </div>
          ) : (
            <WpManageList pages={saved} canEdit={userCanEdit} />
          )}
        </div>
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
      <p className={`text-2xl font-semibold tracking-tight ${tint}`}>{value}</p>
      <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}
