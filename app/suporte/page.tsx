import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { getConhecimento, listarLacunas } from "@/lib/suporte-store";
import { SuporteLacunas } from "@/components/suporte-lacunas";
import { SuporteChat } from "@/components/suporte-chat";
import { SuporteConhecimento } from "@/components/suporte-conhecimento";

/**
 * Suporte WhatsApp — fase 1.
 *
 * ⚠️ **Nenhum número conectado ainda**, e isso está dito na tela pra não haver
 * dúvida: nada daqui chega em aluno de verdade. O trabalho desta fase é
 * treinar as respostas; conectar é decisão de depois, e pela API oficial —
 * biblioteca não oficial arrisca banir o número do James, que é o número de
 * suporte dele, com histórico.
 */

export const dynamic = "force-dynamic";

export default async function SuportePage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/suporte");
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
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
            Suporte WhatsApp
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Treine as respostas antes de conectar um número
          </p>

          <div className="mt-4 max-w-2xl rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
            <p className="text-[13px] font-semibold text-amber-100">
              Ainda não está ligado a nenhum WhatsApp
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-amber-100/70">
              Nada daqui chega em aluno de verdade. Converse à vontade, veja o
              que ela responde e corrija o que ela sabe ao lado. Quando as
              respostas estiverem boas, aí a gente conecta o número.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 px-5 py-6 lg:grid-cols-2 lg:px-10 lg:py-8">
          <div>
            <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Testar
            </h2>
            <SuporteChat />
          </div>

          <div>
            <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              O que ela sabe
            </h2>
            <SuporteConhecimento inicial={conhecimento} />
            <p className="mt-2.5 text-[12px] leading-relaxed text-neutral-500">
              Ela só responde o que estiver aqui. Qualquer coisa fora disso ela
              passa pra uma pessoa em vez de inventar — de propósito.
            </p>

            {/* ⚠️ É aqui que ela fica mais esperta, com você no meio. Entra só
                a PERGUNTA que ela não soube — a resposta quem escreve é você. */}
            <h2 className="mt-7 mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              O que ela ainda não sabe
            </h2>
            <SuporteLacunas lacunas={lacunas} />
          </div>
        </section>
      </main>
    </div>
  );
}
