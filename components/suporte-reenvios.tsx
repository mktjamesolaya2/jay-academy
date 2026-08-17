"use client";

import { useTransition } from "react";
import { Check, Loader2, MailWarning } from "lucide-react";
import { marcarReenviadoAction } from "@/app/suporte/actions";
import type { Reenvio } from "@/lib/reenvio-store";

/**
 * A caixa dos acessos pra reenviar.
 *
 * ⚠️ **Só aparece quando tem algo na fila.** O James pediu que a tela do
 * suporte fosse só o chat — então, com a fila vazia, ela some e a tela continua
 * sendo só a conversa. Quando tem gente esperando, aí sim ela ocupa espaço,
 * porque é aluna com acesso pago que não está conseguindo entrar.
 *
 * Reenviar acesso não tem API (a sonda confirmou): é clique na Hotmart. Aqui é
 * a lista do que clicar, e o botão só risca da lista.
 */
export function SuporteReenvios({ reenvios }: { reenvios: Reenvio[] }) {
  const [pendente, startTransition] = useTransition();
  if (!reenvios.length) return null;

  return (
    <div className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <MailWarning size={14} strokeWidth={2.2} className="text-amber-300" />
        <p className="text-[13px] font-semibold text-amber-100">
          {reenvios.length === 1
            ? "1 acesso pra reenviar na Hotmart"
            : `${reenvios.length} acessos pra reenviar na Hotmart`}
        </p>
      </div>

      <div className="space-y-2">
        {reenvios.map((r) => (
          <div
            key={r.email}
            className="flex items-start justify-between gap-3 rounded-lg bg-[#0d0d0d]/60 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-[12.5px] text-neutral-200">
                {r.email}
              </p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-neutral-500">
                {r.nome ? `${r.nome} · ` : ""}
                {r.produtos.join(", ")}
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
              title="Já reenviei na Hotmart"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#262626] px-2.5 py-1.5 text-[11.5px] font-semibold text-neutral-300 transition hover:border-emerald-500/40 hover:text-emerald-200 disabled:opacity-50"
            >
              {pendente ? (
                <Loader2 size={11} strokeWidth={2.4} className="animate-spin" />
              ) : (
                <Check size={11} strokeWidth={2.6} />
              )}
              Já reenviei
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
