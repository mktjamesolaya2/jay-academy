"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { savePmuClassContentAction } from "./actions";
import type { PmuClassContent } from "@/lib/lp-content-store";

export function EditPmuContentView({
  initialContent,
}: {
  initialContent: PmuClassContent;
}) {
  const [state, action] = useActionState(savePmuClassContentAction, undefined);

  return (
    <form action={action} className="space-y-6">
      <Section
        title="Geral"
        description="WhatsApp principal usado no botão flutuante e nas LPs."
      >
        <Field label="Link do WhatsApp">
          <input
            name="whatsappLink"
            type="url"
            required
            defaultValue={initialContent.whatsappLink}
            placeholder="https://wa.me/5519998930861?text=Quero%20saber%20mais"
            className="form-input font-mono text-xs"
          />
        </Field>
      </Section>

      <Section
        title="Carrossel da home"
        description="3 slides que aparecem rotacionando no topo da página principal."
      >
        {initialContent.heroSlides.map((slide, idx) => (
          <SlideBlock key={idx} idx={idx} slide={slide} />
        ))}
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

function SlideBlock({
  idx,
  slide,
}: {
  idx: number;
  slide: PmuClassContent["heroSlides"][0];
}) {
  return (
    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-7 h-7 rounded-md bg-pink-500/15 ring-1 ring-pink-500/30 flex items-center justify-center">
          <Sparkles size={12} strokeWidth={2.4} className="text-pink-300" />
        </span>
        <p className="text-sm font-semibold text-white">Slide {idx + 1}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Badge (etiqueta)">
          <input
            name={`slide_${idx}_badge`}
            type="text"
            defaultValue={slide.badge}
            placeholder="EM DESTAQUE"
            className="form-input"
          />
        </Field>
        <Field label="Slug (URL do curso)">
          <input
            name={`slide_${idx}_slug`}
            type="text"
            defaultValue={slide.slug}
            placeholder="fio-a-fio-realista"
            className="form-input font-mono text-xs"
          />
        </Field>
      </div>

      <Field label="Título">
        <input
          name={`slide_${idx}_title`}
          type="text"
          defaultValue={slide.title}
          className="form-input"
        />
      </Field>

      <Field label="Descrição">
        <textarea
          name={`slide_${idx}_description`}
          rows={3}
          defaultValue={slide.description}
          className="form-input resize-none"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Meta esquerda">
          <input
            name={`slide_${idx}_metaLeft`}
            type="text"
            defaultValue={slide.metaLeft}
            placeholder="13 módulos"
            className="form-input"
          />
        </Field>
        <Field label="Meta direita">
          <input
            name={`slide_${idx}_metaRight`}
            type="text"
            defaultValue={slide.metaRight}
            placeholder="Prática em modelo"
            className="form-input"
          />
        </Field>
      </div>

      <Field
        label="Link do Hotmart"
        hint="O botão 'Quero me inscrever' abre este link em nova aba."
      >
        <input
          name={`slide_${idx}_hotmartUrl`}
          type="url"
          defaultValue={slide.hotmartUrl}
          placeholder="https://pay.hotmart.com/..."
          className="form-input font-mono text-xs"
        />
      </Field>
    </div>
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
    <div className="flex items-center justify-end gap-3 sticky bottom-4 z-10">
      <button
        type="submit"
        disabled={pending}
        className="btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold disabled:opacity-70 shadow-2xl shadow-black/40"
      >
        {pending ? (
          <>
            <Loader2 size={14} className="animate-spin" strokeWidth={2.4} />
            Salvando...
          </>
        ) : (
          "Salvar conteúdo"
        )}
      </button>
    </div>
  );
}
