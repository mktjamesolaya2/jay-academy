"use client";

import { useState, useTransition } from "react";
import { Check, ClipboardCopy, Loader2 } from "lucide-react";
import { marcarReenviadoAction } from "@/app/suporte/actions";
import type { Reenvio } from "@/lib/reenvio-store";

/**
 * A lista de e-mails esperando liberação na Hotmart.
 *
 * ⚠️ James: *"quando for questão de liberação de curso, pra fazer o reenvio do
 * acesso, a IA tem que pegar o e-mail e a gente vai criar um lugar onde vai
 * ficar todos os e-mails, pra gente só COPIAR e liberar lá na Hotmart"*.
 *
 * O verbo é **copiar**. Por isso o e-mail é um botão inteiro: um clique e ele
 * está na área de transferência, pronto pra colar na Hotmart. Selecionar texto
 * com o mouse numa lista de vinte e-mails é onde alguém copia o da linha errada
 * — e liberar acesso pra pessoa errada é um erro difícil de desfazer.
 */
export function ReenviosLista({ reenvios }: { reenvios: Reenvio[] }) {
  const [copiado, setCopiado] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  async function copiar(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopiado(email);
      setTimeout(() => setCopiado((c) => (c === email ? null : c)), 1600);
    } catch {
      // Navegador sem permissão de área de transferência: selecionar à mão
      // ainda funciona, e um erro aqui não ajuda em nada.
    }
  }

  if (!reenvios.length) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] px-6 py-10 text-center">
        <p className="text-[14px] text-neutral-300">Nenhum acesso pra liberar.</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
          Quando a I.A. confirmar que uma aluna tem acesso válido e só precisa
          receber de novo, o e-mail dela aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-2">
      {reenvios.map((r) => (
        <div
          key={r.email}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] px-4 py-3.5"
        >
          <div className="min-w-0">
            <button
              onClick={() => copiar(r.email)}
              title="Copiar o e-mail"
              className="group flex max-w-full items-center gap-2 text-left"
            >
              <span className="truncate font-mono text-[13.5px] text-neutral-100 group-hover:text-white">
                {r.email}
              </span>
              {copiado === r.email ? (
                <Check size={13} strokeWidth={2.6} className="shrink-0 text-emerald-400" />
              ) : (
                <ClipboardCopy
                  size={13}
                  strokeWidth={2}
                  className="shrink-0 text-neutral-600 transition group-hover:text-amber-300"
                />
              )}
            </button>
            <p className="mt-1 text-[11.5px] leading-relaxed text-neutral-500">
              {r.nome ? `${r.nome} · ` : ""}
              {r.produtos.join(", ")}
              {/* A data de validade confirma que é REENVIO, não renovação —
                  quem libera precisa saber que o acesso dela está em dia. */}
              {" · acesso até "}
              {new Date(r.venceEm).toLocaleDateString("pt-BR")}
            </p>
          </div>

          <button
            disabled={pendente}
            onClick={() =>
              startTransition(async () => {
                await marcarReenviadoAction(r.email);
              })
            }
            title="Já liberei na Hotmart"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#262626] px-2.5 py-1.5 text-[11.5px] font-semibold text-neutral-300 transition hover:border-emerald-500/40 hover:text-emerald-200 disabled:opacity-50"
          >
            {pendente ? (
              <Loader2 size={11} strokeWidth={2.4} className="animate-spin" />
            ) : (
              <Check size={11} strokeWidth={2.6} />
            )}
            Já liberei
          </button>
        </div>
      ))}
    </div>
  );
}
