import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import {
  WpTriageTables,
  type TriageRow,
  type SavedRow,
} from "@/components/wp-triage-tables";
import { PendingButton } from "@/components/pending-button";
import { CopyNowButton } from "@/components/copy-now-button";
import { Sparkles, Eraser, Shield, ArrowLeft } from "lucide-react";
import { fetchAllWpPages, pageKey, type WpPage } from "@/lib/wp-api";
import { loadDecisions, type WpDecision } from "@/lib/wp-decisions";
import { listSaved } from "@/lib/wp-content-storage";
import { formatDateTimeBR } from "@/lib/format-date";
import { isCampaign } from "@/lib/wp-categorize";
import {
  applyAllSuggestionsAction,
  clearAllDecisionsAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function WordPressPage() {
  const [pages, decisions, saved] = await Promise.all([
    fetchAllWpPages(),
    loadDecisions(),
    listSaved(),
  ]);

  const decisionOf = (page: WpPage): WpDecision =>
    decisions[pageKey(page)] ?? "pending";

  const copyMarkedPages = pages.filter((p) => decisionOf(p) === "copy");

  const savedKeys = new Set(saved.map((s) => `${s.domain}:${s.slug}`));
  const isSavedFor = (p: WpPage) => savedKeys.has(`${p.domain}:${p.slug}`);

  const alreadyCopiedCount = copyMarkedPages.filter((p) =>
    isSavedFor(p)
  ).length;

  // Listas da triagem: páginas JÁ COPIADAS saem da lista de decisão (ficam só na
  // seção "Já copiadas pro portal"); IGNORADAS vão pra uma seção recolhível.
  // Sobram na lista principal só as que ainda precisam de decisão.
  const toRow = (p: WpPage): TriageRow => ({
    page: p,
    decision: decisionOf(p),
    key: pageKey(p),
  });
  const pendingPages = pages.filter(
    (p) => !isSavedFor(p) && decisionOf(p) !== "ignore"
  );
  const ignoredPages = pages.filter(
    (p) => !isSavedFor(p) && decisionOf(p) === "ignore"
  );
  const mainRows = pendingPages.filter((p) => !isCampaign(p)).map(toRow);
  const campaignRows = pendingPages.filter(isCampaign).map(toRow);
  const ignoredRows = ignoredPages.map(toRow);

  const savedRows: SavedRow[] = saved.map((s) => ({
    title: s.title,
    slug: s.slug,
    domain: s.domain,
    copiedAt: formatDateTimeBR(s.fetchedAt),
  }));

  const counts = {
    total: pages.length,
    copy: copyMarkedPages.length,
    ignore: pages.filter((p) => decisionOf(p) === "ignore").length,
    pending: pages.filter((p) => decisionOf(p) === "pending").length,
    saved: saved.length,
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pro dashboard
          </Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                Importar do WordPress
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
                {counts.total} páginas no WordPress
              </h2>
              <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
                Escolha quais quer trazer pra editar aqui. As que você marcar
                como{" "}
                <span className="text-emerald-300 font-semibold">Copiar</span>{" "}
                vou duplicar pro portal pra você editar à vontade.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f0f0f] border border-[#1f1f1f] text-[12px] text-neutral-300">
                <Shield size={13} strokeWidth={2} className="text-emerald-400" />
                <span>
                  <span className="font-semibold text-white">
                    WordPress fica intacto.
                  </span>{" "}
                  Só leitura — não excluo nem altero nada lá.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <form action={applyAllSuggestionsAction}>
                <PendingButton
                  pendingLabel="Marcando..."
                  className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-semibold"
                  iconWhenIdle={<Sparkles size={14} strokeWidth={2.5} />}
                >
                  Marcar sugeridas
                </PendingButton>
              </form>
              <form action={clearAllDecisionsAction}>
                <PendingButton
                  pendingLabel="Desmarcando..."
                  className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-semibold"
                  iconWhenIdle={<Eraser size={14} strokeWidth={2} />}
                >
                  Desmarcar todas
                </PendingButton>
              </form>
            </div>
          </div>

          {counts.copy > 0 && (
            <div className="mt-5 flex items-center justify-between gap-4 px-5 py-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <div>
                <p className="text-emerald-300 font-semibold text-[15px]">
                  {counts.copy}{" "}
                  {counts.copy === 1
                    ? "página marcada pra copiar"
                    : "páginas marcadas pra copiar"}
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  Eu baixo o conteúdo de cada uma e salvo localmente. Pode
                  demorar uns segundos.
                </p>
              </div>
              <CopyNowButton
                totalMarked={counts.copy}
                alreadyCopied={alreadyCopiedCount}
              />
            </div>
          )}
        </header>

        <section className="px-10 py-6 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-[#1f1f1f]">
          <Stat label="Pendentes" value={counts.pending} tint="text-white" />
          <Stat
            label="Pra copiar"
            value={counts.copy}
            tint="text-emerald-300"
          />
          <Stat
            label="Ignoradas"
            value={counts.ignore}
            tint="text-neutral-300"
          />
          <Stat
            label="Já copiadas"
            value={counts.saved}
            tint="text-sky-300"
          />
        </section>

        <div className="px-5 py-6 lg:px-10 lg:py-8">
          <WpTriageTables
            saved={savedRows}
            main={mainRows}
            campaigns={campaignRows}
            ignored={ignoredRows}
          />
        </div>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold">
        {label}
      </p>
      <p className={`text-2xl font-semibold tracking-[-0.02em] mt-1 ${tint}`}>
        {value}
      </p>
    </div>
  );
}
