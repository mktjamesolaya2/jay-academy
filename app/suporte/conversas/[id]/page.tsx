import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { getConversa } from "@/lib/suporte-store";
import { SuporteResponder } from "@/components/suporte-responder";
import { ConfirmButton } from "@/components/confirm-button";
import { apagarConversaAction } from "@/app/suporte/actions";
import { espera, minutosDesde } from "@/lib/caixa-conversas";
import { FichaAluna } from "@/components/ficha-aluna";
import { protocoloDe } from "@/lib/protocolo";
import { linkWhatsApp, numeroDoSuporte, problemaDaConversa } from "@/lib/whatsapp-suporte";
import { formatDateTimeBR } from "@/lib/format-date";

/**
 * Uma conversa, do lado do time.
 *
 * ⚠️ Aqui o time **vê quem respondeu o quê** — IA ou pessoa. É o contrário da
 * tela da aluna, onde tudo aparece como um atendimento só: ela não precisa
 * desconfiar da resposta, mas quem atende precisa saber o que a IA já disse pra
 * não repetir nem contradizer.
 */

export const dynamic = "force-dynamic";

export default async function ConversaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentUser();
  const { id } = await params;
  if (!me) redirect(`/login?redirect=/suporte/conversas/${encodeURIComponent(id)}`);
  if (!canEdit(me)) redirect("/dashboard");

  const c = await getConversa(id);
  if (!c) notFound();

  const ultima = c.mensagens[c.mensagens.length - 1];
  const esperandoHa = ultima ? minutosDesde(ultima.em) : 0;

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
            Conversas
          </Link>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2.5 text-2xl font-semibold tracking-[-0.02em] text-white">
                {c.quem}
                {/* ⚠️ Aqui havia um "esperando você" em amarelo. James: *"não
                    quero notificação de cliente não respondido"* — e ele tem
                    razão: quem responde responde no WhatsApp, então cobrar
                    resposta nesta tela é cobrar por uma coisa que não acontece
                    aqui. A situação está escrita na ficha, sem tom de dívida. */}
                <span className="font-mono text-[13px] font-semibold tracking-wider text-[#AC9751]">
                  {protocoloDe(c.id)}
                </span>
              </h1>
            </div>

            {/* ⚠️ Apagar existe porque a caixa acumula conversa de teste. Sem
                botão, a única saída era mexer no banco — e teste misturado com
                aluna de verdade faz o time perder a de verdade de vista. */}
            <form
              action={async () => {
                "use server";
                await apagarConversaAction(id);
                redirect("/suporte");
              }}
              className="shrink-0"
            >
              <ConfirmButton
                message="Apagar esta conversa? Isso não tem volta."
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] px-2.5 py-1.5 text-[11.5px] font-semibold text-neutral-500 transition hover:border-rose-500/40 hover:text-rose-300"
              >
                <Trash2 size={11} strokeWidth={2.2} />
                Apagar
              </ConfirmButton>
            </form>
          </div>

          {ultima && (
            <p className="mt-1 text-sm text-neutral-500">
              última mensagem {espera(esperandoHa)}
            </p>
          )}
        </header>

        <section className="flex flex-col gap-5 px-5 py-6 lg:flex-row lg:items-start lg:gap-6 lg:px-8 lg:py-7">
          {/* ⚠️ A ficha vem ANTES da conversa na ordem do código, então no
              celular ela aparece em cima — que é o que ele quer ver primeiro
              quando chega com um protocolo na mão. */}
          <FichaAluna
            protocolo={protocoloDe(c.id)}
            nome={c.quem}
            email={c.emailAluna}
            quando={formatDateTimeBR(c.criadaEm)}
            situacao={c.aguardandoPessoa ? "Encaminhada pra uma pessoa" : "A I.A. está atendendo"}
            whatsapp={linkWhatsApp(numeroDoSuporte(), {
              nome: c.quem,
              problema: problemaDaConversa(c.mensagens),
              email: c.emailAluna,
              conversaId: c.id,
            })}
          />

          <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d]">
            <div className="max-h-[60vh] flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
              {c.mensagens.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.de === "aluno" ? "justify-start" : "justify-end"}`}
                >
                  <div className="max-w-[80%]">
                    {/* Quem falou. O time precisa distinguir a IA da pessoa pra
                        não repetir o que ela já respondeu. */}
                    <p
                      className={`mb-1 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider ${
                        m.de === "aluno"
                          ? "text-neutral-600"
                          : m.de === "ia"
                            ? "text-neutral-600"
                            : "justify-end text-emerald-500/70"
                      } ${m.de === "aluno" ? "" : "justify-end"}`}
                    >
                      {m.de === "aluno" ? (
                        c.quem
                      ) : m.de === "ia" ? (
                        <>
                          <Bot size={10} strokeWidth={2.6} /> I.A.
                        </>
                      ) : (
                        "Você"
                      )}
                    </p>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                        m.de === "aluno"
                          ? "bg-[#1a1a1a] text-neutral-200"
                          : m.de === "ia"
                            ? "bg-[#151515] text-neutral-400"
                            : "bg-emerald-600/20 text-emerald-50"
                      }`}
                    >
                      {m.texto}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <SuporteResponder id={c.id} comPessoa={c.aguardandoPessoa} />
          </div>
        </section>
      </main>
    </div>
  );
}
