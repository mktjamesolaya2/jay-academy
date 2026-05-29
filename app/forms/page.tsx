import Link from "next/link";
import { FileText, Plus, Globe, Webhook, ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { EmptyState } from "@/components/empty-state";
import { loadLps } from "@/lib/lp-store";
import { listSaved } from "@/lib/wp-content-storage";
import { WpPageCard } from "@/components/wp-page-card";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { countSubmissions, listForms } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const [landingPages, savedWp, me, forms] = await Promise.all([
    loadLps(),
    listSaved(),
    getCurrentUser(),
    listForms(),
  ]);
  const wpForms = savedWp.filter((wp) => wp.placed === "form");
  const userCanEdit = canEdit(me);

  const counts: Record<string, number> = {};
  await Promise.all(
    forms.map(async (f) => {
      counts[f.id] = await countSubmissions(f.id);
    })
  );

  const totalCount = forms.length + wpForms.length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar landingPages={landingPages} savedWp={savedWp} />

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
                Formulários
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {totalCount === 0
                  ? "Nenhum formulário ainda"
                  : `${totalCount} ${totalCount === 1 ? "formulário" : "formulários"}`}
              </p>
            </div>
            {userCanEdit && totalCount > 0 && (
              <Link
                href="/forms/new"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <Plus size={14} strokeWidth={2.4} />
                Novo formulário
              </Link>
            )}
          </div>

          {totalCount === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem formulários ainda"
              description={
                userCanEdit
                  ? "Crie um formulário pra capturar leads. URL pública, webhook pro Clint/Zapier e redirect pós-envio."
                  : "Nenhum formulário criado ainda."
              }
              action={
                userCanEdit
                  ? { label: "Criar formulário", href: "/forms/new" }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {forms.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {forms.map((f) => (
                    <Link
                      key={f.id}
                      href={`/forms/${f.id}`}
                      className="group bg-[#0f0f0f] border border-[#1f1f1f] hover:border-neutral-700 rounded-2xl p-5 transition"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                            /f/{f.slug}
                          </p>
                          <h3 className="font-semibold text-lg text-white mt-1 tracking-tight truncate group-hover:text-blue-400 transition">
                            {f.name}
                          </h3>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full ring-1 bg-blue-500/10 text-blue-300 ring-blue-500/25 shrink-0">
                          {counts[f.id] || 0}{" "}
                          {(counts[f.id] || 0) === 1 ? "lead" : "leads"}
                        </span>
                      </div>

                      {f.description && (
                        <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2 mb-4">
                          {f.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {f.webhookUrl && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20">
                            <Webhook size={9} strokeWidth={2.4} />
                            Webhook
                          </span>
                        )}
                        {f.redirectUrl && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20">
                            <Globe size={9} strokeWidth={2.4} />
                            Redirect
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex items-center justify-between">
                        <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition inline-flex items-center gap-1.5">
                          Abrir detalhes
                          <ArrowRight size={12} strokeWidth={2.2} />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {wpForms.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-3 mt-6">
                    Formulários importados do WordPress
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {wpForms.map((wp) => (
                      <WpPageCard key={`${wp.domain}_${wp.slug}`} page={wp} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
