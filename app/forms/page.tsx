import { FileText } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { EmptyState } from "@/components/empty-state";
import { loadLps } from "@/lib/lp-store";
import { listSaved } from "@/lib/wp-content-storage";
import { WpPageCard } from "@/components/wp-page-card";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const [landingPages, savedWp] = await Promise.all([loadLps(), listSaved()]);
  const wpForms = savedWp.filter((wp) => wp.placed === "form");

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar landingPages={landingPages} savedWp={savedWp} />

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
              Formulários
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {wpForms.length === 0
                ? "Nenhum formulário ainda"
                : `${wpForms.length} ${wpForms.length === 1 ? "formulário" : "formulários"}`}
            </p>
          </div>

          {wpForms.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Sem formulários ainda"
              description="Crie um formulário pra começar a receber leads. Vão aparecer aqui centralizados — com export, webhooks e integrações."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {wpForms.map((wp) => (
                <WpPageCard key={`${wp.domain}_${wp.slug}`} page={wp} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
