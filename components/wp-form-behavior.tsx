"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Webhook,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { setWpPageBehaviorAction } from "@/app/wp-pages/behavior-actions";

export function WpFormBehavior({
  domain,
  slug,
  initialWebhookUrl,
  initialRedirectUrl,
  isPublished,
}: {
  domain: string;
  slug: string;
  initialWebhookUrl?: string;
  initialRedirectUrl?: string;
  isPublished: boolean;
}) {
  const [state, action] = useActionState(setWpPageBehaviorAction, undefined);

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-2.5">
        <span className="w-8 h-8 rounded-md bg-[#161616] flex items-center justify-center shrink-0 mt-0.5">
          <Webhook size={14} strokeWidth={2} className="text-neutral-300" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">
            Webhook + redirect dos formulários
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
            O portal intercepta qualquer{" "}
            <span className="font-mono text-neutral-300">{"<form>"}</span> dessa
            página, manda os dados pro webhook configurado e redireciona
            depois. Funciona com Elementor, CF7, Gravity Forms e qualquer
            outro.
          </p>
        </div>
      </div>

      <form action={action} className="space-y-3 pt-1">
        <input type="hidden" name="domain" value={domain} />
        <input type="hidden" name="slug" value={slug} />

        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <Webhook size={11} strokeWidth={2.4} className="text-emerald-300" />
              Webhook URL
            </span>
          }
          hint="Pra onde os dados vão (Clint, Zapier, Make, RD Station)."
        >
          <input
            name="webhookUrl"
            type="url"
            defaultValue={initialWebhookUrl}
            placeholder="https://functions-api.clint.digital/endpoints/integration/webhook/..."
            className="form-input font-mono text-xs"
          />
        </Field>

        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <Globe size={11} strokeWidth={2.4} className="text-violet-300" />
              Redirect URL
            </span>
          }
          hint="Pra onde o usuário vai depois de enviar. Vazio = mensagem de sucesso."
        >
          <input
            name="redirectUrl"
            type="url"
            defaultValue={initialRedirectUrl}
            placeholder="https://wa.me/55..."
            className="form-input font-mono text-xs"
          />
        </Field>

        {state?.error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2.5">
            <AlertCircle
              size={12}
              strokeWidth={2.4}
              className="text-rose-300 mt-0.5 shrink-0"
            />
            <p className="text-[11px] text-rose-200 font-medium">
              {state.error}
            </p>
          </div>
        )}

        {state?.success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2.5">
            <CheckCircle2
              size={12}
              strokeWidth={2.4}
              className="text-emerald-300 shrink-0"
            />
            <p className="text-[11px] text-emerald-200 font-medium">
              {state.success}{" "}
              {isPublished
                ? "— já vale pra próxima submissão"
                : "— publique a página pra valer público"}
            </p>
          </div>
        )}

        <SaveButton />
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
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
        "Salvar comportamento"
      )}
    </button>
  );
}
