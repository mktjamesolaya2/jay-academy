"use client";

import { useActionState } from "react";
import { setLpWebhookAction } from "@/app/leads/actions";

export function LpWebhookForm({
  slug,
  title,
  webhook,
  redirect,
}: {
  slug: string;
  title: string;
  webhook?: string;
  redirect?: string;
}) {
  const [state, action, pending] = useActionState(setLpWebhookAction, undefined);
  const saved = state?.ok && state.slug === slug;
  const err = state?.error && state.slug === slug ? state.error : null;

  return (
    <form
      action={action}
      className="grid grid-cols-1 md:grid-cols-[160px_1fr_1fr_auto] gap-2 items-center px-4 py-3 border-b border-[#161616] last:border-0"
    >
      <input type="hidden" name="slug" value={slug} />
      <div className="min-w-0">
        <p className="text-sm text-white font-semibold truncate">{title}</p>
        <p className="text-[11px] text-neutral-500 font-mono truncate">/{slug}</p>
      </div>
      <input
        name="webhook"
        defaultValue={webhook ?? ""}
        placeholder="Webhook URL (Clint/Zapier)"
        className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 font-mono"
      />
      <input
        name="redirect"
        defaultValue={redirect ?? ""}
        placeholder="Redirect após enviar (opcional)"
        className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 font-mono"
      />
      <button
        type="submit"
        disabled={pending}
        className="btn-ghost text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60 whitespace-nowrap"
      >
        {pending ? "..." : saved ? "Salvo ✓" : "Salvar"}
      </button>
      {err && (
        <p className="md:col-span-4 text-[11px] text-rose-300">{err}</p>
      )}
    </form>
  );
}
