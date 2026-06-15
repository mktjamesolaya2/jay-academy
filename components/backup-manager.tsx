"use client";

import { useState, useTransition } from "react";
import {
  DatabaseBackup,
  RotateCcw,
  Download,
  Trash2,
  Loader2,
  Archive,
} from "lucide-react";
import {
  createBackupAction,
  restoreBackupAction,
  deleteBackupAction,
  exportBackupAction,
} from "@/app/settings/backup/actions";
import { formatDateTimeBR } from "@/lib/format-date";
import type { BackupMeta } from "@/lib/backup-store";

export function BackupManager({ backups }: { backups: BackupMeta[] }) {
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function create() {
    const fd = new FormData();
    if (label.trim()) fd.set("label", label.trim());
    startTransition(async () => {
      await createBackupAction(fd);
      setLabel("");
    });
  }

  function restore(id: string) {
    if (
      !confirm(
        "Restaurar esse backup? Vai sobrescrever o conteúdo atual com o dessa versão. (O que foi adicionado depois continua.)"
      )
    )
      return;
    const fd = new FormData();
    fd.set("id", id);
    setBusyId(id);
    startTransition(async () => {
      await restoreBackupAction(fd);
      setBusyId(null);
    });
  }

  function remove(id: string) {
    if (!confirm("Excluir esse backup?")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => deleteBackupAction(fd));
  }

  async function download(id: string) {
    setBusyId(id);
    try {
      const json = await exportBackupAction(id);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-jayacademy-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Criar backup */}
      <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <DatabaseBackup size={16} strokeWidth={2} className="text-emerald-300" />
          <h3 className="font-semibold text-base text-white tracking-tight">
            Criar backup agora
          </h3>
        </div>
        <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
          Salva uma cópia de tudo (páginas, LPs, formulários, leads, mídia,
          configurações). Você pode restaurar depois se algo der errado.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nome (opcional) — ex: antes da campanha"
            className="flex-1 min-w-[220px] bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
          />
          <button
            onClick={create}
            disabled={isPending}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
          >
            {isPending && !busyId ? (
              <Loader2 size={14} className="animate-spin" strokeWidth={2.4} />
            ) : (
              <DatabaseBackup size={14} strokeWidth={2.4} />
            )}
            Criar backup
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-3">
          Histórico de versões ({backups.length})
        </p>
        {backups.length === 0 ? (
          <div className="border border-dashed border-[#262626] rounded-2xl py-12 text-center">
            <Archive
              size={24}
              strokeWidth={1.6}
              className="mx-auto text-neutral-600 mb-3"
            />
            <p className="text-neutral-400 text-sm">
              Nenhum backup ainda. Crie o primeiro acima.
            </p>
          </div>
        ) : (
          <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl divide-y divide-[#161616]">
            {backups.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 flex-wrap"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {b.label || "Backup"}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {formatDateTimeBR(b.createdAt)} · {b.keyCount} itens
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => restore(b.id)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20 transition disabled:opacity-60"
                  >
                    {busyId === b.id && isPending ? (
                      <Loader2 size={11} className="animate-spin" strokeWidth={2.4} />
                    ) : (
                      <RotateCcw size={11} strokeWidth={2.4} />
                    )}
                    Restaurar
                  </button>
                  <button
                    onClick={() => download(b.id)}
                    disabled={busyId === b.id}
                    title="Baixar (.json)"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-white bg-[#161616] ring-1 ring-[#262626] hover:bg-[#222] transition"
                  >
                    <Download size={12} strokeWidth={2.2} />
                  </button>
                  <button
                    onClick={() => remove(b.id)}
                    disabled={isPending}
                    title="Excluir backup"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition"
                  >
                    <Trash2 size={12} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
