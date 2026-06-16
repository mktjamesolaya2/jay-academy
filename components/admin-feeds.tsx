import { Activity } from "lucide-react";
import { formatDateTimeBR } from "@/lib/format-date";
import { describeActivity, type ActivityEntry } from "@/lib/activity-log";

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Atividade recente</h3>
      </div>
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
  );
}

export function DeploysFeed() {
  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Deploys recentes</h3>
      </div>
      <p className="text-[11px] text-neutral-500 leading-relaxed py-2">
        Sem deploys ainda. Quando você conectar o Vercel, vão aparecer aqui.
      </p>
    </div>
  );
}
