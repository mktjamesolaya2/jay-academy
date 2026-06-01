"use client";

import { useState, useTransition } from "react";
import {
  Globe,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { setLpStatusAction } from "@/app/lps/actions";

type Props = {
  slug: string;
  status: "draft" | "published" | "archived" | "deploying" | "error";
  hasBuilder: boolean;
};

export function LpPublishCard({ slug, status, hasBuilder }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${baseUrl}/p/${slug}`;
  const isPublished = status === "published";

  function handleStatusChange(next: "draft" | "published") {
    setError(null);
    if (next === "draft") {
      if (!confirm("Despublicar essa página? A URL pública vai parar de funcionar.")) {
        return;
      }
    }
    if (!hasBuilder && next === "published") {
      if (
        !confirm(
          "Essa página ainda não tem conteúdo construído. Quer publicar mesmo assim? Visitantes vão ver uma página em branco."
        )
      ) {
        return;
      }
    }
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("slug", slug);
        fd.set("status", next);
        await setLpStatusAction(fd);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao atualizar status");
      }
    });
  }

  async function copyUrl() {
    if (typeof navigator === "undefined") return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isPublished) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-md bg-emerald-500/15 ring-1 ring-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
              <Globe size={14} strokeWidth={2} className="text-emerald-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-200">
                No ar no portal
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Qualquer pessoa com o link pode ver
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleStatusChange("draft")}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 size={11} className="animate-spin" strokeWidth={2.4} />
            ) : (
              <Lock size={11} strokeWidth={2.4} />
            )}
            Despublicar
          </button>
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

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-md px-2.5 py-1.5 flex items-start gap-2">
            <AlertCircle size={11} strokeWidth={2.4} className="text-rose-300 mt-0.5 shrink-0" />
            <p className="text-[11px] text-rose-300 font-medium">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 space-y-3">
      <div className="flex items-start gap-2.5">
        <span className="w-8 h-8 rounded-md bg-[#161616] flex items-center justify-center shrink-0 mt-0.5">
          <Lock size={14} strokeWidth={2} className="text-neutral-400" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Em rascunho</p>
          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
            Só você (logado) vê essa página. Publique pra liberar URL pública no
            portal.
          </p>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-dashed border-[#262626] rounded-lg p-2.5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-600 font-semibold mb-1">
          URL pública será
        </p>
        <p className="text-xs text-neutral-400 font-mono truncate">
          {publicUrl}
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-md px-2.5 py-1.5 flex items-start gap-2">
          <AlertCircle size={11} strokeWidth={2.4} className="text-rose-300 mt-0.5 shrink-0" />
          <p className="text-[11px] text-rose-300 font-medium">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => handleStatusChange("published")}
        disabled={isPending}
        className="w-full btn-primary inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-70"
      >
        {isPending ? (
          <>
            <Loader2 size={13} className="animate-spin" strokeWidth={2.4} />
            Publicando...
          </>
        ) : (
          <>
            <Globe size={13} strokeWidth={2.4} />
            Publicar no portal
          </>
        )}
      </button>
    </div>
  );
}
