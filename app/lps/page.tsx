import Link from "next/link";
import { Plus, Layout } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { EmptyState } from "@/components/empty-state";
import { loadLps } from "@/lib/lp-store";
import { listSaved } from "@/lib/wp-content-storage";
import { LpCard } from "@/components/lp-card";
import { WpPageCard } from "@/components/wp-page-card";
import { RepoLpCard } from "@/components/repo-lp-card";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { lpHtmlPages } from "@/lib/lp-html-registry";
import { getAllPageStats } from "@/lib/analytics-store";
import { listAllSubmissions } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export default async function LpsPage() {
  const [landingPages, savedWp, me, pageStats, allLeads] = await Promise.all([
    loadLps(),
    listSaved(),
    getCurrentUser(),
    getAllPageStats(),
    listAllSubmissions(),
  ]);
  const lps = landingPages.filter((lp) => lp.type === "lp" && !lp.trashed);
  const wpLps = savedWp.filter((wp) => wp.placed === "lp");
  const totalCount = lps.length + wpLps.length;
  const userCanEdit = canEdit(me);

  // LPs de venda servidas de lp-html/ (editadas no repo — só visualização).
  // As que já têm registro de LP no painel (ex: pmuclass) ficam de fora
  // pra não duplicar card.
  const repoLps = lpHtmlPages.filter(
    (p) =>
      p.category === "venda" &&
      !landingPages.find((lp) => lp.slug === p.slug && !lp.trashed)
  );
  const visitsBySlug = new Map(pageStats.map((s) => [s.slug, s.visits]));
  const leadsBySlug = new Map<string, number>();
  for (const s of allLeads.submissions) {
    if (!s.formId.startsWith("wp:")) continue;
    const slug = s.formId.slice(3);
    leadsBySlug.set(slug, (leadsBySlug.get(slug) ?? 0) + 1);
  }

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
            {totalCount > 0 && userCanEdit && (
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
              description={
                userCanEdit
                  ? "LPs são páginas únicas de venda ou captação. Crie uma nova ou importe do WordPress."
                  : "Nenhuma LP foi criada ainda. Como visualizador você não pode criar — peça pro admin."
              }
              action={userCanEdit ? { label: "Criar LP", href: "/lps/new" } : undefined}
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

          {/* LPs de venda servidas direto do repo (lp-html/) — read-only */}
          {repoLps.length > 0 && (
            <div className="mt-10">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white tracking-[-0.02em]">
                  LPs do repositório
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {repoLps.length} páginas de venda servidas de{" "}
                  <span className="font-mono text-neutral-400">lp-html/</span> —
                  editadas via commit, sem edição pelo painel
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {repoLps.map((p) => (
                  <RepoLpCard
                    key={p.slug}
                    entry={p}
                    visits={visitsBySlug.get(p.slug)}
                    leads={leadsBySlug.get(p.slug)}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
