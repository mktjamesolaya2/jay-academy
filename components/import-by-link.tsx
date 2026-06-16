"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Link2, X, Loader2, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { importByLinksAction } from "@/app/wp-pages/import-actions";

export function ImportByLink() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(importByLinksAction, undefined);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
      >
        <Link2 size={14} strokeWidth={2.5} />
        Importar por link
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
                  Importar do WordPress
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
                    "https://lp.jayacademy.com.br/metodo-shadow-pro/\nhttps://lp.jayacademy.com.br/metodo-fio-a-fio/"
                  }
                  className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 font-mono resize-none"
                />
                <span className="block text-[11px] text-neutral-600 mt-1.5">
                  Páginas do jayacademy.com.br ou lp.jayacademy.com.br. Cada
                  link vira uma página no portal.
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="publish"
                  value="1"
                  defaultChecked
                  className="accent-white w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-neutral-200 font-medium">
                  Publicar automaticamente (já fica no ar com URL pública)
                </span>
              </label>

              <SubmitButton />
            </form>

            {state?.results && state.results.length > 0 && (
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
                        className={
                          r.ok ? "text-emerald-200" : "text-rose-200"
                        }
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-70 w-full justify-center"
    >
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" strokeWidth={2.4} />
          Importando...
        </>
      ) : (
        <>
          <Download size={14} strokeWidth={2.4} />
          Importar
        </>
      )}
    </button>
  );
}
