"use client";

import { useState, useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { voltarProOriginalAction } from "@/app/lps/actions";

/**
 * Aviso de que a página está sendo servida da versão editada no painel, e não
 * do arquivo do repositório.
 *
 * ⚠️ Isso não pode ser silencioso. Depois de salvar pelo editor, mexer no
 * arquivo e dar push **não muda mais nada** na página no ar — e sem este aviso
 * a pessoa fica editando o repositório sem entender por que não acontece nada.
 */
export function VoltarOriginal({ slug }: { slug: string }) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function voltar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await voltarProOriginalAction(fd);
      if (!r.ok) setErro(r.error ?? "Erro");
    });
  }

  return (
    <form action={voltar} className="space-y-2.5">
      <input type="hidden" name="slug" value={slug} />
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
        <p className="text-[12.5px] font-semibold text-amber-200">
          Esta página está sendo servida da versão editada no painel
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-amber-100/70">
          Enquanto isso valer, mexer no arquivo do repositório e dar push{" "}
          <strong className="font-semibold">não muda</strong> a página no ar.
        </p>
      </div>
      {erro && <p className="text-[12px] font-medium text-rose-300">{erro}</p>}
      <button
        type="submit"
        disabled={pendente}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] px-3 py-2 text-[12.5px] font-semibold text-neutral-300 transition hover:border-neutral-600 hover:text-white disabled:opacity-60"
      >
        {pendente ? (
          <Loader2 size={13} strokeWidth={2.4} className="animate-spin" />
        ) : (
          <RotateCcw size={13} strokeWidth={2.4} />
        )}
        Voltar pro original do repositório
      </button>
    </form>
  );
}
