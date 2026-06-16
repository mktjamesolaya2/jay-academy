import Link from "next/link";
import {
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  MoreHorizontal,
  Globe,
  Layout,
  FileText,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { QuickActions } from "@/components/quick-actions";
import {
  statusLabel,
  statusColors,
  typeLabel,
  relativeTime,
  publicUrlFor,
  type LandingPage,
} from "@/lib/landing-pages";
import { loadLps } from "@/lib/lp-store";
import { listSaved, type SavedSummary } from "@/lib/wp-content-storage";
import { SiteUrlLink } from "@/components/site-url-link";
import { EditQuickLink } from "@/components/edit-quick-link";
import { EditableGreeting } from "@/components/editable-greeting";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { readActivityLog } from "@/lib/activity-log";
import { ActivityFeed, DeploysFeed } from "@/components/admin-feeds";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [landingPages, savedWp, me, activity] = await Promise.all([
    loadLps(),
    listSaved(),
    getCurrentUser(),
    readActivityLog(15),
  ]);

  const activePages = landingPages.filter((lp) => !lp.trashed);
  // "Projetos" = páginas WP categorizadas OU publicadas (as importadas/publicadas
  // aparecem aqui mesmo sem categoria). As de triagem (sem categoria e não
  // publicadas) ficam só em Páginas WP.
  const categorizedWp = savedWp.filter((wp) => wp.placed || wp.published);
  const totalPages = activePages.length + savedWp.length;
  const errorPages = activePages.filter((lp) => lp.status === "error").length;
  const userCanEdit = canEdit(me);
  // Apenas admin e senior veem o feed de atividade e deploys
  const showAdminFeeds = userCanEdit;

  // Recentes = editados nos últimos 3 dias (LP ou WP)
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const isRecent = (iso?: string): boolean =>
    !!iso && now - new Date(iso).getTime() <= THREE_DAYS_MS;
  const recentLps = activePages
    .filter((lp) => isRecent(lp.lastEditedAt))
    .sort(
      (a, b) =>
        new Date(b.lastEditedAt ?? 0).getTime() -
        new Date(a.lastEditedAt ?? 0).getTime()
    );
  const recentWp = categorizedWp
    .filter((wp) => isRecent(wp.fetchedAt))
    .sort(
      (a, b) =>
        new Date(b.fetchedAt ?? 0).getTime() -
        new Date(a.fetchedAt ?? 0).getTime()
    );
  const totalRecent = recentLps.length + recentWp.length;

  // Rascunhos = LPs com status draft (não trashed)
  const draftLps = activePages.filter((lp) => lp.status === "draft");

  // Todos = ordenados por última edição desc, com fallback createdAt
  const sortByEdit = <
    T extends { lastEditedAt?: string; createdAt?: string },
  >(arr: T[]): T[] =>
    [...arr].sort((a, b) => {
      const da = new Date(a.lastEditedAt ?? a.createdAt ?? 0).getTime();
      const db = new Date(b.lastEditedAt ?? b.createdAt ?? 0).getTime();
      return db - da;
    });
  const allLps = sortByEdit(activePages);
  const allWpSorted = [...categorizedWp].sort(
    (a, b) =>
      new Date(b.fetchedAt ?? 0).getTime() -
      new Date(a.fetchedAt ?? 0).getTime()
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar landingPages={landingPages} savedWp={savedWp} />

        <main className="flex-1 overflow-y-auto">
          <div className="flex">
            <div className="flex-1 min-w-0 px-4 lg:px-8 py-6 lg:py-8 space-y-6 lg:space-y-8">
              {/* Greeting */}
              <section>
                <EditableGreeting
                  greeting={greeting}
                  initialName={me?.name ?? "você"}
                />
                <p className="text-sm text-neutral-500 mt-1">
                  Aqui está um resumo do que está acontecendo hoje.
                </p>
              </section>

              {/* Stats */}
              <section className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Páginas ativas"
                  value={totalPages}
                  delta="+ 4 esta semana"
                  icon={FileCheck2}
                  tint="violet"
                />
                <StatCard
                  label="Páginas com erro"
                  value={errorPages}
                  delta="Ver detalhes"
                  icon={AlertTriangle}
                  tint="rose"
                />
              </section>

              {/* Quick Actions */}
              <section>
                <h2 className="text-sm font-semibold text-white mb-3">
                  Ações rápidas
                </h2>
                <QuickActions
                  landingPages={landingPages}
                  canEdit={userCanEdit}
                />
              </section>

              {/* Recentes */}
              <ProjectsSection
                title="Recentes"
                emptyMessage="Nada editado recentemente."
                lps={recentLps}
                wps={recentWp}
                viewAllHref={null}
                showCount={totalRecent}
              />

              {/* Rascunhos */}
              {draftLps.length > 0 && (
                <ProjectsSection
                  title="Rascunhos"
                  emptyMessage="Sem rascunhos."
                  lps={draftLps}
                  wps={[]}
                  viewAllHref={null}
                  showCount={draftLps.length}
                />
              )}

              {/* Todos os projetos */}
              <ProjectsSection
                title="Todos os projetos"
                emptyMessage="Sem projetos ainda. Crie uma LP ou copie uma página do WordPress."
                lps={allLps}
                wps={allWpSorted}
                viewAllHref="/lps"
                showCount={allLps.length + allWpSorted.length}
              />

            </div>

            {/* Right Sidebar — só admin/senior */}
            {showAdminFeeds && (
              <aside className="hidden lg:block w-80 shrink-0 border-l border-[#1f1f1f] p-5 space-y-5">
                <ActivityFeed entries={activity} />
                <DeploysFeed />
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number;
  delta: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  tint: "violet" | "rose";
}) {
  const tintClasses =
    tint === "violet"
      ? "bg-violet-500/10 ring-violet-500/25 text-violet-300"
      : "bg-rose-500/10 ring-rose-500/25 text-rose-300";
  return (
    <div
      className={
        tint === "rose"
          ? "bg-[#0d0d0d] border border-rose-500/20 rounded-xl p-5"
          : "bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-5"
      }
    >
      <div className="flex items-start justify-between mb-3">
        <p
          className={
            tint === "rose"
              ? "text-xs font-medium text-rose-300"
              : "text-xs font-medium text-violet-300"
          }
        >
          {label}
        </p>
        <span
          className={`w-9 h-9 rounded-lg ring-1 flex items-center justify-center ${tintClasses}`}
        >
          <Icon size={14} strokeWidth={2} />
        </span>
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-neutral-500 mt-1.5">{delta}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  href?: string;
}) {
  const cls =
    "flex items-center gap-2 px-3.5 py-2.5 bg-[#0f0f0f] border border-[#1f1f1f] hover:border-neutral-700 rounded-lg text-sm font-medium text-neutral-200 hover:text-white transition";
  const inner = (
    <>
      <Icon size={14} strokeWidth={2.2} className="text-neutral-400" />
      <span>{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls}>
      {inner}
    </button>
  );
}

function ProjectsSection({
  title,
  emptyMessage,
  lps,
  wps,
  viewAllHref,
  showCount,
}: {
  title: string;
  emptyMessage: string;
  lps: LandingPage[];
  wps: SavedSummary[];
  viewAllHref: string | null;
  showCount: number;
}) {
  const isEmpty = lps.length === 0 && wps.length === 0;
  return (
    <section className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {!isEmpty && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
              {showCount}
            </span>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-neutral-500 hover:text-white transition"
          >
            Ver todos
          </Link>
        )}
      </div>
      {isEmpty ? (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-neutral-500">{emptyMessage}</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[1fr_auto] lg:grid-cols-[1.5fr_100px_120px_140px_40px] gap-3 px-4 lg:px-5 py-2.5 text-[10px] uppercase tracking-[0.12em] text-neutral-600 font-semibold border-b border-[#1f1f1f]">
            <div>Nome</div>
            <div className="hidden lg:block">Tipo</div>
            <div className="justify-self-end lg:justify-self-auto">Status</div>
            <div className="hidden lg:block">Última edição</div>
            <div className="hidden lg:block"></div>
          </div>
          {lps.slice(0, 8).map((lp) => (
            <ProjectRow key={lp.slug} lp={lp} />
          ))}
          {wps.slice(0, 8).map((wp) => (
            <WpProjectRow key={`${wp.domain}_${wp.slug}`} wp={wp} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectRow({ lp }: { lp: LandingPage }) {
  const status = statusColors[lp.status];
  const accentMap: Record<string, string> = {
    "pink-orange": "from-pink-500 to-orange-500",
    "purple-fuchsia": "from-purple-500 to-fuchsia-500",
    "amber-orange": "from-amber-500 to-orange-500",
    "gold-black": "from-amber-400 to-yellow-600",
    rose: "from-pink-400 to-rose-400",
  };
  const publicUrl = publicUrlFor(lp);
  return (
    <div className="relative grid grid-cols-[1fr_auto] lg:grid-cols-[1.5fr_100px_120px_140px_40px] gap-3 items-center px-4 lg:px-5 py-3 border-b border-[#161616] last:border-0 hover:bg-[#101010] transition group">
      {/* Link que cobre a linha toda (stretched link) — clique no card */}
      <Link
        href={`/lps/${lp.slug}`}
        aria-label={lp.name}
        className="absolute inset-0 z-[1]"
      />
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-10 h-12 rounded-md bg-gradient-to-br ${accentMap[lp.accent]} shrink-0`}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition">
            {lp.name}
          </p>
          {publicUrl && (
            <span className="relative z-[2] inline-block w-fit">
              <SiteUrlLink url={publicUrl} />
            </span>
          )}
        </div>
      </div>
      <span className="hidden lg:inline-block text-[10px] font-semibold uppercase tracking-[0.12em] bg-[#161616] text-neutral-300 px-2 py-1 rounded w-fit">
        {typeLabel[lp.type]}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 w-fit justify-self-end lg:justify-self-auto ${status.bg} ${status.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
        {statusLabel[lp.status]}
      </span>
      <div className="hidden lg:block">
        <p className="text-xs text-neutral-300">
          {lp.lastEditedAt ? relativeTime(lp.lastEditedAt) : "—"}
        </p>
        {lp.lastEditedBy && (
          <p className="text-[11px] text-neutral-500">{lp.lastEditedBy}</p>
        )}
      </div>
      <span className="hidden lg:inline-flex w-7 h-7 rounded-md text-neutral-500 group-hover:text-white group-hover:bg-[#161616] transition items-center justify-center">
        <MoreHorizontal size={14} strokeWidth={2} />
      </span>
    </div>
  );
}

function WpProjectRow({ wp }: { wp: SavedSummary }) {
  const typeIcon =
    wp.placed === "website" ? Globe : wp.placed === "form" ? FileText : Layout;
  const typeLbl =
    wp.placed === "website"
      ? "Website"
      : wp.placed === "form"
      ? "Form"
      : "LP";
  const Icon = typeIcon;
  return (
    <div className="relative grid grid-cols-[1fr_auto] lg:grid-cols-[1.5fr_100px_120px_140px_40px] gap-3 items-center px-4 lg:px-5 py-3 border-b border-[#161616] last:border-0 hover:bg-[#101010] transition group">
      <Link
        href={`/wp-pages/${wp.domain}/${encodeURIComponent(wp.slug)}`}
        aria-label={wp.slug}
        className="absolute inset-0 z-[1]"
      />
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-12 rounded-md bg-gradient-to-br from-blue-500/40 to-violet-500/40 shrink-0 flex items-center justify-center">
          <Icon size={13} strokeWidth={2.2} className="text-white/90" />
        </span>
        <div className="min-w-0">
          <p
            className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition"
            dangerouslySetInnerHTML={{ __html: wp.title }}
          />
          <p className="text-[11px] text-neutral-500 truncate font-mono">
            /{wp.slug}
          </p>
        </div>
      </div>
      <span className="hidden lg:inline-block text-[10px] font-semibold uppercase tracking-[0.12em] bg-[#161616] text-neutral-300 px-2 py-1 rounded w-fit">
        {typeLbl}
      </span>
      {wp.published ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 w-fit justify-self-end lg:justify-self-auto bg-emerald-500/10 text-emerald-300 ring-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Publicada
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 w-fit justify-self-end lg:justify-self-auto bg-neutral-500/10 text-neutral-300 ring-neutral-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
          Rascunho
        </span>
      )}
      <div className="hidden lg:block">
        <p className="text-xs text-neutral-300">
          {wp.fetchedAt ? relativeTime(wp.fetchedAt) : "—"}
        </p>
        <p className="text-[11px] text-neutral-500">do WP</p>
      </div>
      <span className="relative z-[2] hidden lg:inline-flex">
        <EditQuickLink
          href={`/wp-pages/${wp.domain}/${encodeURIComponent(wp.slug)}/edit`}
        />
      </span>
    </div>
  );
}
