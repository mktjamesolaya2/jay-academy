"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createSuggestionAction } from "./actions";

export function NewSuggestionForm() {
  const [state, action] = useActionState(createSuggestionAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
          Título
        </label>
        <input
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="O que tá faltando?"
          className="form-input"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
          Descrição
        </label>
        <textarea
          name="description"
          rows={5}
          maxLength={2000}
          placeholder="Conta com mais detalhes — pra que serve, quando você usaria, qual o problema atual..."
          className="form-input resize-none"
        />
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">
          <AlertCircle
            size={12}
            strokeWidth={2.4}
            className="text-rose-300 mt-0.5 shrink-0"
          />
          <p className="text-[11px] text-rose-200 font-medium">{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2">
          <CheckCircle2
            size={12}
            strokeWidth={2.4}
            className="text-emerald-300 shrink-0"
          />
          <p className="text-[11px] text-emerald-200 font-medium">
            {state.success}
          </p>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 size={13} className="animate-spin" strokeWidth={2.4} />
          Enviando...
        </>
      ) : (
        "Enviar sugestão"
      )}
    </button>
  );
}
