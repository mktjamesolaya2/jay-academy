import Link from "next/link";
import { Trash2, ChevronRight, Users, DatabaseBackup } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { loadLps } from "@/lib/lp-store";
import { listSaved } from "@/lib/wp-content-storage";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { readActivityLog } from "@/lib/activity-log";
import { ActivityFeed, DeploysFeed } from "@/components/admin-feeds";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [landingPages, savedWp, me, activity] = await Promise.all([
    loadLps(),
    listSaved(),
    getCurrentUser(),
    readActivityLog(15),
  ]);
  const trashedCount = landingPages.filter((lp) => lp.trashed).length;
  const isSenior = me?.role === "senior";
  const userCanEdit = canEdit(me);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar landingPages={landingPages} savedWp={savedWp} />

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 lg:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
              Configurações
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Domínio, autenticação, integrações e lixeira
            </p>
          </div>

          {/* Atividade recente + Deploys — só no mobile (no desktop ficam no dashboard) */}
          {userCanEdit && (
            <div className="lg:hidden space-y-5 mb-6">
              <ActivityFeed entries={activity} />
              <DeploysFeed />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
            <Section title="Domínio" description="O portal vai viver em jayacademy.com.br">
              <Row label="Domínio principal" value="jayacademy.com.br" muted />
              <Row label="Status DNS" value="Não configurado" muted />
            </Section>

            <Section
              title="Autenticação"
              description="Quem pode acessar o painel admin"
            >
              <Row label="Provider" value="Clerk (planejado)" muted />
              <Row label="Bypass dev" value="Ativo" />
            </Section>

            <Section
              title="Integrações"
              description="APIs externas que alimentam o dashboard"
            >
              <Row label="GA4" value="Não conectado" muted />
              <Row label="Meta Pixel" value="Não conectado" muted />
              <Row label="OpenRouter" value="Configurado no PMU CLASS" />
            </Section>

            <Section title="Deploy" description="Quando estiver pronto, via Vercel">
              <Row label="Plataforma" value="Vercel (planejado)" muted />
              <Row label="Estratégia" value="Path-based + rewrites" />
              <Row label="Estado" value="Não deployado" muted />
            </Section>

            {isSenior && (
              <Link
                href="/settings/users"
                className="lg:col-span-2 bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/30 hover:border-amber-500/50 rounded-2xl p-6 flex items-center justify-between gap-4 transition group"
              >
                <div className="flex items-center gap-4">
                  <span className="w-11 h-11 rounded-lg bg-amber-500/15 ring-1 ring-amber-500/30 flex items-center justify-center">
                    <Users size={16} strokeWidth={2} className="text-amber-300" />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-amber-300 font-semibold">
                      Senior
                    </p>
                    <h3 className="font-semibold text-base text-white tracking-tight mt-0.5">
                      Gestão de usuários
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Promover a admin, rebaixar pra visualizador, excluir
                      perfis
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={2}
                  className="text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition"
                />
              </Link>
            )}

            {isSenior && (
              <Link
                href="/settings/backup"
                className="lg:col-span-2 bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl p-6 flex items-center justify-between gap-4 transition group"
              >
                <div className="flex items-center gap-4">
                  <span className="w-11 h-11 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center">
                    <DatabaseBackup size={16} strokeWidth={2} className="text-emerald-300" />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-300 font-semibold">
                      Senior
                    </p>
                    <h3 className="font-semibold text-base text-white tracking-tight mt-0.5">
                      Backup e restauração
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Salvar cópias de tudo e voltar pra versões anteriores
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={2}
                  className="text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition"
                />
              </Link>
            )}

            <Link
              href="/lixeira"
              className="lg:col-span-2 bg-[#0d0d0d] border border-[#1f1f1f] hover:border-neutral-700 rounded-2xl p-6 flex items-center justify-between gap-4 transition group"
            >
              <div className="flex items-center gap-4">
                <span className="w-11 h-11 rounded-lg bg-rose-500/10 ring-1 ring-rose-500/25 flex items-center justify-center">
                  <Trash2 size={16} strokeWidth={2} className="text-rose-300" />
                </span>
                <div>
                  <h3 className="font-semibold text-base text-white tracking-tight">
                    Lixeira
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {trashedCount === 0
                      ? "Vazia"
                      : `${trashedCount} ${trashedCount === 1 ? "item" : "itens"} — restaurar ou excluir permanente`}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={16}
                strokeWidth={2}
                className="text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition"
              />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6">
      <h3 className="font-semibold text-base text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-neutral-500 mt-1 mb-5">{description}</p>
      <div className="space-y-3 border-t border-[#161616] pt-4">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-neutral-400 font-medium">{label}</span>
      <span
        className={
          muted
            ? "text-xs text-neutral-600 font-medium"
            : "text-xs text-white font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}
