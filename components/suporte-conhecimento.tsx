"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { salvarConhecimentoAction } from "@/app/suporte/actions";

/**
 * O que a IA sabe — e é só isso que ela sabe.
 *
 * ⚠️ O prompt proíbe inventar preço, prazo e política. Então o que não estiver
 * escrito aqui vira "vou chamar uma pessoa", e não uma resposta inventada. É
 * de propósito: num suporte, resposta errada com confiança é pior que "não
 * sei" — o aluno age em cima dela.
 */
export function SuporteConhecimento({ inicial }: { inicial: string }) {
  const [texto, setTexto] = useState(inicial);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function salvar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await salvarConhecimentoAction(fd);
      if (!r.ok) return setErro(r.error ?? "Erro ao salvar");
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    });
  }

  return (
    <form action={salvar} className="flex h-[560px] flex-col gap-3">
      <textarea
        name="conhecimento"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3.5 font-mono text-[12.5px] leading-relaxed text-neutral-200 focus:border-neutral-600 focus:outline-none"
      />
      {erro && (
        <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] font-medium text-rose-300">
          {erro}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pendente}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-60"
        >
          {pendente && <Loader2 size={13} className="animate-spin" />}
          Salvar
        </button>
        {salvo && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-300">
            <Check size={13} strokeWidth={2.6} /> Salvo — já vale na próxima
            pergunta
          </span>
        )}
      </div>
    </form>
  );
}
