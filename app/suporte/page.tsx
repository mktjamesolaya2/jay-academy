import { redirect } from "next/navigation";
import Link from "next/link";
import { KeyRound, Settings2, Trash2, UserRound } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { apagarConversaAction } from "@/app/suporte/actions";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { listarConversas } from "@/lib/suporte-store";
import { ordenarCaixa, quantosEsperando, espera } from "@/lib/caixa-conversas";
import { listarReenvios } from "@/lib/reenvio-store";

/**
 * A caixa de entrada do time — **a tela principal do suporte**.
 *
 * ⚠️ James: *"não quero isso de conversa teste, nem de aluna esperando
 * resposta; quero que as conversas apareçam direto aqui já mesmo"*. O chat
 * de treino saiu daqui pra `/suporte/ajustes`, junto com a base — é lá que
 * a IA é treinada, e o portal é pra **ficar de olho** nas conversas.
 *
 * ⚠️ A ordem **não** é a mais recente primeiro. Quem espera uma pessoa vem no
 * topo, e entre eles o que espera há mais tempo — porque é essa aluna que está
 * prestes a desistir. A regra é testada em `lib/caixa-conversas.ts`.
 */

export const dynamic = "force-dynamic";

export default async function CaixaPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/suporte");
  if (!canEdit(me)) redirect("/dashboard");

  // ⚠️ Conversa de treino NÃO entra: misturada com aluna de verdade, ela faz
  // o time perder a de verdade de vista — e foi o que o James viu na tela.
  const linhas = ordenarCaixa(
    (await listarConversas().catch(() => [])).filter((c) => !c.teste)
  );
  const reenvios = (await listarReenvios().catch(() => [])).length;
  const esperando = quantosEsperando(linhas);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-5 lg:px-10 lg:pt-8 lg:pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
              Suporte
            </h1>
            <div className="flex shrink-0 items-center gap-4">
              <Link
                href="/suporte/reenvios"
                className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold transition ${
                  reenvios > 0
                    ? "text-amber-300 hover:text-amber-200"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                <KeyRound size={13} strokeWidth={2.2} />
                Liberar acesso
                {reenvios > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10.5px] leading-none">
                    {reenvios}
                  </span>
                )}
              </Link>
              <Link
                href="/suporte/ajustes"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500 transition hover:text-white"
              >
                <Settings2 size={13} strokeWidth={2.2} />
                Treinar a I.A.
              </Link>
            </div>
          </div>
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
                <div key={l.id} className="group relative">
                <Link
                  href={`/suporte/conversas/${encodeURIComponent(l.id)}`}
                  className={`block rounded-xl border py-3.5 pl-4 pr-12 transition ${
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

                {/* ⚠️ Apagar tem que existir AQUI, não só dentro da conversa:
                    limpar teste era entrar em cada uma, apagar, voltar. No
                    celular fica sempre visível — passar o mouse não existe. */}
                <form
                  action={async () => {
                    "use server";
                    await apagarConversaAction(l.id);
                  }}
                  className="absolute right-2 top-2.5"
                >
                  <ConfirmButton
                    message={`Apagar a conversa de ${l.quem}? Isso não tem volta.`}
                    title="Apagar conversa"
                    className="rounded-lg p-2 text-neutral-700 transition hover:bg-rose-500/10 hover:text-rose-300 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                  </ConfirmButton>
                </form>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
