"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Code2, Trash2 } from "lucide-react";
import { salvarCodigoCrmAction } from "@/app/lps/actions";

/**
 * Onde se cola o código que o CRM gera pra página.
 *
 * ⚠️ É um BLOCO DE CÓDIGO, não uma URL. O CRM entrega formulário + script (ou
 * só o script, quando a página já tem formulário próprio), e a gente guarda do
 * jeito que veio. Remontar o script na mão só criaria uma segunda versão pra
 * quebrar toda vez que o CRM mudasse alguma coisa.
 *
 * Antes isso morava numa lista solta em /leads, longe da página a que pertence.
 * James: *"ficar colocando em muito lugar assim não vai dar certo"*. Agora fica
 * na tela da própria página, junto dos outros atalhos dela.
 */
export function CrmCodigoForm({
  slug,
  codigo,
}: {
  slug: string;
  codigo?: string;
}) {
  const [aberto, setAberto] = useState(!codigo);
  const [valor, setValor] = useState(codigo ?? "");
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function salvar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await salvarCodigoCrmAction(fd);
      if (!r.ok) return setErro(r.error ?? "Erro ao salvar");
      setSalvo(true);
      setAberto(false);
      setTimeout(() => setSalvo(false), 2500);
    });
  }

  if (!aberto) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
          <Check size={14} strokeWidth={2.6} className="shrink-0 text-emerald-300" />
          <p className="text-[12.5px] font-semibold text-emerald-200">
            {salvo ? "Código salvo" : "Código do CRM instalado nesta página"}
          </p>
        </div>
        <button
          onClick={() => setAberto(true)}
          className="text-[12.5px] font-semibold text-neutral-400 transition hover:text-white"
        >
          Ver ou trocar o código
        </button>
      </div>
    );
  }

  return (
    <form action={salvar} className="space-y-2.5">
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="codigo"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        rows={7}
        spellCheck={false}
        placeholder={'Cole aqui o código que o CRM gerou\n\n<form id="form-jayo">…'}
        className="w-full resize-y rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
      />
      <p className="text-[11.5px] leading-relaxed text-neutral-500">
        Entra no fim da página, antes do <code className="text-neutral-400">&lt;/body&gt;</code>.
        Se a página já tem formulário próprio, peça no CRM a variante{" "}
        <strong className="text-neutral-300">só o envio</strong> — a completa
        criaria um segundo formulário.
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
          {pendente ? (
            <Loader2 size={13} strokeWidth={2.4} className="animate-spin" />
          ) : (
            <Code2 size={13} strokeWidth={2.4} />
          )}
          Salvar código
        </button>
        {codigo && (
          <button
            type="submit"
            name="codigo"
            value=""
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12.5px] font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            <Trash2 size={12} strokeWidth={2.2} /> Tirar
          </button>
        )}
      </div>
    </form>
  );
}
