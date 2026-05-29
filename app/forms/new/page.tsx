import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { NewFormView } from "./new-form-view";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/forms/new");
  if (!canEdit(me)) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 px-10 py-12">
          <h1 className="text-2xl font-semibold text-white">Acesso negado</h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Apenas admin pode criar formulários.
          </p>
          <Link
            href="/forms"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-white mt-6 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
          <Link
            href="/forms"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pros formulários
          </Link>
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
            Novo formulário
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
            Criar formulário
          </h2>
          <p className="text-neutral-400 mt-1.5 text-sm max-w-2xl">
            Campos padrão: Nome, WhatsApp, E-mail. Configure pra onde os dados
            vão (webhook do Clint/Zapier) e pra onde o usuário é redirecionado
            depois de enviar (link do WhatsApp, página de obrigado, etc).
          </p>
        </header>

        <section className="px-10 py-8 max-w-3xl">
          <NewFormView />
        </section>
      </main>
    </div>
  );
}
