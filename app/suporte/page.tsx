import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { SuporteChat } from "@/components/suporte-chat";

/**
 * Suporte WhatsApp — a tela é **só a conversa**.
 *
 * ⚠️ Aqui tinha também o editor da base de conhecimento, a lista do que ela não
 * sabe e um aviso grande de "não está conectado". James: *"não quero isso aqui.
 * Apenas o chat eu quero"*.
 *
 * Nada disso foi apagado — mudou de lugar, pra `/suporte/ajustes`. Tirar a
 * capacidade seria pior do que a poluição: é ali que ela é treinada.
 */

export const dynamic = "force-dynamic";

export default async function SuportePage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/suporte");
  if (!canEdit(me)) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="flex items-start justify-between gap-4 border-b border-[#1f1f1f] px-5 pt-16 pb-5 lg:px-10 lg:pt-8 lg:pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
              Suporte WhatsApp
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Converse como se fosse uma aluna
            </p>
          </div>
          <Link
            href="/suporte/ajustes"
            className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500 transition hover:text-white"
          >
            <Settings2 size={13} strokeWidth={2.2} />
            Ajustes
          </Link>
        </header>

        <section className="px-5 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-2xl">
            <SuporteChat />
          </div>
        </section>
      </main>
    </div>
  );
}
