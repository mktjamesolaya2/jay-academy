"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export function CopyableUrl({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${baseUrl}${path}`;

  async function handleCopy() {
    if (typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignora
    }
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-2.5 flex items-center gap-2">
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-xs text-neutral-200 font-mono truncate hover:text-white transition"
      >
        {fullUrl}
      </a>
      <button
        type="button"
        onClick={handleCopy}
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
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
        title="Abrir"
      >
        <ExternalLink size={12} strokeWidth={2} />
      </a>
    </div>
  );
}
