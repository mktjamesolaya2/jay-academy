import Link from "next/link";
import { FolderOpen, Plug } from "lucide-react";

export function DetectedFolderCard({ folder }: { folder: string }) {
  const encoded = encodeURIComponent(folder);
  return (
    <article className="bg-[#0f0f0f] border border-dashed border-[#2a2a2a] rounded-2xl p-5 hover:border-neutral-600 transition">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-[#161616] border border-[#1f1f1f] flex items-center justify-center">
          <FolderOpen size={14} strokeWidth={2} className="text-neutral-400" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-amber-300/80 font-semibold bg-amber-500/10 ring-1 ring-amber-500/20 rounded-full px-2 py-0.5">
          Detectada
        </span>
      </div>

      <p className="font-mono text-base text-white truncate">{folder}/</p>
      <p className="text-xs text-neutral-500 mt-1 font-medium">
        Pasta não registrada no portal
      </p>

      <Link
        href={`/lps/connect/${encoded}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-neutral-300 transition"
      >
        <Plug size={13} strokeWidth={2.5} />
        Conectar ao portal
      </Link>
    </article>
  );
}
