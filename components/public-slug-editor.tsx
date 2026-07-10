"use client";

import { useState, useActionState, useEffect } from "react";
import { Pencil, Check, X, ExternalLink, Loader2 } from "lucide-react";
import { changePublicSlugAction } from "@/app/wp-pages/manage-actions";

/**
 * Editor inline da URL pública (slug) de uma página. Mostra a URL atual com um
 * lápis; ao clicar, vira um campo pra digitar a nova URL. A ação valida que a
 * URL não está em uso por outra página publicada e mostra o erro aqui mesmo.
 */
export function PublicSlugEditor({
  domain,
  slug,
  publicSlug,
  published,
}: {
  domain: string;
  slug: string;
  publicSlug: string;
  published: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    changePublicSlugAction,
    undefined
  );

  // Fecha o editor quando salva com sucesso.
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5 group/url">
        {published ? (
          <a
            href={`/${publicSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white font-mono transition"
          >
            /{publicSlug}
            <ExternalLink size={10} strokeWidth={2} />
          </a>
        ) : (
          <span className="text-[11px] text-neutral-500 font-mono">
            /{publicSlug}
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Trocar a URL"
          className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-500 hover:text-emerald-300 transition px-1.5 py-0.5 rounded ring-1 ring-[#262626] hover:ring-emerald-500/30"
        >
          <Pencil size={10} strokeWidth={2.2} />
          Trocar URL
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-1">
      <input type="hidden" name="domain" value={domain} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center gap-1">
        <span className="text-neutral-500 font-mono text-[11px]">/</span>
        <input
          name="publicSlug"
          defaultValue={publicSlug}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="minha-lp"
          className="w-36 bg-[#0a0a0a] border border-[#2a2a2a] focus:border-emerald-500/50 rounded px-2 py-1 text-[11px] text-white font-mono outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          title="Salvar"
          className="p-1 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50 transition"
        >
          {pending ? (
            <Loader2 size={12} strokeWidth={2.4} className="animate-spin" />
          ) : (
            <Check size={12} strokeWidth={2.6} />
          )}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          title="Cancelar"
          className="p-1 rounded bg-[#1a1a1a] text-neutral-400 hover:text-white transition"
        >
          <X size={12} strokeWidth={2.4} />
        </button>
      </div>
      {state?.error && (
        <p className="text-[10px] text-red-300 max-w-[220px] leading-snug">
          {state.error}
        </p>
      )}
    </form>
  );
}
