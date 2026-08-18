"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Botão de submit dentro de <form> que pede confirmação antes de enviar.
 * Usado pra ações destrutivas (excluir permanentemente, etc).
 */
export function ConfirmButton({
  message,
  className,
  title,
  children,
}: {
  message: string;
  className?: string;
  /** Nome do botão quando ele é só um ícone — sem isso, leitor de tela lê "botão". */
  title?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      aria-label={title}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {pending ? (
        <Loader2 size={11} className="animate-spin" strokeWidth={2.4} />
      ) : (
        children
      )}
    </button>
  );
}
