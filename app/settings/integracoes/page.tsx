import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { listarDestinos } from "@/lib/lead-destinos";
import { listForms } from "@/lib/forms-store";
import { listarWebhooks } from "@/lib/webhooks-entrada";
import { IntegracoesWorkspace } from "@/components/integracoes-workspace";
import { WebhooksEntradaPainel } from "@/components/webhooks-entrada-painel";

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

  const [destinos, forms, webhooks] = await Promise.all([
    listarDestinos(),
    listForms(),
    listarWebhooks(),
  ]);

  // O link tem que sair com o domínio de verdade (é ele que vai ser colado nas
  // páginas), então lê do host da requisição em vez de chutar.
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
            O caminho do lead, de ponta a ponta: ele <strong className="font-semibold text-neutral-200">chega</strong> pelo
            nosso webhook e, se você quiser, <strong className="font-semibold text-neutral-200">segue</strong> pro
            CRM. Sem depender de link de ninguém pra receber.
          </p>
        </header>

        <div className="space-y-10 px-5 py-6 lg:px-10 lg:py-8">
          <WebhooksEntradaPainel webhooks={webhooks} base={base} />

          <section>
            <div className="mb-4 border-t border-[#1f1f1f] pt-6">
              <h3 className="flex items-center gap-2 text-[17px] font-semibold text-white">
                <ArrowRight size={16} strokeWidth={2.2} className="text-sky-400" />
                Depois de chegar, mandar pra onde
              </h3>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-neutral-400">
                Opcional. Todo lead que entra é repassado pros destinos daqui —
                é onde o CRM do Lucas entra quando ficar pronto. Sem nenhum
                destino, o lead simplesmente fica guardado no portal.
              </p>
            </div>
            <IntegracoesWorkspace
              destinos={destinos}
              origens={forms.map((f) => f.slug)}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
