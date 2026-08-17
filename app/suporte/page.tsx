import { redirect } from "next/navigation";
import Link from "next/link";
import { MessagesSquare, Settings2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { SuporteChat } from "@/components/suporte-chat";
import { SuporteReenvios } from "@/components/suporte-reenvios";
import { listarReenvios } from "@/lib/reenvio-store";
import { listarConversas } from "@/lib/suporte-store";
import { ordenarCaixa, quantosEsperando } from "@/lib/caixa-conversas";

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

  // Só aparece se tiver algo na fila — com ela vazia, a tela segue só o chat.
  const reenvios = await listarReenvios().catch(() => []);

  // ⚠️ Quantas alunas de verdade estão esperando resposta. Isto precisa estar
  // NA CARA: a conversa nasce em `/ajuda`, e sem um número aqui ninguém do time
  // descobriria que tem gente parada esperando — o sino toca uma vez e some.
  const esperando = quantosEsperando(
    ordenarCaixa(await listarConversas().catch(() => []))
  );

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
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/suporte/conversas"
              className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition ${
                esperando > 0
                  ? "text-amber-300 hover:text-amber-200"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              <MessagesSquare size={13} strokeWidth={2.2} />
              Conversas
              {esperando > 0 && (
                <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10.5px] leading-none">
                  {esperando}
                </span>
              )}
            </Link>
            <Link
              href="/suporte/ajustes"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500 transition hover:text-white"
            >
              <Settings2 size={13} strokeWidth={2.2} />
              Ajustes
            </Link>
          </div>
        </header>

        <section className="px-5 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-2xl">
            {/* ⚠️ Alunas de verdade esperando vêm ANTES do chat de teste: o
                teste pode esperar, a pessoa do outro lado não. */}
            {esperando > 0 && (
              <Link
                href="/suporte/conversas"
                className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3.5 transition hover:border-amber-500/50"
              >
                <p className="text-[13px] font-semibold text-amber-100">
                  {esperando === 1
                    ? "1 aluna esperando resposta"
                    : `${esperando} alunas esperando resposta`}
                </p>
                <span className="shrink-0 text-[12px] font-semibold text-amber-300">
                  Responder →
                </span>
              </Link>
            )}
            <SuporteReenvios reenvios={reenvios} />
            <SuporteChat />
          </div>
        </section>
      </main>
    </div>
  );
}
