"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

/**
 * Botão de submit pra dentro de <form action={serverAction}>.
 * Mostra spinner enquanto pendente e, se `confirmMessage` for passado,
 * pede confirmação antes de enviar.
 */
export function ConfirmSubmit({
  children,
  pendingLabel,
  confirmMessage,
  className,
  icon,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  confirmMessage?: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className={clsx(
        "inline-flex items-center justify-center gap-2 transition disabled:opacity-70 disabled:cursor-wait",
        className
      )}
    >
      {pending ? (
        <>
          <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
