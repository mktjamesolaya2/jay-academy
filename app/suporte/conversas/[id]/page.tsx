import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, UserRound } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { getConversa } from "@/lib/suporte-store";
import { SuporteResponder } from "@/components/suporte-responder";
import { espera, minutosDesde } from "@/lib/caixa-conversas";

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
            href="/suporte/conversas"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500 transition hover:text-white"
          >
            <ArrowLeft size={13} strokeWidth={2.2} />
            Conversas
          </Link>
          <h1 className="mt-2 flex flex-wrap items-center gap-2.5 text-2xl font-semibold tracking-[-0.02em] text-white">
            {c.quem}
            {c.aguardandoPessoa && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                <UserRound size={10} strokeWidth={2.6} />
                esperando você
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {c.emailAluna ? (
              <span className="font-mono text-[12.5px]">{c.emailAluna}</span>
            ) : (
              "sem e-mail informado"
            )}
            {ultima && <> · última mensagem {espera(esperandoHa)}</>}
          </p>
        </header>

        <section className="px-5 py-6 lg:px-10 lg:py-8">
          <div className="mx-auto flex max-w-2xl flex-col rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d]">
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
