import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { listBackups } from "@/lib/backup-store";
import { BackupManager } from "@/components/backup-manager";

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/settings/backup");
  if (me.role !== "senior") redirect("/settings");

  const backups = await listBackups();

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pras configurações
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} strokeWidth={2} className="text-amber-300" />
            <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300 font-semibold">
              Só o dono
            </p>
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
            Backup e restauração
          </h2>
          <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
            Salve cópias de tudo e volte pra uma versão anterior se precisar.
            Evita perder conteúdo.
          </p>
        </header>

        <div className="px-5 py-6 lg:px-10 lg:py-8 max-w-3xl">
          <BackupManager backups={backups} />
        </div>
      </main>
    </div>
  );
}
