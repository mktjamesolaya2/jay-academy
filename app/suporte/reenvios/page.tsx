import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { listarReenvios } from "@/lib/reenvio-store";
import { ReenviosLista } from "@/components/reenvios-lista";

/**
 * Os acessos esperando liberação na Hotmart.
 *
 * ⚠️ James: *"quando for questão de liberação de curso, a IA tem que pegar o
 * e-mail e a gente vai criar um lugar onde vai ficar todos os e-mails, pra
 * gente só copiar e liberar lá na Hotmart"*. É esta tela.
 *
 * ⚠️ Só entra aqui quem a consulta na Hotmart confirmou ter acesso VÁLIDO e
 * dentro do prazo. Quem não foi confirmado NÃO entra: a lista existe pra ser
 * copiada e liberada sem pensar, e um e-mail não verificado no meio faria
 * alguém liberar curso pra quem não comprou — erro difícil de desfazer.
 *
 * O reenvio em si é clique humano: a Hotmart não tem API pra isso (a sonda
 * testou seis endereços plausíveis, todos 404).
 */

export const dynamic = "force-dynamic";

export default async function ReenviosPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/suporte/reenvios");
  if (!canEdit(me)) redirect("/dashboard");

  const reenvios = await listarReenvios().catch(() => []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-5 lg:px-10 lg:pt-8 lg:pb-6">
          <Link
            href="/suporte"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500 transition hover:text-white"
          >
            <ArrowLeft size={13} strokeWidth={2.2} />
            Suporte
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
            Liberar acesso
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {reenvios.length === 0
              ? "Nenhum e-mail esperando."
              : reenvios.length === 1
                ? "1 e-mail pra liberar na Hotmart. Clique nele pra copiar."
                : `${reenvios.length} e-mails pra liberar na Hotmart. Clique num e-mail pra copiar.`}
          </p>
        </header>

        <section className="px-5 py-6 lg:px-10 lg:py-8">
          <ReenviosLista reenvios={reenvios} />
        </section>
      </main>
    </div>
  );
}
