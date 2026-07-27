"use client";

import { useActionState, useState } from "react";
import {
  Link2,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  HelpCircle,
} from "lucide-react";
import { importByLinksAction } from "@/app/wp-pages/import-actions";
import { PendingButton } from "@/components/pending-button";

/**
 * Formulário "Copiar de uma URL": cola links (WP legado ou qualquer site da
 * web) e o servidor decide o caminho certo em `importByLinksAction`. Substitui
 * o antigo modal "Importar do WordPress" (removido no desligamento do WP).
 */
export function ImportByLink() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(importByLinksAction, {
    results: [],
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
      >
        <Link2 size={14} strokeWidth={2.5} />
        Copiar de uma URL
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 py-8 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl max-w-lg w-full shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#1f1f1f]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                  Copiar de uma URL
                </p>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Colar links
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-500 hover:text-white transition"
                aria-label="Fechar"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form action={formAction} className="p-5 space-y-4">
              <label className="block">
                <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
                  Links (um por linha)
                </span>
                <textarea
                  name="links"
                  rows={5}
                  placeholder={
                    "https://lp.jayacademy.com.br/metodo-shadow-pro/\nhttps://qualquersite.com/pagina"
                  }
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 font-mono resize-none"
                />
                <span className="block text-[11px] text-neutral-600 mt-1.5">
                  Aceita páginas do WordPress da Jay Academy ou qualquer outro
                  site. Cada link vira uma página no portal.
                </span>
              </label>

              <div className="space-y-1">
                <CheckOption
                  name="forceHeadless"
                  label="Forçar navegador robô"
                  tip="Use quando o site é pesado de JavaScript e a cópia simples vem vazia."
                />
                <CheckOption
                  name="keepScripts"
                  label="Manter os scripts do site"
                  tip="Deixa a cópia fiel a sites pesados (tipo Apple). Só marque em sites que você confia — o código deles roda no seu painel."
                  warn
                />
                <CheckOption
                  name="publish"
                  label="Publicar automaticamente"
                  tip="Deixe desmarcado pra copiar, adaptar e só então publicar."
                />
              </div>

              <PendingButton
                pendingLabel="Copiando..."
                iconWhenIdle={<Download size={14} strokeWidth={2.4} />}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold w-full justify-center"
              >
                Copiar
              </PendingButton>
            </form>

            {state.results.length > 0 && (
              <div className="px-5 pb-5 space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-2">
                  Resultado
                </p>
                {state.results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-[12px] bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-2.5 py-2"
                  >
                    {r.ok ? (
                      <CheckCircle2
                        size={13}
                        strokeWidth={2.4}
                        className="text-emerald-300 mt-0.5 shrink-0"
                      />
                    ) : (
                      <AlertCircle
                        size={13}
                        strokeWidth={2.4}
                        className="text-rose-300 mt-0.5 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p
                        className={r.ok ? "text-emerald-200" : "text-rose-200"}
                      >
                        {r.message}
                      </p>
                      <p className="text-neutral-600 font-mono truncate text-[10px]">
                        {r.url}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Opção do formulário: checkbox + título + ícone de ajuda com tooltip no hover. */
function CheckOption({
  name,
  label,
  tip,
  warn,
}: {
  name: string;
  label: string;
  tip: string;
  warn?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 p-2 rounded-md cursor-pointer select-none hover:bg-white/[0.03] transition-colors">
      <input
        type="checkbox"
        name={name}
        value="1"
        className="accent-white w-4 h-4 cursor-pointer shrink-0"
      />
      <span className="text-sm text-neutral-100 font-medium">{label}</span>
      <span
        className="relative inline-flex group/tip"
        onClick={(e) => e.preventDefault()}
      >
        <HelpCircle
          size={13}
          strokeWidth={2.2}
          className={
            warn
              ? "text-amber-400/70 hover:text-amber-300 transition-colors"
              : "text-neutral-500 hover:text-neutral-300 transition-colors"
          }
        />
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-md border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-[11px] leading-relaxed text-neutral-300 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-20 shadow-xl"
        >
          {tip}
        </span>
      </span>
    </label>
  );
}
