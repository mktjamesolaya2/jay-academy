import Link from "next/link";
import { Download, Inbox, Search } from "lucide-react";
import { clsx } from "clsx";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { listAllSubmissions, listForms } from "@/lib/forms-store";
import { loadLps } from "@/lib/lp-store";
import { listSaved } from "@/lib/wp-content-storage";
import { relativeTime } from "@/lib/landing-pages";
import { lpHtmlPages, getLpHtmlEntry } from "@/lib/lp-html-registry";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ origem?: string; q?: string }>;

function originLabel(formId: string, formNames: Map<string, string>): string {
  if (formId.startsWith("wp:")) {
    const slug = formId.slice(3);
    return getLpHtmlEntry(slug)?.title || `/${slug}`;
  }
  return formNames.get(formId) || formId;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const [{ submissions }, forms, landingPages, savedWp, me] = await Promise.all([
    listAllSubmissions(),
    listForms(),
    loadLps(),
    listSaved(),
    getCurrentUser(),
  ]);
  const userCanEdit = canEdit(me);
  const formNames = new Map(forms.map((f) => [f.id, f.name]));

  // Origens distintas (pra os chips de filtro), com contagem
  const byOrigin = new Map<string, number>();
  for (const s of submissions) {
    byOrigin.set(s.formId, (byOrigin.get(s.formId) ?? 0) + 1);
  }

  const origem = sp.origem ?? "";
  const q = (sp.q ?? "").toLowerCase().trim();
  const filtered = submissions.filter((s) => {
    if (origem && s.formId !== origem) return false;
    if (
      q &&
      !(s.name ?? "").toLowerCase().includes(q) &&
      !(s.email ?? "").toLowerCase().includes(q) &&
      !(s.whatsapp ?? "").toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  const exportHref = origem
    ? `/leads/export?origem=${encodeURIComponent(origem)}`
    : "/leads/export";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar landingPages={landingPages} savedWp={savedWp} />

        <main className="flex-1 overflow-y-auto px-5 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
                Leads
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {submissions.length}{" "}
                {submissions.length === 1 ? "lead recebido" : "leads recebidos"}{" "}
                — de todas as LPs e formulários
              </p>
            </div>
            <div className="flex items-center gap-2">
              <form action="/leads" className="flex items-center gap-2">
                {origem && <input type="hidden" name="origem" value={origem} />}
                <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#1f1f1f] focus-within:border-neutral-700 rounded-lg px-3 py-2">
                  <Search size={13} strokeWidth={2} className="text-neutral-500" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={sp.q ?? ""}
                    placeholder="Nome, email, whatsapp..."
                    className="w-44 bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                  />
                </div>
              </form>
              <a
                href={exportHref}
                className="btn-ghost inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg"
              >
                <Download size={14} strokeWidth={2.2} />
                CSV
              </a>
            </div>
          </div>

          {/* Filtro por origem */}
          {byOrigin.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-4 mb-6">
              <OriginChip href="/leads" active={!origem} label={`Todas · ${submissions.length}`} />
              {[...byOrigin.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([fid, n]) => (
                  <OriginChip
                    key={fid}
                    href={`/leads?origem=${encodeURIComponent(fid)}`}
                    active={origem === fid}
                    label={`${originLabel(fid, formNames)} · ${n}`}
                  />
                ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={submissions.length === 0 ? "Nenhum lead ainda" : "Nada com esse filtro"}
              description={
                submissions.length === 0
                  ? "Quando alguém preencher um formulário nas LPs, aparece aqui."
                  : "Ajuste a busca ou o filtro de origem."
              }
              action={submissions.length > 0 ? { label: "Limpar filtros", href: "/leads" } : undefined}
            />
          ) : (
            <div className="border border-[#1f1f1f] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d] text-left text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold">
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Contato</th>
                      <th className="px-4 py-3">Origem</th>
                      <th className="px-4 py-3">Quando</th>
                      <th className="px-4 py-3">Webhook</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-[#161616] last:border-0 hover:bg-[#0d0d0d] transition"
                      >
                        <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">
                          {s.name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-neutral-300 text-[13px]">{s.email || "—"}</p>
                          {s.whatsapp && (
                            <p className="text-[11px] text-neutral-500 font-mono">
                              {s.whatsapp}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-400 text-[13px] whitespace-nowrap">
                          {originLabel(s.formId, formNames)}
                        </td>
                        <td className="px-4 py-3 text-[12px] text-neutral-500 whitespace-nowrap">
                          {s.submittedAt ? relativeTime(s.submittedAt) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <WebhookBadge status={s.webhookStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* A configuração do CRM saiu daqui. Ela agora mora na tela da
              PRÓPRIA página (/lps/<slug>), junto dos outros atalhos dela —
              James: "ficar colocando em muito lugar assim não vai dar certo". */}

        </main>
      </div>
    </div>
  );
}

function OriginChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center text-[11px] font-semibold px-2.5 py-1.5 rounded-full ring-1 transition max-w-[240px] truncate",
        active
          ? "bg-white text-black ring-white"
          : "bg-[#0f0f0f] text-neutral-300 ring-[#262626] hover:ring-neutral-600"
      )}
    >
      {label}
    </Link>
  );
}

function WebhookBadge({ status }: { status?: string }) {
  if (status === "sent")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 bg-emerald-500/10 text-emerald-300 ring-emerald-500/25">
        enviado
      </span>
    );
  if (status === "failed")
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 bg-rose-500/10 text-rose-300 ring-rose-500/25">
        falhou
      </span>
    );
  return <span className="text-[11px] text-neutral-600">—</span>;
}
