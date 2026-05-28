"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Download,
  Copy,
  X,
  Loader2,
} from "lucide-react";
import { type LandingPage } from "@/lib/landing-pages";
import { duplicateLpAction } from "@/app/lps/actions";

export function QuickActions({ landingPages }: { landingPages: LandingPage[] }) {
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <ActionButton icon={Plus} label="Nova Landing Page" href="/lps/new" />
        <ActionButton icon={FileText} label="Novo formulário" href="/forms" />
        <ActionButton icon={Download} label="Importar página WP" href="/wordpress" />
        <ActionButton
          icon={Copy}
          label="Duplicar projeto"
          onClick={() => setDuplicateOpen(true)}
        />
      </div>

      {duplicateOpen && (
        <DuplicateModal
          landingPages={landingPages}
          onClose={() => setDuplicateOpen(false)}
        />
      )}
    </>
  );
}

function ActionButton({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    "flex items-center gap-2 px-3.5 py-2.5 bg-[#0f0f0f] border border-[#1f1f1f] hover:border-neutral-700 rounded-lg text-sm font-medium text-neutral-200 hover:text-white transition";
  const inner = (
    <>
      <Icon size={14} strokeWidth={2.2} className="text-neutral-400" />
      <span>{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function DuplicateModal({
  landingPages,
  onClose,
}: {
  landingPages: LandingPage[];
  onClose: () => void;
}) {
  const [duplicating, setDuplicating] = useState<string | null>(null);

  async function handleDuplicate(slug: string) {
    setDuplicating(slug);
    const formData = new FormData();
    formData.set("slug", slug);
    try {
      await duplicateLpAction(formData);
      // duplicateLpAction faz redirect, então normalmente não retorna
    } catch (e) {
      setDuplicating(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#1f1f1f]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              Duplicar projeto
            </p>
            <h3 className="text-base font-semibold text-white mt-0.5">
              Escolha o que duplicar
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="py-2 max-h-96 overflow-y-auto">
          {landingPages.map((lp) => {
            const isDup = duplicating === lp.slug;
            return (
              <button
                key={lp.slug}
                type="button"
                disabled={!!duplicating}
                onClick={() => handleDuplicate(lp.slug)}
                className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[#161616] disabled:opacity-50 transition text-left"
              >
                <span className="w-8 h-10 rounded-md bg-gradient-to-br from-pink-500 to-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {lp.name}
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate">
                    /{lp.slug}
                  </p>
                </div>
                {isDup ? (
                  <Loader2 size={14} className="animate-spin text-neutral-400" />
                ) : (
                  <Copy size={13} strokeWidth={2} className="text-neutral-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-[#1f1f1f]">
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Cria uma cópia com sufixo <code className="text-neutral-300 bg-[#161616] px-1 py-0.5 rounded text-[10px]">-copy-1</code> e status <span className="text-amber-300">Rascunho</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

