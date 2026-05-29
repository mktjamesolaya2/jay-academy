"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, AlertCircle, Webhook, Globe } from "lucide-react";
import { createFormAction } from "../actions";

export function NewFormView() {
  const [state, action] = useActionState(createFormAction, undefined);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  return (
    <form action={action} className="space-y-6">
      <Section
        title="Identificação"
        description="Como esse formulário aparece pra você e na URL pública."
      >
        <Field label="Nome interno" required>
          <input
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Captura PMU CLASS"
            className="form-input"
          />
        </Field>
        <Field
          label="Slug (URL pública)"
          hint={
            <>
              URL final:{" "}
              <span className="text-neutral-300 font-mono">
                jayacademy.com.br/f/{slug || slugify(name) || "[slug]"}
              </span>
            </>
          }
        >
          <input
            name="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugify(name) || "captura-pmu-class"}
            className="form-input font-mono"
          />
        </Field>
        <Field label="Descrição (opcional)">
          <textarea
            name="description"
            rows={2}
            placeholder="Aparece embaixo do título no formulário público"
            className="form-input resize-none"
          />
        </Field>
      </Section>

      <Section
        title="Botão de envio"
        description="Texto que aparece no botão de submit."
      >
        <Field label="Label do botão">
          <input
            name="buttonLabel"
            type="text"
            defaultValue="Cadastrar-se"
            className="form-input"
          />
        </Field>
      </Section>

      <Section
        title="Comportamento ao enviar"
        description="O que acontece quando o usuário aperta o botão. Pode usar os dois ao mesmo tempo."
      >
        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <Webhook size={12} strokeWidth={2.4} className="text-emerald-300" />
              Webhook URL
            </span>
          }
          hint={
            <>
              Pra onde os dados são enviados. Suporta Clint, Zapier, Make, RD
              Station, etc.{" "}
              <span className="text-neutral-300">Ex Clint:</span>{" "}
              <span className="text-neutral-300 font-mono break-all text-[10px]">
                https://functions-api.clint.digital/endpoints/integration/webhook/[id]
              </span>
            </>
          }
        >
          <input
            name="webhookUrl"
            type="url"
            placeholder="https://..."
            className="form-input font-mono text-xs"
          />
        </Field>

        <Field
          label={
            <span className="inline-flex items-center gap-1.5">
              <Globe size={12} strokeWidth={2.4} className="text-violet-300" />
              Redirect URL
            </span>
          }
          hint={
            <>
              Pra onde o usuário é levado depois de enviar. Ex: link do
              WhatsApp{" "}
              <span className="text-neutral-300 font-mono text-[10px]">
                https://wa.me/5519998930861
              </span>
              . Se deixar vazio, mostra uma mensagem de sucesso.
            </>
          }
        >
          <input
            name="redirectUrl"
            type="url"
            placeholder="https://wa.me/55..."
            className="form-input font-mono text-xs"
          />
        </Field>
      </Section>

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

      <SubmitButton />
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
        {title}
      </p>
      {description && (
        <p className="text-xs text-neutral-400 mt-1.5 mb-5">{description}</p>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center justify-end gap-3">
      <button
        type="submit"
        disabled={pending}
        className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 size={14} className="animate-spin" strokeWidth={2.4} />
            Criando...
          </>
        ) : (
          "Criar formulário"
        )}
      </button>
    </div>
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
