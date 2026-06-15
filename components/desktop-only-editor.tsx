"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Monitor, ArrowLeft, Loader2 } from "lucide-react";

/**
 * Bloqueia a edição manual no mobile (tela < 1024px). O editor só MONTA
 * no desktop — no mobile mostra um aviso, evitando erros de UI/JS de editor
 * que não foi feito pra toque/tela pequena.
 */
export function DesktopOnlyEditor({
  children,
  backHref = "/dashboard",
}: {
  children: React.ReactNode;
  backHref?: string;
}) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (isDesktop === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-neutral-600" size={22} />
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#161616] ring-1 ring-[#262626] flex items-center justify-center mx-auto mb-5">
            <Monitor size={24} strokeWidth={1.8} className="text-neutral-300" />
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Edição só no computador
          </h1>
          <p className="text-neutral-400 text-sm mt-2.5 leading-relaxed">
            O editor precisa de tela grande, mouse e teclado pra funcionar
            direito. Pra evitar erros, a edição manual fica disponível só no
            desktop.
          </p>
          <p className="text-neutral-500 text-xs mt-3">
            Abra essa página no computador pra editar.
          </p>
          <Link
            href={backHref}
            className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold mt-6"
          >
            <ArrowLeft size={14} strokeWidth={2.4} />
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
