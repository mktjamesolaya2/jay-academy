import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, Settings2, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ConfirmButton } from "@/components/confirm-button";
import { PainelUso } from "@/components/painel-uso";
import { apagarConversaAction } from "@/app/suporte/actions";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { listarConversas, lerUsoIA } from "@/lib/suporte-store";
import { listarReenvios } from "@/lib/reenvio-store";
import { ordenarCaixa, espera } from "@/lib/caixa-conversas";
import { combinaBusca, protocoloDe } from "@/lib/protocolo";
import { limiteDoDia } from "@/lib/uso-ia";

/**
 * A caixa de entrada do time — **a tela principal do suporte**.
 *
 * ⚠️ James: *"não quero notificação de cliente não respondido"*. A tela não
 * cobra ninguém: o portal é pra **ficar de olho**, e quem responde de verdade
 * responde no WhatsApp. Contador de "3 alunas esperando" numa tela onde não se
 * responde é só culpa de graça.
 *
 * ⚠️ A busca é o coração daqui. O caminho real é: a aluna manda o protocolo no
 * WhatsApp → ele cola aqui → abre a ficha dela. Por isso a busca fica na coluna
 * da esquerda, junto do que precisa de olho, e não escondida no topo.
 */

export const dynamic = "force-dynamic";

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/suporte");
  if (!canEdit(me)) redirect("/dashboard");

  const busca = ((await searchParams).q ?? "").trim();

  // ⚠️ Conversa de treino NÃO entra: misturada com aluna de verdade, ela faz
  // o time perder a de verdade de vista — e foi o que o James viu na tela.
  const todas = ordenarCaixa(
    (await listarConversas().catch(() => [])).filter((c) => !c.teste)
  );
  const linhas = todas.filter((l) => combinaBusca(l, busca));

  const [uso, reenvios] = await Promise.all([
    lerUsoIA().catch(() => ({ usadas: 0, estourou: false })),
    listarReenvios().catch(() => []),
  ]);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-5 lg:px-8 lg:pt-8 lg:pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
                Suporte
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {todas.length === 0
                  ? "As conversas do chat da aluna aparecem aqui."
                  : todas.length === 1
                    ? "1 conversa."
                    : `${todas.length} conversas.`}
              </p>
            </div>
            <Link
              href="/suporte/ajustes"
              className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500 transition hover:text-white"
            >
              <Settings2 size={13} strokeWidth={2.2} />
              Treinar a I.A.
            </Link>
          </div>
        </header>

        <section className="flex flex-col gap-5 px-5 py-6 lg:flex-row lg:items-start lg:gap-6 lg:px-8 lg:py-7">
          {/* A coluna da esquerda: buscar, e o que precisa de olho. */}
          <div className="w-full shrink-0 space-y-3 lg:w-[230px]">
            {/* ⚠️ Formulário GET de propósito: a busca fica na URL, então ele
                pode deixar um protocolo salvo, mandar o link pra alguém do time
                e voltar nele depois. */}
            <form method="GET" className="relative">
              <Search
                size={13}
                strokeWidth={2.4}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600"
              />
              <input
                name="q"
                defaultValue={busca}
                placeholder="Protocolo, nome ou e-mail"
                aria-label="Buscar aluna"
                className="w-full rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] py-2.5 pl-8 pr-3 text-[12.5px] text-white placeholder:text-neutral-600 focus:border-[#AC9751]/50 focus:outline-none"
              />
            </form>

            <PainelUso
              inicial={{
                usadas: uso.usadas,
                paradaPorCota: uso.estourou,
                limite: limiteDoDia(),
                emails: reenvios.length,
              }}
            />
          </div>

          {/* As conversas ocupam todo o resto. */}
          <div className="min-w-0 flex-1 space-y-2">
            {linhas.length === 0 ? (
              <div className="rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] px-6 py-10 text-center">
                <p className="text-[14px] text-neutral-300">
                  {busca ? `Nada com "${busca}".` : "Nenhuma conversa ainda."}
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
                  {busca ? (
                    <>
                      O protocolo tem 6 caracteres, como{" "}
                      <span className="font-mono text-neutral-400">B4B39D</span>.{" "}
                      <Link href="/suporte" className="text-[#AC9751] hover:underline">
                        Ver todas
                      </Link>
                    </>
                  ) : (
                    <>
                      Quando uma aluna escrever em{" "}
                      <span className="font-mono text-neutral-400">/ajuda</span>,
                      ela aparece aqui.
                    </>
                  )}
                </p>
              </div>
            ) : (
              linhas.map((l) => (
                <div key={l.id} className="group relative">
                  <Link
                    href={`/suporte/conversas/${encodeURIComponent(l.id)}`}
                    className="block rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] py-3.5 pl-4 pr-12 transition hover:border-[#2e2e2e]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] font-semibold text-white">
                          {l.quem}
                          {/* O protocolo à vista: é por ele que ela liga. */}
                          <span className="rounded-md bg-[#AC9751]/12 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tracking-wider text-[#AC9751]">
                            {protocoloDe(l.id)}
                          </span>
                        </p>
                        <p className="mt-1 truncate text-[12.5px] text-neutral-400">
                          {l.ultimaDe === "aluno" ? "" : "IA: "}
                          {l.previa}
                        </p>
                        {l.email && (
                          <p className="mt-1 truncate font-mono text-[11px] text-neutral-600">
                            {l.email}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[11.5px] text-neutral-600">
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
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
