"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";
import { generateSummaryAction } from "@/app/wp-pages/manage-actions";

export function SmartSummary({
  domain,
  slug,
  summary,
  canEdit,
}: {
  domain: string;
  slug: string;
  summary?: string;
  canEdit: boolean;
}) {
  const [state, dispatch, isPending] = useActionState(
    generateSummaryAction,
    undefined
  );
  const tried = useRef(false);

  // Sem resumo ainda? Gera automaticamente em background (uma vez).
  useEffect(() => {
    if (summary || !canEdit || tried.current || isPending) return;
    tried.current = true;
    const fd = new FormData();
    fd.set("domain", domain);
    fd.set("slug", slug);
    dispatch(fd);
  }, [summary, canEdit, isPending, domain, slug, dispatch]);

  if (summary) {
    return <p className="text-neutral-300 leading-relaxed">{summary}</p>;
  }

  if (isPending) {
    return (
      <p className="inline-flex items-center gap-2 text-neutral-500 text-sm">
        <Loader2 size={13} className="animate-spin" strokeWidth={2.4} />
        Lendo a página e gerando o resumo...
      </p>
    );
  }

  if (state?.error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/25 rounded-md px-2.5 py-2 flex items-start gap-2">
        <AlertCircle
          size={12}
          strokeWidth={2.4}
          className="text-rose-300 mt-0.5 shrink-0"
        />
        <p className="text-[11px] text-rose-300 font-medium leading-relaxed">
          {state.error}
        </p>
      </div>
    );
  }

  // Estado neutro (viewer sem resumo, ou antes do efeito disparar).
  return (
    <p className="inline-flex items-center gap-2 text-neutral-600 text-sm italic">
      <Sparkles size={12} strokeWidth={2} />
      Resumo sendo preparado...
    </p>
  );
}
