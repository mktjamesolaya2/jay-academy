import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { formatDateTimeBR } from "@/lib/format-date";
import { describeActivity, type ActivityEntry } from "@/lib/activity-log";
import { getRecentDeploys } from "@/lib/vercel-deploys";

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <details className="group bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none hover:bg-[#101010] transition">
        <h3 className="text-sm font-semibold text-white">Atividade recente</h3>
        <ChevronDown
          size={15}
          strokeWidth={2.2}
          className="text-neutral-500 transition-transform -rotate-90 group-open:rotate-0"
        />
      </summary>
      <div className="px-4 pb-4">
        {entries.length === 0 ? (
          <p className="text-[11px] text-neutral-500 leading-relaxed py-2">
            Sem atividade ainda. Ações vão aparecer aqui conforme você edita,
            publica e gerencia páginas.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2.5">
                <span className="w-7 h-7 rounded-md bg-[#161616] flex items-center justify-center shrink-0">
                  <Activity size={12} strokeWidth={2} className="text-neutral-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-200 leading-snug">
                    <span className="font-semibold text-white">
                      {entry.userName}
                    </span>{" "}
                    {describeActivity(entry)}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {formatDateTimeBR(entry.at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export async function DeploysFeed() {
  const deploys = await getRecentDeploys();

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Deploys recentes</h3>
      </div>

      {deploys === null ? (
        <p className="text-[11px] text-neutral-500 leading-relaxed py-2">
          Conecte o Vercel (token nas variáveis de ambiente) pra ver os deploys
          aqui.
        </p>
      ) : deploys.length === 0 ? (
        <p className="text-[11px] text-neutral-500 leading-relaxed py-2">
          Nenhum deploy encontrado.
        </p>
      ) : (
        <div className="space-y-1.5">
          {deploys.map((d) => {
            const s = deployStyle(d.state);
            return (
              <a
                key={d.id}
                href={d.url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-[#121212] transition group"
              >
                <span className={`shrink-0 ${s.color}`}>{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {d.commitMessage || d.branch || "Deploy"}
                  </p>
                  {d.createdAt > 0 && (
                    <p className="text-[10px] text-neutral-500">
                      {formatDateTimeBR(new Date(d.createdAt).toISOString())}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 shrink-0 ${s.badge}`}
                >
                  {s.label}
                </span>
                {d.url && (
                  <ExternalLink
                    size={11}
                    strokeWidth={2}
                    className="text-neutral-600 group-hover:text-white transition shrink-0"
                  />
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function deployStyle(state: string): {
  icon: React.ReactNode;
  color: string;
  badge: string;
  label: string;
} {
  switch (state) {
    case "READY":
      return {
        icon: <CheckCircle2 size={14} strokeWidth={2.2} />,
        color: "text-emerald-300",
        badge: "text-emerald-300 bg-emerald-500/10 ring-emerald-500/25",
        label: "Pronto",
      };
    case "ERROR":
      return {
        icon: <XCircle size={14} strokeWidth={2.2} />,
        color: "text-rose-300",
        badge: "text-rose-300 bg-rose-500/10 ring-rose-500/25",
        label: "Erro",
      };
    case "BUILDING":
    case "INITIALIZING":
      return {
        icon: <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />,
        color: "text-amber-300",
        badge: "text-amber-300 bg-amber-500/10 ring-amber-500/25",
        label: "Buildando",
      };
    case "QUEUED":
      return {
        icon: <Clock size={14} strokeWidth={2.2} />,
        color: "text-sky-300",
        badge: "text-sky-300 bg-sky-500/10 ring-sky-500/25",
        label: "Na fila",
      };
    default:
      return {
        icon: <Clock size={14} strokeWidth={2.2} />,
        color: "text-neutral-400",
        badge: "text-neutral-300 bg-neutral-500/10 ring-neutral-500/25",
        label: state,
      };
  }
}
