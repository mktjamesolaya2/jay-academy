"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { submitFormAction } from "./actions";

export function PublicFormView({
  slug,
  name,
  description,
  buttonLabel,
}: {
  slug: string;
  name: string;
  description?: string;
  buttonLabel: string;
}) {
  const [state, action] = useActionState(submitFormAction, undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
            {name}
          </h1>
          {description && (
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
              {description}
            </p>
          )}

          {state?.success ? (
            <div className="mt-8 flex flex-col items-center text-center py-8">
              <span className="w-14 h-14 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25 flex items-center justify-center mb-4">
                <CheckCircle2
                  size={26}
                  strokeWidth={2}
                  className="text-emerald-300"
                />
              </span>
              <h2 className="text-lg font-semibold text-white">Recebido!</h2>
              <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
                Seus dados foram enviados. Em breve entramos em contato.
              </p>
            </div>
          ) : (
            <form action={action} className="mt-6 space-y-3">
              <input type="hidden" name="__slug" value={slug} />
              {/* Honeypot anti-bot — humanos não veem, bots preenchem */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <FieldInput
                name="name"
                type="text"
                placeholder="Nome"
                autoComplete="name"
              />
              <FieldInput
                name="whatsapp"
                type="tel"
                placeholder="WhatsApp com DDD"
                autoComplete="tel"
              />
              <FieldInput
                name="email"
                type="email"
                placeholder="E-mail"
                autoComplete="email"
              />

              {state?.error && (
                <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2.5">
                  <AlertCircle
                    size={13}
                    strokeWidth={2.4}
                    className="text-rose-300 mt-0.5 shrink-0"
                  />
                  <p className="text-xs text-rose-200 font-medium">
                    {state.error}
                  </p>
                </div>
              )}

              <SubmitButton label={buttonLabel} />
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-neutral-600 mt-4">
          Powered by Jay Academy
        </p>
      </div>
    </div>
  );
}

function FieldInput({
  name,
  type,
  placeholder,
  autoComplete,
}: {
  name: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      required
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full bg-[#0a0a0a] border border-[#1f1f1f] focus:border-neutral-600 rounded-lg px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none transition"
    />
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full btn-primary inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold disabled:opacity-70 mt-2"
    >
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" strokeWidth={2.4} />
          Enviando...
        </>
      ) : (
        label
      )}
    </button>
  );
}
