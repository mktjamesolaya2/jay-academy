"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Globe,
  Lock,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  publishPageAction,
  unpublishPageAction,
} from "@/app/wp-pages/publish-actions";
import type { WpPageContent } from "@/lib/wp-content-storage";

export function PublishButton({
  content,
}: {
  content: Pick<
    WpPageContent,
    "domain" | "slug" | "published" | "publicSlug" | "publishedAt"
  >;
}) {
  const [state, formAction] = useActionState(publishPageAction, undefined);
  const [editingSlug, setEditingSlug] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicSlug = content.publicSlug || content.slug;
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${baseUrl}/p/${publicSlug}`;

  async function copyUrl() {
    if (typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (content.published) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-md bg-emerald-500/15 ring-1 ring-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
              <Globe size={14} strokeWidth={2} className="text-emerald-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-200">
                Publicada
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Qualquer pessoa com o link pode ver
              </p>
            </div>
          </div>
          <form action={unpublishPageAction}>
            <input type="hidden" name="domain" value={content.domain} />
            <input type="hidden" name="slug" value={content.slug} />
            <UnpublishButton />
          </form>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-2.5 flex items-center gap-2">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-xs text-neutral-200 font-mono truncate hover:text-white transition"
          >
            {publicUrl}
          </a>
          <button
            type="button"
            onClick={copyUrl}
            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
            title="Copiar URL"
          >
            {copied ? (
              <Check size={12} strokeWidth={2.4} className="text-emerald-300" />
            ) : (
              <Copy size={12} strokeWidth={2} />
            )}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
            title="Abrir"
          >
            <ExternalLink size={12} strokeWidth={2} />
          </a>
        </div>

        {content.publishedAt && (
          <p className="text-[10px] text-neutral-500">
            Publicada em{" "}
            {new Date(content.publishedAt).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="w-8 h-8 rounded-md bg-[#161616] flex items-center justify-center shrink-0 mt-0.5">
          <Lock size={14} strokeWidth={2} className="text-neutral-400" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Não publicada</p>
          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
            Só você (logado) vê essa página. Publique pra liberar URL pública.
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="domain" value={content.domain} />
        <input type="hidden" name="slug" value={content.slug} />

        {editingSlug ? (
          <div>
            <label className="block text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1">
              Slug público
            </label>
            <input
              type="text"
              name="publicSlug"
              defaultValue={content.slug}
              placeholder={content.slug}
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
            />
            <p className="text-[10px] text-neutral-600 mt-1">
              URL final: {baseUrl}/p/<span className="text-neutral-400">[slug]</span>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingSlug(true)}
            className="text-[11px] font-medium text-neutral-500 hover:text-white transition"
          >
            URL será: {baseUrl}/p/{publicSlug}{" "}
            <span className="text-neutral-600">— customizar?</span>
          </button>
        )}

        {state?.error && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-md px-2.5 py-1.5 flex items-start gap-2">
            <AlertCircle
              size={11}
              strokeWidth={2.4}
              className="text-rose-300 mt-0.5 shrink-0"
            />
            <p className="text-[11px] text-rose-300 font-medium">{state.error}</p>
          </div>
        )}

        <PublishSubmitButton />
      </form>
    </div>
  );
}

function PublishSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full btn-primary inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 size={13} className="animate-spin" strokeWidth={2.4} />
          Publicando...
        </>
      ) : (
        <>
          <Globe size={13} strokeWidth={2.4} />
          Publicar página
        </>
      )}
    </button>
  );
}

function UnpublishButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm("Despublicar essa página? A URL pública vai parar de funcionar.")) {
          e.preventDefault();
        }
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition disabled:opacity-50"
    >
      {pending ? (
        <Loader2 size={11} className="animate-spin" strokeWidth={2.4} />
      ) : (
        <Lock size={11} strokeWidth={2.4} />
      )}
      Despublicar
    </button>
  );
}
