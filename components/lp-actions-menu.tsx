"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Loader2,
  Copy,
} from "lucide-react";
import {
  duplicateLpAction,
  editLpMetadataAction,
  moveToTrashAction,
} from "@/app/lps/actions";
import type { LandingPage } from "@/lib/landing-pages";

const ACCENT_OPTIONS = [
  { value: "pink-orange", label: "Pink → Orange" },
  { value: "purple-fuchsia", label: "Purple → Fuchsia" },
  { value: "amber-orange", label: "Amber → Orange" },
  { value: "gold-black", label: "Gold → Black" },
  { value: "rose", label: "Rose" },
];

const TYPE_OPTIONS = [
  { value: "lp", label: "Landing page" },
  { value: "website", label: "Website" },
];

export function LpActionsMenu({ lp }: { lp: LandingPage }) {
  const [editOpen, setEditOpen] = useState(false);

  async function handleDuplicate() {
    const formData = new FormData();
    formData.set("slug", lp.slug);
    await duplicateLpAction(formData);
  }

  async function handleTrash() {
    if (!confirm(`Mover "${lp.name}" pra lixeira?`)) return;
    const formData = new FormData();
    formData.set("slug", lp.slug);
    await moveToTrashAction(formData);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="btn-ghost inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold"
        >
          <Pencil size={13} strokeWidth={2.4} />
          Editar
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          className="btn-ghost inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold"
        >
          <Copy size={13} strokeWidth={2.4} />
          Duplicar
        </button>
        <button
          type="button"
          onClick={handleTrash}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition"
        >
          <Trash2 size={13} strokeWidth={2.4} />
          Mover pra lixeira
        </button>
      </div>

      {editOpen && (
        <EditMetaModal lp={lp} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
}

function EditMetaModal({
  lp,
  onClose,
}: {
  lp: LandingPage;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      await editLpMetadataAction(formData);
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
              {lp.name}
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
          <input type="hidden" name="slug" value={lp.slug} />

          <Field
            label="Nome"
            name="name"
            defaultValue={lp.name}
            required
          />
          <Field label="Tagline" name="tagline" defaultValue={lp.tagline} />
          <Textarea
            label="Descrição"
            name="description"
            defaultValue={lp.description}
            rows={3}
          />
          <Select
            label="Tipo"
            name="type"
            defaultValue={lp.type}
            options={TYPE_OPTIONS}
          />
          <Select
            label="Acento"
            name="accent"
            defaultValue={lp.accent}
            options={ACCENT_OPTIONS}
          />

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

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
        {label}
      </span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition resize-none"
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600 transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
