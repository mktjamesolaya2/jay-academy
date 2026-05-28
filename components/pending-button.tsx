"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

export function PendingButton({
  children,
  pendingLabel,
  className,
  iconWhenIdle,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  iconWhenIdle?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={clsx(
        "inline-flex items-center gap-2 transition disabled:opacity-70 disabled:cursor-wait",
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
          {iconWhenIdle}
          {children}
        </>
      )}
    </button>
  );
}
