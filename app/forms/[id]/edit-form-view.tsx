"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { updateFormAction } from "../actions";

export function EditFormView({
  id,
  name,
  description,
  buttonLabel,
  webhookUrl,
  redirectUrl,
}: {
  id: string;
  name: string;
  description?: string;
  buttonLabel: string;
  webhookUrl?: string;
  redirectUrl?: string;
}) {
  const [state, action] = useActionState(updateFormAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      <Field label="Nome">
        <input
          name="name"
          type="text"
          required
          defaultValue={name}
          className="form-input"
        />
      </Field>

      <Field label="Descrição">
        <textarea
          name="description"
          rows={2}
          defaultValue={description}
          placeholder="Opcional — aparece embaixo do título no formulário público"
          className="form-input resize-none"
        />
      </Field>

      <Field label="Label do botão">
        <input
          name="buttonLabel"
          type="text"
          defaultValue={buttonLabel}
          className="form-input"
        />
      </Field>

      <Field
        label="Webhook URL"
        hint="Pra onde os dados são enviados (Clint, Zapier, Make, RD Station)"
      >
        <input
          name="webhookUrl"
          type="url"
          defaultValue={webhookUrl}
          placeholder="https://..."
          className="form-input font-mono text-xs"
        />
      </Field>

      <Field
        label="Redirect URL"
        hint="Pra onde o usuário vai depois de enviar (ex: link do WhatsApp). Vazio = mostra mensagem de sucesso."
      >
        <input
          name="redirectUrl"
          type="url"
          defaultValue={redirectUrl}
          placeholder="https://wa.me/55..."
          className="form-input font-mono text-xs"
        />
      </Field>

      {state?.error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2.5">
          <AlertCircle
            size={13}
            strokeWidth={2.4}
            className="text-rose-300 mt-0.5 shrink-0"
          />
          <p className="text-xs text-rose-200 font-medium">{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2.5">
          <CheckCircle2
            size={13}
            strokeWidth={2.4}
            className="text-emerald-300 shrink-0"
          />
          <p className="text-xs text-emerald-200 font-medium">
            {state.success}
          </p>
        </div>
      )}

      <SaveButton />
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 size={13} className="animate-spin" strokeWidth={2.4} />
          Salvando...
        </>
      ) : (
        "Salvar alterações"
      )}
    </button>
  );
}
