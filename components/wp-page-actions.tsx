"use client";

import { useState } from "react";
import { Pencil, Trash2, X, Loader2, Copy, Lock } from "lucide-react";
import {
  renameWpPageAction,
  duplicateWpPageAction,
  quickUnpublishAction,
} from "@/app/wp-pages/manage-actions";
import { deleteWpPageAction } from "@/app/wp-pages/actions";

export function WpPageActions({
  domain,
  slug,
  name,
  published,
}: {
  domain: string;
  slug: string;
  name: string;
  published?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {published && (
          <form action={quickUnpublishAction}>
            <input type="hidden" name="domain" value={domain} />
            <input type="hidden" name="slug" value={slug} />
            <button
              type="submit"
              onClick={(e) => {
                if (
                  !confirm(
                    "Despublicar essa página? A URL pública vai parar de funcionar."
                  )
                )
                  e.preventDefault();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/25 hover:bg-amber-500/20 transition"
            >
              <Lock size={13} strokeWidth={2.4} />
              Despublicar
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="btn-ghost inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold"
        >
          <Pencil size={13} strokeWidth={2.4} />
          Editar
        </button>

        <form action={duplicateWpPageAction}>
          <input type="hidden" name="domain" value={domain} />
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            className="btn-ghost inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold"
          >
            <Copy size={13} strokeWidth={2.4} />
            Duplicar
          </button>
        </form>

        <form action={deleteWpPageAction}>
          <input type="hidden" name="domain" value={domain} />
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            onClick={(e) => {
              if (!confirm(`Mover "${name}" pra lixeira?`)) e.preventDefault();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition"
          >
            <Trash2 size={13} strokeWidth={2.4} />
            Mover pra lixeira
          </button>
        </form>
      </div>

      {editOpen && (
        <RenameModal
          domain={domain}
          slug={slug}
          name={name}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

function RenameModal({
  domain,
  slug,
  name,
  onClose,
}: {
  domain: string;
  slug: string;
  name: string;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      await renameWpPageAction(formData);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#1f1f1f]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              Editar página
            </p>
            <h3 className="text-base font-semibold text-white mt-0.5">
              Renomear
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <form action={handleSubmit} className="p-5 space-y-4">
          <input type="hidden" name="domain" value={domain} />
          <input type="hidden" name="slug" value={slug} />

          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
              Nome da página
            </span>
            <input
              type="text"
              name="name"
              defaultValue={name}
              required
              autoFocus
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
            />
            <span className="block text-[11px] text-neutral-600 mt-1.5">
              Só muda o nome de exibição. A URL pública continua a mesma.
            </span>
          </label>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1f1f1f]">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-neutral-500 hover:text-white transition px-3 py-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {saving && (
                <Loader2 size={13} className="animate-spin" strokeWidth={2.4} />
              )}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
