import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { getConhecimento, listarLacunas } from "@/lib/suporte-store";
import { SuporteConhecimento } from "@/components/suporte-conhecimento";
import { SuporteLacunas } from "@/components/suporte-lacunas";
import { SuporteChat } from "@/components/suporte-chat";

/**
 * O que a IA sabe, e o que ela ainda não sabe.
 *
 * ⚠️ O chat de TREINO mora aqui agora. Ele ficava em `/suporte`, e James
 * pediu: *"não quero isso de conversa teste... quero que as conversas
 * apareçam direto aqui já mesmo"*. O portal é pra ficar de olho nas alunas;
 * treinar é outra tarefa, e o lugar dela é ao lado da base de conhecimento —
 * testa, vê o que saiu errado, corrige a base na mesma tela.
 *
 * ⚠️ A base ficava na mesma tela do chat e o James pediu pra tirar de lá — mas
 * **não pra apagar**: é aqui que ela é treinada. Fica a um clique, em "Ajustes",
 * pra tela da conversa ser só a conversa.
 */

export const dynamic = "force-dynamic";

export default async function SuporteAjustesPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/suporte/ajustes");
  if (!canEdit(me)) redirect("/dashboard");

  const [conhecimento, lacunas] = await Promise.all([
    getConhecimento(),
    listarLacunas(),
  ]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
          <Link
            href="/suporte"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-white"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pra conversa
          </Link>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
            Ajustes do suporte
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            O que ela sabe responder — e o que ainda falta
          </p>
        </header>

        <section className="grid grid-cols-1 gap-8 px-5 py-6 lg:grid-cols-2 lg:px-10 lg:py-8">
          <div>
            <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              O que ela sabe
            </h2>
            <SuporteConhecimento inicial={conhecimento} />
            <p className="mt-2.5 text-[12px] leading-relaxed text-neutral-500">
              Ela só responde o que estiver aqui. Qualquer coisa fora disso ela
              passa pra uma pessoa em vez de inventar — de propósito.
            </p>
          </div>

          <div>
            {/* ⚠️ É aqui que ela fica mais esperta, com você no meio. Entra só
                a PERGUNTA que ela não soube — a resposta quem escreve é você. */}
            <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              O que ela ainda não sabe
            </h2>
            <SuporteLacunas lacunas={lacunas} />
          </div>

          {/* ⚠️ O chat de treino ocupa a largura toda, embaixo: é onde se
              testa o efeito do que foi escrito ali em cima. Testar e
              corrigir na MESMA tela é o que fecha o ciclo — separados, a
              pessoa testa, anota num papel e esquece de voltar. */}
          <div className="lg:col-span-2">
            <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Testar como se fosse uma aluna
            </h2>
            <div className="max-w-2xl">
              <SuporteChat />
            </div>
            <p className="mt-2.5 max-w-2xl text-[12px] leading-relaxed text-neutral-500">
              Esta conversa é de teste e não aparece na lista de alunas.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
