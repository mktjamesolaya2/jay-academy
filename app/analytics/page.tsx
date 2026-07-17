import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, Users, FileText, Globe, BarChart3, ExternalLink } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getAllPageStats } from "@/lib/analytics-store";
import { listSaved } from "@/lib/wp-content-storage";
import { listForms, countSubmissions } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

type Row = {
  name: string;
  href: string;
  kind: "Página" | "Formulário";
  isForm: boolean;
  visits: number;
  leads: number;
  topSource: string;
};

function topSource(sources?: Record<string, number>): string {
  if (!sources) return "—";
  const entries = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "—";
}

export default async function AnalyticsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/analytics");

  const [stats, saved, forms] = await Promise.all([
    getAllPageStats(),
    listSaved(),
    listForms(),
  ]);
  const statBySlug = new Map(stats.map((s) => [s.slug, s]));

  const wpRows: Row[] = await Promise.all(
    saved
      .filter((s) => s.published)
      .map(async (s) => {
        const ps = s.publicSlug || s.slug;
        const st = statBySlug.get(ps);
        const isForm = s.placed === "form";
        return {
          name: s.title.replace(/<[^>]*>/g, ""),
          href: `/${ps}`,
          kind: "Página" as const,
          isForm,
          visits: st?.visits ?? 0,
          leads: isForm ? await countSubmissions(`wp:${ps}`) : 0,
          topSource: topSource(st?.sources),
        };
      })
  );

  const formRows: Row[] = await Promise.all(
    forms.map(async (f) => {
      const st = statBySlug.get(f.slug);
      return {
        name: f.name,
        href: `/f/${f.slug}`,
        kind: "Formulário" as const,
        isForm: true,
        visits: st?.visits ?? 0,
        leads: await countSubmissions(f.id),
        topSource: topSource(st?.sources),
      };
    })
  );

  const rows = [...wpRows, ...formRows].sort((a, b) => b.visits - a.visits);

  const totalVisits = stats.reduce((acc, s) => acc + s.visits, 0);
  const totalLeads = rows.reduce((acc, r) => acc + r.leads, 0);

  const sourceTotals: Record<string, number> = {};
  for (const s of stats) {
    for (const [src, n] of Object.entries(s.sources)) {
      sourceTotals[src] = (sourceTotals[src] ?? 0) + n;
    }
  }
  const sourcesSorted = Object.entries(sourceTotals).sort((a, b) => b[1] - a[1]);
  const sourcesMax = sourcesSorted[0]?.[1] || 1;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
            Analytics
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
            Desempenho das páginas
          </h2>
          <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
            Quantas pessoas visitaram, quantos leads cada página gerou e de onde
            veio o tráfego.
          </p>
        </header>

        <div className="px-5 py-6 lg:px-10 lg:py-8 space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <BigStat icon={Eye} label="Visitas totais" value={totalVisits} tint="text-sky-300" />
            <BigStat icon={Users} label="Leads (envios)" value={totalLeads} tint="text-emerald-300" />
            <BigStat
              icon={BarChart3}
              label="Páginas monitoradas"
              value={rows.length}
              tint="text-white"
            />
          </div>

          {totalVisits === 0 && (
            <div className="bg-amber-500/5 border border-amber-500/25 rounded-xl px-4 py-3 text-[13px] text-amber-200/90 leading-relaxed">
              Ainda não há visitas registradas. Os números começam a aparecer
              assim que as páginas publicadas (<span className="font-mono">/...</span>{" "}
              e formulários) forem acessadas.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-3">
                Por página
              </p>
              {rows.length === 0 ? (
                <div className="border border-dashed border-[#262626] rounded-2xl py-12 text-center text-sm text-neutral-500">
                  Nenhuma página publicada ainda.
                </div>
              ) : (
                <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-x-auto">
                  <table className="w-full text-sm min-w-[420px]">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold bg-[#0d0d0d] border-b border-[#1f1f1f]">
                        <th className="px-5 py-3">Página</th>
                        <th className="px-4 py-3 text-right">Visitas</th>
                        <th className="px-5 py-3 text-right">Leads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r.href}
                          className="border-b border-[#161616] last:border-0 hover:bg-[#101010] transition"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 min-w-0">
                              {r.kind === "Formulário" ? (
                                <FileText size={13} className="text-violet-300 shrink-0" strokeWidth={2} />
                              ) : (
                                <Globe size={13} className="text-sky-300 shrink-0" strokeWidth={2} />
                              )}
                              <Link
                                href={r.href}
                                target="_blank"
                                className="text-white font-semibold hover:text-blue-400 transition truncate inline-flex items-center gap-1"
                              >
                                {r.name}
                                <ExternalLink size={10} strokeWidth={2} className="text-neutral-600 shrink-0" />
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right text-white font-semibold tabular-nums">
                            {r.visits}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                            {r.isForm ? (
                              <span className="text-emerald-300">{r.leads}</span>
                            ) : (
                              <span className="text-neutral-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-3">
                Origem do tráfego
              </p>
              <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-5">
                {sourcesSorted.length === 0 ? (
                  <p className="text-sm text-neutral-500">Sem dados ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {sourcesSorted.map(([src, n]) => (
                      <div key={src}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-neutral-300 font-medium">{src}</span>
                          <span className="text-neutral-500 tabular-nums">{n}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#161616] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500"
                            style={{ width: `${Math.round((n / sourcesMax) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function BigStat({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} strokeWidth={2} className={tint} />
        <p className="text-[11px] text-neutral-500 font-semibold uppercase tracking-[0.1em]">
          {label}
        </p>
      </div>
      <p className={`text-3xl font-semibold tracking-tight ${tint}`}>{value}</p>
    </div>
  );
}
