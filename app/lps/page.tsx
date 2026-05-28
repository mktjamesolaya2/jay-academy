import Link from "next/link";
import { Plus, Layout } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { EmptyState } from "@/components/empty-state";
import { loadLps } from "@/lib/lp-store";
import { listSaved } from "@/lib/wp-content-storage";
import { LpCard } from "@/components/lp-card";
import { WpPageCard } from "@/components/wp-page-card";

export const dynamic = "force-dynamic";

export default async function LpsPage() {
  const [landingPages, savedWp] = await Promise.all([loadLps(), listSaved()]);
  const lps = landingPages.filter((lp) => lp.type === "lp" && !lp.trashed);
  const wpLps = savedWp.filter((wp) => wp.placed === "lp");
  const totalCount = lps.length + wpLps.length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar landingPages={landingPages} savedWp={savedWp} />

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
                Landing Pages
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {totalCount === 0
                  ? "Nenhuma LP ainda"
                  : `${totalCount} ${totalCount === 1 ? "página" : "páginas"}`}
              </p>
            </div>
            {totalCount > 0 && (
              <Link
                href="/lps/new"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <Plus size={14} strokeWidth={2.4} />
                Nova LP
              </Link>
            )}
          </div>

          {totalCount === 0 ? (
            <EmptyState
              icon={Layout}
              title="Sem landing pages ainda"
              description="LPs são páginas únicas de venda ou captação. Crie uma nova ou importe do WordPress."
              action={{ label: "Criar LP", href: "/lps/new" }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {lps.map((lp) => (
                <LpCard key={lp.slug} lp={lp} />
              ))}
              {wpLps.map((wp) => (
                <WpPageCard key={`${wp.domain}_${wp.slug}`} page={wp} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
