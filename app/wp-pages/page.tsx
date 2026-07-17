import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Lock,
  LayoutGrid,
  Shield,
  Sparkles,
  Eraser,
  Download,
  Settings2,
  WifiOff,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import {
  WpTriageTables,
  type TriageRow,
  type SavedRow,
} from "@/components/wp-triage-tables";
import { PendingButton } from "@/components/pending-button";
import { CopyNowButton } from "@/components/copy-now-button";
import { ConfirmSubmit } from "@/components/wp-manage-buttons";
import { WpManageList } from "@/components/wp-manage-list";
import { ImportByLink } from "@/components/import-by-link";
import { listSaved } from "@/lib/wp-content-storage";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { fetchAllWpPages, pageKey, type WpPage } from "@/lib/wp-api";
import { loadDecisions, type WpDecision } from "@/lib/wp-decisions";
import { formatDateTimeBR } from "@/lib/format-date";
import { isCampaign } from "@/lib/wp-categorize";
import {
  applyAllSuggestionsAction,
  clearAllDecisionsAction,
} from "@/app/wordpress/actions";
import { publishAllAction, unpublishAllAction } from "./manage-actions";

export const dynamic = "force-dynamic";

// Página unificada: IMPORTAR (do WordPress) em cima + GERENCIAR (as copiadas)
// embaixo. Junta o que antes eram /wordpress e /wp-pages numa tela só, dentro da
// seção "URLs" do menu. O /wordpress agora só redireciona pra cá.
export default async function WpPagesHub() {
  const [saved, me, wp] = await Promise.all([
    listSaved(),
    getCurrentUser(),
    // Fonte WP — se o WordPress estiver fora do ar, NÃO derruba a tela de
    // gerenciar: a seção de importar mostra um aviso e o resto funciona.
    (async () => {
      try {
        const [pages, decisions] = await Promise.all([
          fetchAllWpPages(),
          loadDecisions(),
        ]);
        return { pages, decisions, ok: true as const };
      } catch {
        return {
          pages: [] as WpPage[],
          decisions: {} as Record<string, WpDecision>,
          ok: false as const,
        };
      }
    })(),
  ]);

  const userCanEdit = canEdit(me);

  // ───── Gerenciar (copiadas) ─────
  const publishedCount = saved.filter((s) => s.published).length;
  const unpublishedCount = saved.length - publishedCount;

  // ───── Importar (fonte WP) ─────
  const { pages, decisions, ok: wpOk } = wp;
  const decisionOf = (p: WpPage): WpDecision =>
    decisions[pageKey(p)] ?? "pending";
  const copyMarkedPages = pages.filter((p) => decisionOf(p) === "copy");
  const savedKeys = new Set(saved.map((s) => `${s.domain}:${s.slug}`));
  const isSavedFor = (p: WpPage) => savedKeys.has(`${p.domain}:${p.slug}`);
  const alreadyCopiedCount = copyMarkedPages.filter(isSavedFor).length;

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

  const imp = {
    total: pages.length,
    copy: copyMarkedPages.length,
    ignore: pages.filter((p) => decisionOf(p) === "ignore").length,
    pending: pages.filter((p) => decisionOf(p) === "pending").length,
    saved: saved.length,
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Header */}
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
                Páginas WP
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
                {saved.length} copiada{saved.length === 1 ? "" : "s"}
                {wpOk ? ` · ${imp.total} no WordPress` : ""}
              </h2>
              <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
                Traga páginas do WordPress e gerencie tudo aqui. Publicar libera a
                URL pública{" "}
                <span className="text-neutral-300 font-mono">/[slug]</span>.
              </p>
            </div>
            {userCanEdit && (
              <div className="flex items-center gap-2 flex-wrap">
                <ImportByLink />
                <a
                  href="#gerenciar"
                  className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                >
                  <Settings2 size={14} strokeWidth={2.5} />
                  Ir pro gerenciar
                </a>
              </div>
            )}
          </div>
        </header>

        {/* ═══════════ IMPORTAR (em cima) ═══════════ */}
        {userCanEdit && (
          <section id="importar" className="border-b border-[#1f1f1f]">
            <div className="px-5 pt-7 pb-4 lg:px-10">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-400/80 font-semibold flex items-center gap-1.5">
                    <Download size={12} strokeWidth={2.5} />
                    Importar do WordPress
                  </p>
                  <p className="text-neutral-400 mt-1.5 max-w-2xl text-[14px]">
                    Marque as que quer trazer como{" "}
                    <span className="text-emerald-300 font-semibold">
                      Copiar
                    </span>{" "}
                    e eu duplico pro portal pra você editar.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f0f0f] border border-[#1f1f1f] text-[12px] text-neutral-300">
                    <Shield
                      size={13}
                      strokeWidth={2}
                      className="text-emerald-400"
                    />
                    <span>
                      <span className="font-semibold text-white">
                        WordPress fica intacto.
                      </span>{" "}
                      Só leitura — não excluo nem altero nada lá.
                    </span>
                  </div>
                </div>
                {wpOk && (
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
                )}
              </div>

              {wpOk && imp.copy > 0 && (
                <div className="mt-5 flex items-center justify-between gap-4 px-5 py-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <div>
                    <p className="text-emerald-300 font-semibold text-[15px]">
                      {imp.copy}{" "}
                      {imp.copy === 1
                        ? "página marcada pra copiar"
                        : "páginas marcadas pra copiar"}
                    </p>
                    <p className="text-[12px] text-neutral-400 mt-0.5">
                      Baixo o conteúdo de cada uma e otimizo em 2º plano. Pode
                      demorar uns segundos.
                    </p>
                  </div>
                  <CopyNowButton
                    totalMarked={imp.copy}
                    alreadyCopied={alreadyCopiedCount}
                  />
                </div>
              )}
            </div>

            {wpOk ? (
              <>
                <div className="px-5 pb-5 lg:px-10 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Pendentes" value={imp.pending} tint="text-white" />
                  <Stat
                    label="Pra copiar"
                    value={imp.copy}
                    tint="text-emerald-300"
                  />
                  <Stat
                    label="Ignoradas"
                    value={imp.ignore}
                    tint="text-neutral-300"
                  />
                  <Stat label="Já copiadas" value={imp.saved} tint="text-sky-300" />
                </div>
                <div className="px-5 pb-8 lg:px-10">
                  <WpTriageTables
                    saved={savedRows}
                    main={mainRows}
                    campaigns={campaignRows}
                    ignored={ignoredRows}
                  />
                </div>
              </>
            ) : (
              <div className="px-5 pb-8 lg:px-10">
                <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[13px] text-amber-200/90">
                  <WifiOff size={16} strokeWidth={2} className="shrink-0" />
                  <span>
                    Não consegui ler o WordPress agora (fora do ar ou lento). A
                    lista de importação não carregou — as páginas já copiadas
                    continuam abaixo, normais. Recarregue pra tentar de novo.
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══════════ GERENCIAR (embaixo) ═══════════ */}
        <section id="gerenciar">
          <div className="px-5 pt-7 pb-4 lg:px-10">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-sky-400/80 font-semibold flex items-center gap-1.5">
                  <LayoutGrid size={12} strokeWidth={2.5} />
                  Gerenciar copiadas
                </p>
                <p className="text-neutral-400 mt-1.5 max-w-2xl text-[14px]">
                  Busque, filtre e gerencie em lote. Publicar libera a URL
                  pública.
                </p>
              </div>
              {userCanEdit && saved.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {unpublishedCount > 0 && (
                    <form action={publishAllAction}>
                      <ConfirmSubmit
                        pendingLabel="Publicando..."
                        confirmMessage={`Publicar todas as ${unpublishedCount} páginas ainda não publicadas?`}
                        className="btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold"
                        icon={<Globe size={14} strokeWidth={2.5} />}
                      >
                        Publicar todas ({unpublishedCount})
                      </ConfirmSubmit>
                    </form>
                  )}
                  {publishedCount > 0 && (
                    <form action={unpublishAllAction}>
                      <ConfirmSubmit
                        pendingLabel="Despublicando..."
                        confirmMessage={`Despublicar todas as ${publishedCount} páginas publicadas?`}
                        className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-300 hover:text-rose-200"
                        icon={<Lock size={14} strokeWidth={2.5} />}
                      >
                        Despublicar todas
                      </ConfirmSubmit>
                    </form>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-5 max-w-xl">
              <Stat label="Total" value={saved.length} tint="text-white" />
              <Stat
                label="Publicadas"
                value={publishedCount}
                tint="text-emerald-300"
              />
              <Stat
                label="Não publicadas"
                value={unpublishedCount}
                tint="text-neutral-300"
              />
            </div>
          </div>

          <div className="px-5 pb-8 lg:px-10">
            {saved.length === 0 ? (
              <div className="border border-dashed border-[#262626] rounded-2xl py-16 text-center">
                <LayoutGrid
                  size={28}
                  strokeWidth={1.6}
                  className="mx-auto text-neutral-600 mb-3"
                />
                <p className="text-neutral-300 font-semibold">
                  Nenhuma página copiada ainda
                </p>
                <p className="text-neutral-500 text-sm mt-1">
                  Marque páginas como <span className="text-emerald-300">Copiar</span>{" "}
                  na seção acima pra trazer pro portal.
                </p>
              </div>
            ) : (
              <WpManageList pages={saved} canEdit={userCanEdit} />
            )}
          </div>
        </section>
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
