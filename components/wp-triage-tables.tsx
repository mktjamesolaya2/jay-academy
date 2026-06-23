"use client";

import { useState } from "react";
import { Search, EyeOff } from "lucide-react";
import { WpPageRow } from "./wp-page-row";
import type { WpPage } from "@/lib/wp-api";
import type { WpDecision } from "@/lib/wp-decisions";

export type TriageRow = {
  page: WpPage;
  decision: WpDecision;
  key: string;
};

function matches(row: TriageRow, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return (
    row.page.title.toLowerCase().includes(t) ||
    row.page.slug.toLowerCase().includes(t)
  );
}

function Table({ rows }: { rows: TriageRow[] }) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold bg-[#0d0d0d] border-b border-[#1f1f1f]">
            <th className="px-6 py-3">Página</th>
            <th className="px-6 py-3">Link</th>
            <th className="px-6 py-3">Decisão</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <WpPageRow
              key={r.key}
              page={r.page}
              decision={r.decision}
              pageKeyValue={r.key}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WpTriageTables({
  main,
  campaigns,
  ignored,
}: {
  main: TriageRow[];
  campaigns: TriageRow[];
  ignored: TriageRow[];
}) {
  const [q, setQ] = useState("");

  const fMain = main.filter((r) => matches(r, q));
  const fCamp = campaigns.filter((r) => matches(r, q));
  const fIgnored = ignored.filter((r) => matches(r, q));
  const nothing =
    fMain.length === 0 && fCamp.length === 0 && fIgnored.length === 0;

  return (
    <div className="space-y-10">
      {/* Busca por nome */}
      <div className="relative max-w-md">
        <Search
          size={15}
          strokeWidth={2}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar página por nome ou slug…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#0f0f0f] border border-[#1f1f1f] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
        />
      </div>

      {nothing && (
        <p className="text-sm text-neutral-500 py-8 text-center">
          {q.trim()
            ? `Nenhuma página encontrada pra “${q}”.`
            : "Nada por decidir — tudo já foi copiado ou ignorado. 🎉"}
        </p>
      )}

      {fMain.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white tracking-[-0.02em] mb-3">
            Páginas{" "}
            <span className="text-neutral-500 font-medium">({fMain.length})</span>
          </h3>
          <Table rows={fMain} />
        </section>
      )}

      {fCamp.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white tracking-[-0.02em] mb-1">
            Campanhas e ações{" "}
            <span className="text-neutral-500 font-medium">({fCamp.length})</span>
          </h3>
          <p className="text-[12px] text-neutral-500 font-medium mb-3">
            Páginas de campanha, anúncio ou teste A/B. Geralmente não precisa
            copiar.
          </p>
          <Table rows={fCamp} />
        </section>
      )}

      {/* Ignoradas — recolhidas, fora do caminho mas recuperáveis */}
      {ignored.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 hover:text-neutral-200 transition select-none list-none">
            <EyeOff size={13} strokeWidth={2} />
            <span className="font-semibold">Ignoradas</span>
            <span className="text-neutral-600">({fIgnored.length})</span>
            <span className="text-[11px] text-neutral-600 ml-1">
              — clique pra ver / reverter
            </span>
          </summary>
          <div className="mt-3">
            {fIgnored.length > 0 ? (
              <Table rows={fIgnored} />
            ) : (
              <p className="text-xs text-neutral-600 py-3">
                Nenhuma ignorada bate com a busca.
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
