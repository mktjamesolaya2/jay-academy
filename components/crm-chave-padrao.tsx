"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { salvarChavePadraoAction } from "@/app/settings/crm-action";

/**
 * A chave do CRM que vale pro site inteiro.
 *
 * ⚠️ Sem isto, cada uma das 70+ páginas precisava da chave colada à mão — e na
 * prática quase nenhuma tinha, então o lead ficava só no portal. Foi o caso da
 * lead Ana Novaes, que entrou pela /contato-instagram sem chave configurada.
 */
export function CrmChavePadrao({ atual }: { atual: string | null }) {
  const [valor, setValor] = useState(atual ?? "");
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function salvar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await salvarChavePadraoAction(fd);
      if (!r.ok) return setErro(r.error ?? "Erro ao salvar");
      setValor(r.chave ?? "");
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    });
  }

  return (
    <form action={salvar} className="space-y-2.5">
      <input
        name="chave"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        spellCheck={false}
        placeholder="Cole o código do CRM, ou só a chave pk_…"
        className="w-full rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2.5 font-mono text-[12px] text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
      />
      <p className="text-[11.5px] leading-relaxed text-neutral-500">
        Vale pra <strong className="text-neutral-300">todas as páginas</strong>.
        Uma página só precisa da chave dela quando for pra um funil diferente —
        aí a dela vence esta.
      </p>
      {erro && (
        <p className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] font-medium text-rose-300">
          {erro}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-60"
        >
          {pendente && <Loader2 size={13} strokeWidth={2.4} className="animate-spin" />}
          Salvar chave padrão
        </button>
        {salvo && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-300">
            <Check size={13} strokeWidth={2.6} /> Salvo
          </span>
        )}
      </div>
    </form>
  );
}
