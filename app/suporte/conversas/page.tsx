import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { listarConversas } from "@/lib/suporte-store";
import { ordenarCaixa, quantosEsperando, espera } from "@/lib/caixa-conversas";

/**
 * A caixa de entrada do time — as conversas que vieram da página `/ajuda`.
 *
 * ⚠️ A ordem **não** é a mais recente primeiro. Quem espera uma pessoa vem no
 * topo, e entre eles o que espera há mais tempo — porque é essa aluna que está
 * prestes a desistir. A regra é testada em `lib/caixa-conversas.ts`.
 */

export const dynamic = "force-dynamic";

export default async function CaixaPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/suporte/conversas");
  if (!canEdit(me)) redirect("/dashboard");

  const linhas = ordenarCaixa(await listarConversas().catch(() => []));
  const esperando = quantosEsperando(linhas);

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
            Conversas
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {esperando === 0
              ? "Ninguém esperando resposta."
              : esperando === 1
                ? "1 aluna esperando você responder."
                : `${esperando} alunas esperando você responder.`}
          </p>
        </header>

        <section className="px-5 py-6 lg:px-10 lg:py-8">
          {linhas.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] px-6 py-10 text-center">
              <p className="text-[14px] text-neutral-300">
                Nenhuma conversa ainda.
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
                Quando uma aluna escrever em{" "}
                <span className="font-mono text-neutral-400">/ajuda</span>, ela
                aparece aqui.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-2">
              {linhas.map((l) => (
                <Link
                  key={l.id}
                  href={`/suporte/conversas/${encodeURIComponent(l.id)}`}
                  className={`block rounded-xl border px-4 py-3.5 transition ${
                    l.esperando
                      ? "border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/50"
                      : "border-[#1f1f1f] bg-[#0d0d0d] hover:border-[#2e2e2e]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
                        {l.quem}
                        {l.esperando && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-amber-200">
                            <UserRound size={9} strokeWidth={2.6} />
                            esperando
                          </span>
                        )}
                      </p>
                      <p className="mt-1 truncate text-[12.5px] text-neutral-400">
                        {/* Quem falou por último. Se foi a aluna, ninguém
                            respondeu ainda — e é o que o time precisa ver. */}
                        {l.ultimaDe === "aluno" ? "" : "Você: "}
                        {l.previa}
                      </p>
                      {l.email && (
                        <p className="mt-1 truncate font-mono text-[11px] text-neutral-600">
                          {l.email}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 text-[11.5px] ${
                        l.esperando && l.minutos > 30
                          ? "font-semibold text-amber-300"
                          : "text-neutral-600"
                      }`}
                    >
                      {espera(l.minutos)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
