"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, AlertCircle, CheckCircle2, Search, Share2 } from "lucide-react";
import { saveSeoAction } from "@/app/wp-pages/manage-actions";
import { MediaPicker } from "@/components/media-picker";

type Initial = {
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  seoCanonical?: string;
  seoNoIndex?: boolean;
};

export function SeoEditor({
  domain,
  slug,
  initialSlug,
  pageTitle,
  initial,
}: {
  domain: string;
  slug: string;
  initialSlug: string;
  pageTitle: string;
  initial: Initial;
}) {
  const [state, formAction] = useActionState(saveSeoAction, undefined);
  const [title, setTitle] = useState(initial.seoTitle ?? "");
  const [desc, setDesc] = useState(initial.seoDescription ?? "");
  const [image, setImage] = useState(initial.seoImage ?? "");
  const [publicSlug, setPublicSlug] = useState(initialSlug);
  const [canonical, setCanonical] = useState(initial.seoCanonical ?? "");
  const [indexar, setIndexar] = useState(!(initial.seoNoIndex ?? false));
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const shownTitle = title || pageTitle || "Título da página";
  const shownDesc =
    desc || "A descrição aparece aqui — escreva 1-2 frases atraentes.";
  const host = origin ? origin.replace(/^https?:\/\//, "") : "seu-site.com";
  const previewUrl = `${host}/${publicSlug || slug}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Campos */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="domain" value={domain} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="seoNoIndex" value={indexar ? "0" : "1"} />

        <Field
          label="Título SEO"
          hint={`${shownTitle.length}/60 — o que aparece como título azul no Google`}
          warn={shownTitle.length > 60}
        >
          <input
            name="seoTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={pageTitle}
            className={inputCls}
          />
        </Field>

        <Field
          label="Descrição (meta description)"
          hint={`${desc.length}/155 — o textinho cinza embaixo no Google`}
          warn={desc.length > 155}
        >
          <textarea
            name="seoDescription"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Resumo atraente da página..."
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field
          label="Imagem de compartilhamento"
          hint="A imagem que aparece quando o link é colado no WhatsApp/redes"
        >
          <div className="flex gap-1.5">
            <input
              name="seoImage"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://.../imagem.jpg"
              className={inputCls}
            />
            <MediaPicker onPick={setImage} compact />
          </div>
        </Field>

        <Field
          label="URL canônica (avançado)"
          hint="Opcional. Use se essa página é cópia de outra, pra dizer ao Google qual é a original."
        >
          <input
            name="seoCanonical"
            value={canonical}
            onChange={(e) => setCanonical(e.target.value)}
            placeholder="https://... (deixe vazio se não souber)"
            className={inputCls}
          />
        </Field>

        {/* Indexar */}
        <button
          type="button"
          onClick={() => setIndexar((v) => !v)}
          className="w-full flex items-center justify-between gap-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-white">
              Aparecer no Google
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {indexar
                ? "O Google pode encontrar e mostrar essa página"
                : "Escondida do Google (noindex)"}
            </p>
          </div>
          <span
            className={`w-10 h-6 rounded-full p-0.5 transition shrink-0 ${
              indexar ? "bg-emerald-500/80" : "bg-[#262626]"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                indexar ? "translate-x-4" : ""
              }`}
            />
          </span>
        </button>

        {state?.error && (
          <Note error>{state.error}</Note>
        )}
        {state?.ok && <Note>SEO salvo!</Note>}

        <SaveButton />
      </form>

      {/* Preview ao vivo */}
      <div className="space-y-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-2">
            <Search size={11} strokeWidth={2.4} />
            Como aparece no Google
          </p>
          <div className="bg-white rounded-lg p-4">
            <p className="text-[#202124] text-xs truncate">{previewUrl}</p>
            <p className="text-[#1a0dab] text-lg leading-tight truncate mt-0.5">
              {shownTitle}
            </p>
            <p className="text-[#4d5156] text-[13px] leading-snug mt-1 line-clamp-2">
              {shownDesc}
            </p>
          </div>
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-2">
            <Share2 size={11} strokeWidth={2.4} />
            Ao compartilhar (WhatsApp/redes)
          </p>
          <div className="bg-[#0a0a0a] border border-[#262626] rounded-lg overflow-hidden max-w-sm">
            <div className="aspect-[1.9/1] bg-[#161616] flex items-center justify-center overflow-hidden">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] text-neutral-600">
                  imagem de compartilhamento
                </span>
              )}
            </div>
            <div className="px-3 py-2.5">
              <p className="text-[10px] uppercase text-neutral-500 truncate">
                {host}
              </p>
              <p className="text-sm font-semibold text-white truncate mt-0.5">
                {shownTitle}
              </p>
              <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                {shownDesc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition";

function Field({
  label,
  hint,
  warn,
  children,
}: {
  label: string;
  hint?: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
        {label}
      </span>
      {children}
      {hint && (
        <span
          className={`block text-[11px] mt-1 ${
            warn ? "text-amber-400" : "text-neutral-600"
          }`}
        >
          {hint}
        </span>
      )}
    </label>
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
      {pending && <Loader2 size={13} className="animate-spin" strokeWidth={2.4} />}
      Salvar SEO
    </button>
  );
}

function Note({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md px-2.5 py-2 ${
        error
          ? "bg-rose-500/10 ring-1 ring-rose-500/25"
          : "bg-emerald-500/10 ring-1 ring-emerald-500/25"
      }`}
    >
      {error ? (
        <AlertCircle size={12} className="text-rose-300 mt-0.5 shrink-0" strokeWidth={2.4} />
      ) : (
        <CheckCircle2 size={12} className="text-emerald-300 mt-0.5 shrink-0" strokeWidth={2.4} />
      )}
      <p
        className={`text-[11px] font-medium ${
          error ? "text-rose-300" : "text-emerald-300"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
