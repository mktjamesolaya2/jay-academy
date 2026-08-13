"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { reenviarProCrmAction } from "@/app/leads/reenviar-action";

/**
 * Mostra se o lead chegou no CRM e, quando não chegou, deixa reenviar.
 *
 * ⚠️ Antes o portal mostrava o lead como recebido e pronto — mesmo quando o CRM
 * tinha recusado. James: *"o lead foi criado aqui dentro do portal, apenas não
 * dentro do CRM"*, e ele só descobriu abrindo o CRM pra conferir. O estado dos
 * dois sistemas tem que estar visível no mesmo lugar.
 */
export function CrmStatusLead({
  id,
  status,
  erro,
}: {
  id: string;
  status?: "ok" | "falhou" | "sem-chave";
  erro?: string;
}) {
  const [resultado, setResultado] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/25">
        no CRM
      </span>
    );
  }

  if (status === "sem-chave" || !status) {
    return (
      <span className="text-[11px] text-neutral-600" title="Essa página não tem webhook do CRM">
        —
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-500/25"
        title={erro}
      >
        não chegou no CRM
      </span>
      <button
        onClick={() =>
          startTransition(async () => {
            const r = await reenviarProCrmAction(id);
            setResultado(r.ok ? "Chegou no CRM" : r.error ?? "Falhou de novo");
          })
        }
        disabled={pendente}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 transition hover:text-white disabled:opacity-60"
      >
        {pendente ? (
          <Loader2 size={10} strokeWidth={2.4} className="animate-spin" />
        ) : (
          <RefreshCw size={10} strokeWidth={2.4} />
        )}
        Reenviar
      </button>
      {resultado && (
        <span className="max-w-[200px] text-[11px] leading-snug text-neutral-500">
          {resultado}
        </span>
      )}
    </span>
  );
}
