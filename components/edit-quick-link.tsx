"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

export function EditQuickLink({
  href,
  label = "Editar",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-neutral-300 bg-[#161616] hover:bg-[#222] hover:text-white transition shrink-0"
      title={label}
    >
      <Pencil size={11} strokeWidth={2.4} />
      {label}
    </Link>
  );
}
