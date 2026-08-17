"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { removerLacunaAction } from "@/app/suporte/actions";
import type { Lacuna } from "@/lib/suporte-store";

/**
 * A fila do que ela ainda não sabe.
 *
 * ⚠️ É por aqui que ela fica mais esperta — com o James no meio, de propósito.
 * IA que aprende das próprias respostas grava o próprio erro como verdade e
 * passa a repetir com mais confiança. Aqui entra só a PERGUNTA; quem escreve a
 * resposta é ele, e ela vai pra base.
 */
export function SuporteLacunas({ lacunas }: { lacunas: Lacuna[] }) {
  const [pendente, startTransition] = useTransition();
  const [copiada, setCopiada] = useState<string | null>(null);

  if (!lacunas.length) {
    return (
      <p className="rounded-xl border border-dashed border-[#262626] px-4 py-5 text-center text-[12.5px] leading-relaxed text-neutral-600">
        Nada aqui ainda. Toda pergunta que ela não souber responder cai nesta
        lista.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {lacunas.slice(0, 12).map((l) => (
        <div
          key={l.pergunta}
          className="flex items-start gap-3 rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-3.5 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13px] leading-relaxed text-neutral-200">
              {l.pergunta}
            </p>
            {l.vezes > 1 && (
              <p className="mt-1 text-[11.5px] font-semibold text-amber-300/80">
                perguntada {l.vezes} vezes
              </p>
            )}
          </div>
          <button
            title="Copiar pra colar na base ao lado"
            onClick={() => {
              navigator.clipboard?.writeText(l.pergunta);
              setCopiada(l.pergunta);
              setTimeout(() => setCopiada(null), 1800);
            }}
            className="shrink-0 text-[11.5px] font-semibold text-neutral-500 transition hover:text-white"
          >
            {copiada === l.pergunta ? (
              <Check size={13} strokeWidth={2.6} className="text-emerald-300" />
            ) : (
              "copiar"
            )}
          </button>
          <button
            title="Já resolvi — tirar da lista"
            disabled={pendente}
            onClick={() =>
              startTransition(async () => {
                await removerLacunaAction(l.pergunta);
              })
            }
            className="shrink-0 text-neutral-600 transition hover:text-rose-300"
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
      ))}
    </div>
  );
}
