import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { WpPageRow } from "@/components/wp-page-row";
import { PendingButton } from "@/components/pending-button";
import { CopyNowButton } from "@/components/copy-now-button";
import { CollapsibleSection } from "@/components/collapsible-section";
import {
  Sparkles,
  Eraser,
  Shield,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { fetchAllWpPages, pageKey, type WpPage } from "@/lib/wp-api";
import { loadDecisions, type WpDecision } from "@/lib/wp-decisions";
import { listSaved } from "@/lib/wp-content-storage";
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
  const campaignPages = pages.filter(isCampaign);
  const mainPages = pages.filter((p) => !isCampaign(p));

  const savedKeys = new Set(saved.map((s) => `${s.domain}:${s.slug}`));
  const isSavedFor = (p: WpPage) => savedKeys.has(`${p.domain}:${p.slug}`);

  const alreadyCopiedCount = copyMarkedPages.filter((p) =>
    isSavedFor(p)
  ).length;

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
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
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

        <div className="px-10 py-8 space-y-10">
          {saved.length > 0 && (
            <CollapsibleSection
              title="Já copiadas pro portal"
              count={saved.length}
              hint={
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2
                    size={11}
                    strokeWidth={2.2}
                    className="text-emerald-400"
                  />
                  Salvas em data/wp-content/. Clique pra ver a lista.
                </span>
              }
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold bg-[#0d0d0d] border-b border-[#1f1f1f]">
                    <th className="px-6 py-3">Página</th>
                    <th className="px-6 py-3">Origem</th>
                    <th className="px-6 py-3">Copiada em</th>
                  </tr>
                </thead>
                <tbody>
                  {saved.map((s) => (
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
                        {new Date(s.fetchedAt).toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CollapsibleSection>
          )}

          <section>
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-white tracking-[-0.02em]">
                Páginas{" "}
                <span className="text-neutral-500 font-medium">
                  ({mainPages.length})
                </span>
              </h3>
            </div>
            <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden">
              <PagesTable
                pages={mainPages}
                decisionOf={decisionOf}
                isSavedFor={isSavedFor}
              />
            </div>
          </section>

          {campaignPages.length > 0 && (
            <section>
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-white tracking-[-0.02em]">
                  Campanhas e ações{" "}
                  <span className="text-neutral-500 font-medium">
                    ({campaignPages.length})
                  </span>
                </h3>
                <p className="text-[12px] text-neutral-500 font-medium mt-1">
                  Páginas de campanha, anúncio ou teste A/B. Geralmente não
                  precisa copiar.
                </p>
              </div>
              <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden">
                <PagesTable
                  pages={campaignPages}
                  decisionOf={decisionOf}
                  isSavedFor={isSavedFor}
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function PagesTable({
  pages,
  decisionOf,
  isSavedFor,
}: {
  pages: WpPage[];
  decisionOf: (p: WpPage) => WpDecision;
  isSavedFor: (p: WpPage) => boolean;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold bg-[#0d0d0d] border-b border-[#1f1f1f]">
          <th className="px-6 py-3">Página</th>
          <th className="px-6 py-3">Link</th>
          <th className="px-6 py-3">Decisão</th>
        </tr>
      </thead>
      <tbody>
        {pages.map((page) => (
          <WpPageRow
            key={pageKey(page)}
            page={page}
            decision={decisionOf(page)}
            isSaved={isSavedFor(page)}
          />
        ))}
      </tbody>
    </table>
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
