"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Download, Loader2, X, RotateCcw, FileDown } from "lucide-react";
import {
  copyMarkedPagesAction,
  copyOnlyNewPagesAction,
} from "@/app/wordpress/actions";

export function CopyNowButton({
  totalMarked,
  alreadyCopied,
}: {
  totalMarked: number;
  alreadyCopied: number;
}) {
  const [open, setOpen] = useState(false);
  const hasOverlap = alreadyCopied > 0;
  const newCount = totalMarked - alreadyCopied;

  if (!hasOverlap) {
    return (
      <form action={copyMarkedPagesAction}>
        <SubmitInline label="Copiar agora" pendingLabel={`Copiando ${totalMarked}...`} />
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shrink-0 transition"
      >
        <Download size={14} strokeWidth={2.5} />
        Copiar agora
      </button>

      {open && (
        <ConfirmModal
          totalMarked={totalMarked}
          alreadyCopied={alreadyCopied}
          newCount={newCount}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ConfirmModal({
  totalMarked,
  alreadyCopied,
  newCount,
  onClose,
}: {
  totalMarked: number;
  alreadyCopied: number;
  newCount: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-[#1f1f1f]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300/80 font-semibold">
              Atenção
            </p>
            <h3 className="text-xl font-semibold text-white tracking-[-0.02em] mt-1">
              Algumas já foram copiadas
            </h3>
            <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
              Você tem{" "}
              <span className="text-white font-semibold">{totalMarked}</span>{" "}
              marcadas pra copiar.{" "}
              <span className="text-sky-300 font-semibold">
                {alreadyCopied}
              </span>{" "}
              {alreadyCopied === 1 ? "já está" : "já estão"} no portal.{" "}
              {newCount > 0 && (
                <>
                  <span className="text-emerald-300 font-semibold">
                    {newCount}
                  </span>{" "}
                  {newCount === 1 ? "é nova" : "são novas"}.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition"
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {newCount > 0 && (
            <form action={copyOnlyNewPagesAction} onSubmit={() => onClose()}>
              <SubmitChoice
                icon={<FileDown size={15} strokeWidth={2.4} />}
                label={`Copiar só as novas (${newCount})`}
                description="Pula as que já estão no portal. Mais rápido."
                pendingLabel={`Copiando ${newCount}...`}
                tone="primary"
              />
            </form>
          )}
          <form action={copyMarkedPagesAction} onSubmit={() => onClose()}>
            <SubmitChoice
              icon={<RotateCcw size={15} strokeWidth={2.4} />}
              label={`Recopiar todas (${totalMarked})`}
              description="Sobrescreve as que já estão. Útil se elas saíram bugadas antes."
              pendingLabel={`Recopiando ${totalMarked}...`}
              tone="ghost"
            />
          </form>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm font-semibold text-neutral-500 hover:text-white transition py-2.5"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmitInline({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shrink-0 transition disabled:opacity-70 disabled:cursor-wait"
    >
      {pending ? (
        <>
          <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          <Download size={14} strokeWidth={2.5} />
          {label}
        </>
      )}
    </button>
  );
}

function SubmitChoice({
  icon,
  label,
  description,
  pendingLabel,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  pendingLabel: string;
  tone: "primary" | "ghost";
}) {
  const { pending } = useFormStatus();
  const baseStyle =
    tone === "primary"
      ? "bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-100"
      : "bg-[#161616] border border-[#1f1f1f] hover:border-neutral-700 text-neutral-200";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`w-full text-left rounded-xl px-4 py-3 transition disabled:opacity-70 disabled:cursor-wait ${baseStyle}`}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0">
          {pending ? (
            <Loader2 size={15} strokeWidth={2.4} className="animate-spin" />
          ) : (
            icon
          )}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-sm">
            {pending ? pendingLabel : label}
          </p>
          {!pending && (
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
