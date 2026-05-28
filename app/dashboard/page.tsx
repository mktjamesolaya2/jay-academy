import Link from "next/link";
import {
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  MoreHorizontal,
  Activity,
  Globe,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { QuickActions } from "@/components/quick-actions";
import {
  landingPages,
  statusLabel,
  statusColors,
  typeLabel,
  relativeTime,
  type LandingPage,
} from "@/lib/landing-pages";
import { listSaved } from "@/lib/wp-content-storage";
import { fetchAllWpPages } from "@/lib/wp-api";
import { loadDecisions } from "@/lib/wp-decisions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [savedWp, allWp, decisions] = await Promise.all([
    listSaved(),
    fetchAllWpPages().catch(() => []),
    loadDecisions(),
  ]);

  const activePages = landingPages.filter((lp) => !lp.trashed);
  const totalPages = activePages.length + savedWp.length;
  const errorPages = activePages.filter((lp) => lp.status === "error").length;

  const wpStats = {
    total: allWp.length,
    copy: Object.values(decisions).filter((d) => d === "copy").length,
    ignore: Object.values(decisions).filter((d) => d === "ignore").length,
    saved: savedWp.length,
  };

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
            <div className="flex-1 min-w-0 px-8 py-8 space-y-8">
              {/* Greeting */}
              <section>
                <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
                  {greeting}, James 👋
                </h1>
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
                <QuickActions landingPages={landingPages} />
              </section>

              {/* Recent Projects */}
              <section className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-[#1f1f1f]">
                  <h2 className="text-sm font-semibold text-white">
                    Projetos recentes
                  </h2>
                  <Link
                    href="/lps"
                    className="text-xs font-medium text-neutral-500 hover:text-white transition"
                  >
                    Ver todos
                  </Link>
                </div>
                <div>
                  <div className="grid grid-cols-[1.5fr_100px_120px_140px_40px] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[0.12em] text-neutral-600 font-semibold border-b border-[#1f1f1f]">
                    <div>Nome</div>
                    <div>Tipo</div>
                    <div>Status</div>
                    <div>Última edição</div>
                    <div></div>
                  </div>
                  {activePages.slice(0, 5).map((lp) => (
                    <ProjectRow key={lp.slug} lp={lp} />
                  ))}
                </div>
              </section>

              {/* WordPress block */}
              <section className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-[#161616] flex items-center justify-center">
                      <Globe size={13} strokeWidth={2} className="text-neutral-300" />
                    </span>
                    <h2 className="text-sm font-semibold text-white">
                      Páginas do WordPress
                    </h2>
                  </div>
                  <Link
                    href="/wordpress"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-[#161616] border border-[#1f1f1f] hover:border-neutral-700 hover:text-white text-neutral-300 transition"
                  >
                    Gerenciar
                    <ChevronRight size={11} strokeWidth={2.4} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  <WpStat label="Total de páginas" value={wpStats.total} />
                  <WpStat label="Para copiar" value={wpStats.copy} />
                  <WpStat label="Ignoradas" value={wpStats.ignore} />
                  <WpStat label="Já copiadas" value={wpStats.saved} />
                </div>

                {savedWp.length > 0 && (
                  <div className="border-t border-[#1f1f1f] pt-4">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-600 font-semibold mb-3">
                      Páginas copiadas ({savedWp.length})
                    </p>
                    <div className="space-y-1">
                      {savedWp.slice(0, 6).map((wp) => (
                        <Link
                          key={`${wp.domain}_${wp.slug}`}
                          href={`/wp-pages/${wp.domain}/${encodeURIComponent(wp.slug)}`}
                          className="flex items-center gap-3 px-2.5 py-2 rounded-md hover:bg-[#121212] transition group"
                        >
                          <span className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500/30 to-violet-500/30 ring-1 ring-white/10 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition"
                              dangerouslySetInnerHTML={{ __html: wp.title }}
                            />
                            <p className="text-[10px] text-neutral-500 font-mono truncate">
                              {wp.domain === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br"}/{wp.slug}
                            </p>
                          </div>
                          <ChevronRight
                            size={13}
                            strokeWidth={2}
                            className="text-neutral-600 group-hover:text-white transition"
                          />
                        </Link>
                      ))}
                    </div>
                    {savedWp.length > 6 && (
                      <Link
                        href="/wordpress"
                        className="block mt-3 text-center text-xs font-medium text-neutral-500 hover:text-white transition py-1"
                      >
                        Ver as {savedWp.length - 6} restantes →
                      </Link>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Right Sidebar */}
            <aside className="w-80 shrink-0 border-l border-[#1f1f1f] p-5 space-y-5">
              <ActivityFeed />
              <DeploysFeed />
            </aside>
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

function ProjectRow({ lp }: { lp: LandingPage }) {
  const status = statusColors[lp.status];
  const accentMap: Record<string, string> = {
    "pink-orange": "from-pink-500 to-orange-500",
    "purple-fuchsia": "from-purple-500 to-fuchsia-500",
    "amber-orange": "from-amber-500 to-orange-500",
    "gold-black": "from-amber-400 to-yellow-600",
    rose: "from-pink-400 to-rose-400",
  };
  return (
    <Link
      href={`/lps/${lp.slug}`}
      className="grid grid-cols-[1.5fr_100px_120px_140px_40px] gap-3 items-center px-5 py-3 border-b border-[#161616] last:border-0 hover:bg-[#101010] transition group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-10 h-12 rounded-md bg-gradient-to-br ${accentMap[lp.accent]} shrink-0`}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition">
            {lp.name}
          </p>
          <p className="text-[11px] text-neutral-500 truncate">
            {lp.domain || `/${lp.slug}`}
          </p>
        </div>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] bg-[#161616] text-neutral-300 px-2 py-1 rounded inline-block w-fit">
        {typeLabel[lp.type]}
      </span>
      <span
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 w-fit ${status.bg} ${status.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
        {statusLabel[lp.status]}
      </span>
      <div>
        <p className="text-xs text-neutral-300">
          {lp.lastEditedAt ? relativeTime(lp.lastEditedAt) : "—"}
        </p>
        {lp.lastEditedBy && (
          <p className="text-[11px] text-neutral-500">{lp.lastEditedBy}</p>
        )}
      </div>
      <span className="w-7 h-7 rounded-md text-neutral-500 group-hover:text-white group-hover:bg-[#161616] transition inline-flex items-center justify-center">
        <MoreHorizontal size={14} strokeWidth={2} />
      </span>
    </Link>
  );
}

function WpStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-[11px] text-neutral-500 mt-0.5">{label}</p>
    </div>
  );
}

function ActivityFeed() {
  const items: { icon: typeof Activity; iconColor: string; line: string; time: string }[] = [];

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Atividade recente</h3>
        {items.length > 0 && (
          <button className="text-[11px] font-medium text-neutral-500 hover:text-white transition">
            Ver todos
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-neutral-500 leading-relaxed py-2">
          Sem atividade ainda. Ações vão aparecer aqui conforme você edita,
          publica e gerencia páginas.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-md bg-[#161616] flex items-center justify-center shrink-0">
                  <Icon size={12} strokeWidth={2} className={item.iconColor} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-200 leading-snug">
                    {item.line}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {item.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeploysFeed() {
  const items: { name: string; status: string; color: string; time: string }[] = [];

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Deploys recentes</h3>
        {items.length > 0 && (
          <button className="text-[11px] font-medium text-neutral-500 hover:text-white transition">
            Ver todos
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-neutral-500 leading-relaxed py-2">
          Sem deploys ainda. Quando você conectar o Vercel, vão aparecer aqui.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const colorClasses =
              item.color === "emerald"
                ? "text-emerald-300 bg-emerald-500/10 ring-emerald-500/25"
                : item.color === "rose"
                ? "text-rose-300 bg-rose-500/10 ring-rose-500/25"
                : "text-sky-300 bg-sky-500/10 ring-sky-500/25";
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-[#121212] transition"
              >
                <span className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500/30 to-orange-500/30 ring-1 ring-white/10 shrink-0" />
                <p className="flex-1 text-xs font-medium text-white truncate">
                  {item.name}
                </p>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 ${colorClasses}`}
                >
                  {item.status}
                </span>
                <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
