"use client";

import { useState } from "react";
import { Search, EyeOff, CheckCircle2 } from "lucide-react";
import { WpPageRow } from "./wp-page-row";
import type { WpPage } from "@/lib/wp-api";
import type { WpDecision } from "@/lib/wp-decisions";

export type TriageRow = {
  page: WpPage;
  decision: WpDecision;
  key: string;
};

export type SavedRow = {
  title: string;
  slug: string;
  domain: "main" | "lp";
  copiedAt: string; // já formatado no servidor
};

function matchPage(row: TriageRow, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return (
    row.page.title.toLowerCase().includes(t) ||
    row.page.slug.toLowerCase().includes(t)
  );
}

function matchSaved(row: SavedRow, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return (
    row.title.toLowerCase().includes(t) || row.slug.toLowerCase().includes(t)
  );
}

function DecisionTable({ rows }: { rows: TriageRow[] }) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[560px]">
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
    </div>
  );
}

export function WpTriageTables({
  saved,
  main,
  campaigns,
  ignored,
}: {
  saved: SavedRow[];
  main: TriageRow[];
  campaigns: TriageRow[];
  ignored: TriageRow[];
}) {
  const [q, setQ] = useState("");
  const [savedOpen, setSavedOpen] = useState(false);
  const [ignoredOpen, setIgnoredOpen] = useState(false);
  const searching = !!q.trim();

  const fSaved = saved.filter((r) => matchSaved(r, q));
  const fMain = main.filter((r) => matchPage(r, q));
  const fCamp = campaigns.filter((r) => matchPage(r, q));
  const fIgnored = ignored.filter((r) => matchPage(r, q));

  const nothing =
    fSaved.length === 0 &&
    fMain.length === 0 &&
    fCamp.length === 0 &&
    fIgnored.length === 0;

  return (
    <div className="space-y-8">
      {/* Busca — filtra TODAS as seções (copiadas, pendentes, campanhas, ignoradas) */}
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

      {nothing && searching && (
        <p className="text-sm text-neutral-500 py-8 text-center">
          Nenhuma página encontrada pra “{q}”.
        </p>
      )}

      {/* Já copiadas pro portal — recolhível, abre ao buscar */}
      {saved.length > 0 && (
        <details
          open={searching || savedOpen}
          onToggle={(e) => setSavedOpen(e.currentTarget.open)}
          className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden"
        >
          <summary className="flex items-center gap-2 cursor-pointer px-5 py-4 text-sm select-none list-none hover:bg-[#101010] transition">
            <CheckCircle2 size={14} strokeWidth={2.2} className="text-emerald-400" />
            <span className="font-semibold text-white">Já copiadas pro portal</span>
            <span className="text-neutral-500">({fSaved.length})</span>
            <span className="text-[11px] text-neutral-600 ml-1">
              — clique pra ver a lista
            </span>
          </summary>
          <div className="overflow-x-auto border-t border-[#1f1f1f]">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold bg-[#0d0d0d] border-b border-[#1f1f1f]">
                <th className="px-6 py-3">Página</th>
                <th className="px-6 py-3">Origem</th>
                <th className="px-6 py-3">Copiada em</th>
              </tr>
            </thead>
            <tbody>
              {fSaved.map((s) => (
                <tr
                  key={`${s.domain}_${s.slug}`}
                  className="border-b border-[#161616] last:border-0 hover:bg-[#101010] transition"
                >
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-white font-semibold leading-tight line-clamp-1">
                      {s.title}
                    </p>
                    <p className="text-[11px] text-neutral-500 font-mono mt-1">
                      /{s.slug}
                    </p>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-neutral-400 font-medium">
                    {s.domain === "main"
                      ? "jayacademy.com.br"
                      : "lp.jayacademy.com.br"}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-neutral-500 font-mono">
                    {s.copiedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </details>
      )}

      {fMain.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white tracking-[-0.02em] mb-3">
            Páginas{" "}
            <span className="text-neutral-500 font-medium">({fMain.length})</span>
          </h3>
          <DecisionTable rows={fMain} />
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
          <DecisionTable rows={fCamp} />
        </section>
      )}

      {/* Ignoradas — recolhidas, fora do caminho mas recuperáveis */}
      {ignored.length > 0 && (
        <details
          open={searching || ignoredOpen}
          onToggle={(e) => setIgnoredOpen(e.currentTarget.open)}
        >
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
              <DecisionTable rows={fIgnored} />
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
