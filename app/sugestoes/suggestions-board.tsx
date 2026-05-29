"use client";

import { useState } from "react";
import {
  ChevronUp,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  toggleUpvoteAction,
  setStatusAction,
  deleteSuggestionAction,
} from "./actions";
import type {
  Suggestion,
  SuggestionStatus,
} from "@/lib/suggestions-store";

const STATUS_META: Record<
  SuggestionStatus,
  { label: string; bg: string; text: string; icon: typeof Circle }
> = {
  open: {
    label: "Aberta",
    bg: "bg-neutral-500/10 ring-neutral-500/25",
    text: "text-neutral-300",
    icon: Circle,
  },
  planned: {
    label: "Planejada",
    bg: "bg-sky-500/10 ring-sky-500/25",
    text: "text-sky-300",
    icon: Clock,
  },
  "in-progress": {
    label: "Em progresso",
    bg: "bg-amber-500/10 ring-amber-500/25",
    text: "text-amber-300",
    icon: Sparkles,
  },
  done: {
    label: "Feita",
    bg: "bg-emerald-500/10 ring-emerald-500/25",
    text: "text-emerald-300",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Recusada",
    bg: "bg-rose-500/10 ring-rose-500/25",
    text: "text-rose-300",
    icon: XCircle,
  },
};

export function SuggestionsBoard({
  suggestions,
  currentUserId,
  isAdmin,
}: {
  suggestions: Suggestion[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  if (suggestions.length === 0) {
    return (
      <div className="bg-[#0d0d0d] border border-dashed border-[#262626] rounded-2xl px-6 py-12 text-center">
        <p className="text-sm text-neutral-500 font-medium">
          Nenhuma sugestão ainda. Manda a primeira ali do lado →
        </p>
      </div>
    );
  }

  return (
    <>
      {suggestions.map((s) => (
        <SuggestionCard
          key={s.id}
          suggestion={s}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ))}
    </>
  );
}

function SuggestionCard({
  suggestion,
  currentUserId,
  isAdmin,
}: {
  suggestion: Suggestion;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const meta = STATUS_META[suggestion.status];
  const StatusIcon = meta.icon;
  const voted = suggestion.upvotes.includes(currentUserId);
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      <div className="flex items-start gap-4 p-5">
        <form action={toggleUpvoteAction}>
          <input type="hidden" name="id" value={suggestion.id} />
          <button
            type="submit"
            className={`flex flex-col items-center justify-center w-12 h-14 rounded-lg ring-1 transition shrink-0 ${
              voted
                ? "bg-emerald-500/15 ring-emerald-500/40 text-emerald-300"
                : "bg-[#161616] ring-[#262626] hover:ring-neutral-600 text-neutral-300"
            }`}
            title={voted ? "Tirar voto" : "Apoiar"}
          >
            <ChevronUp size={16} strokeWidth={2.6} />
            <span className="text-xs font-bold mt-0.5">
              {suggestion.upvotes.length}
            </span>
          </button>
        </form>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <h3 className="font-semibold text-base text-white tracking-tight leading-snug">
              {suggestion.title}
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 shrink-0 ${meta.bg} ${meta.text}`}
            >
              <StatusIcon size={10} strokeWidth={2.4} />
              {meta.label}
            </span>
          </div>

          <p className="text-[11px] text-neutral-500 font-medium mb-3">
            por {suggestion.createdBy} ·{" "}
            {new Date(suggestion.createdAt).toLocaleDateString("pt-BR")}
          </p>

          {suggestion.description && (
            <p
              className={`text-sm text-neutral-300 leading-relaxed ${
                expanded ? "" : "line-clamp-3"
              }`}
            >
              {suggestion.description}
            </p>
          )}

          {suggestion.description && suggestion.description.length > 180 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] font-medium text-blue-400 hover:text-blue-300 mt-1.5 transition"
            >
              {expanded ? "Ver menos" : "Ver mais"}
            </button>
          )}

          {suggestion.adminNote && (
            <div className="mt-3 bg-[#161616] border border-[#262626] rounded-md px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1">
                Resposta da admin
              </p>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {suggestion.adminNote}
              </p>
            </div>
          )}

          {isAdmin && (
            <AdminControls
              id={suggestion.id}
              currentStatus={suggestion.status}
              currentNote={suggestion.adminNote}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function AdminControls({
  id,
  currentStatus,
  currentNote,
}: {
  id: string;
  currentStatus: SuggestionStatus;
  currentNote?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[11px] font-semibold text-neutral-400 hover:text-white transition"
        >
          ⚙ Admin · mudar status
        </button>
        <form action={deleteSuggestionAction}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 hover:text-rose-200 transition"
            title="Excluir sugestão"
          >
            <Trash2 size={11} strokeWidth={2.4} />
            Excluir
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={setStatusAction}
      className="mt-3 pt-3 border-t border-[#1a1a1a] space-y-2"
    >
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="status"
          defaultValue={currentStatus}
          className="form-input"
        >
          <option value="open">Aberta</option>
          <option value="planned">Planejada</option>
          <option value="in-progress">Em progresso</option>
          <option value="done">Feita</option>
          <option value="rejected">Recusada</option>
        </select>
        <button
          type="submit"
          className="btn-primary px-3 py-2 rounded-md text-xs font-semibold"
        >
          Salvar
        </button>
      </div>
      <input
        name="adminNote"
        type="text"
        defaultValue={currentNote}
        placeholder="Resposta opcional (aparece pro usuário)"
        className="form-input"
      />
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-[11px] text-neutral-500 hover:text-white transition"
      >
        Cancelar
      </button>
    </form>
  );
}
