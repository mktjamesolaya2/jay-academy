import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { listarIntegracoes, getCrm } from "@/lib/integracoes";
import { IntegracoesWorkspace } from "@/components/integracoes-workspace";

export const dynamic = "force-dynamic";

export default async function IntegracoesPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/settings/integracoes");
  if (!canEdit(me)) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 px-10 py-12">
          <h1 className="text-2xl font-semibold text-white">Acesso negado</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Só quem edita o site pode mexer nas integrações de lead.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 transition hover:text-white"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pro dashboard
          </Link>
        </main>
      </div>
    );
  }

  const [integracoes, crm] = await Promise.all([listarIntegracoes(), getCrm()]);

  // O link tem que sair com o domínio de verdade — é ele que vai ser colado
  // nos formulários —, então lê do host da requisição em vez de chutar.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "jayacademy.com.br";
  const base = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 transition hover:text-white"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            Configurações
          </Link>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
            Integrações de lead
          </h2>
          <p className="mt-1.5 max-w-2xl text-[15px] text-neutral-400">
            Cada integração gera um link. Cole o link no formulário e o lead
            chega aqui e segue pro CRM.
          </p>
        </header>

        <div className="px-5 py-6 lg:px-10 lg:py-8">
          <IntegracoesWorkspace integracoes={integracoes} crm={crm} base={base} />
        </div>
      </main>
    </div>
  );
}
