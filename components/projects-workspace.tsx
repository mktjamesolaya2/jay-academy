"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Search,
  FolderPlus,
  Folder,
  FolderOpen,
  Check,
  Pencil,
  Trash2,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { SiteUrlLink } from "./site-url-link";
import type { ProjectGroup } from "@/lib/project-groups-store";
import {
  createGroupAction,
  renameGroupAction,
  deleteGroupAction,
  toggleProjectGroupAction,
} from "@/app/dashboard/group-actions";

export type ProjectLite = {
  key: string;
  name: string;
  typeLabel: string;
  status: "published" | "draft" | "error" | "archived";
  url: string | null;
  href: string;
  accent: string;
};

const ACCENTS: Record<string, string> = {
  "pink-orange": "from-pink-500 to-orange-500",
  "purple-fuchsia": "from-purple-500 to-fuchsia-500",
  "amber-orange": "from-amber-500 to-orange-500",
  "blue-indigo": "from-blue-500 to-indigo-500",
  rose: "from-pink-400 to-rose-400",
  "gold-black": "from-amber-400 to-yellow-600",
  emerald: "from-emerald-500 to-teal-500",
  "blue-violet": "from-blue-500/50 to-violet-500/50",
};
const grad = (a: string) => ACCENTS[a] || ACCENTS["blue-violet"];

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  published: { label: "Publicada", cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25", dot: "bg-emerald-400" },
  draft: { label: "Rascunho", cls: "bg-neutral-500/10 text-neutral-300 ring-neutral-500/25", dot: "bg-neutral-500" },
  error: { label: "Erro", cls: "bg-rose-500/10 text-rose-300 ring-rose-500/25", dot: "bg-rose-400" },
  archived: { label: "Arquivada", cls: "bg-neutral-500/10 text-neutral-400 ring-neutral-500/25", dot: "bg-neutral-600" },
};

export function ProjectsWorkspace({
  projects,
  groups,
  assignments,
  canEdit,
}: {
  projects: ProjectLite[];
  groups: ProjectGroup[];
  assignments: Record<string, string[]>;
  canEdit: boolean;
}) {
  const [assign, setAssign] = useState(assignments);
  const [open, setOpen] = useState(false); // seção retrátil — começa fechada
  const [selected, setSelected] = useState<string | null>(null); // null = Todas
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const countByGroup = useMemo(() => {
    const m: Record<string, number> = {};
    for (const gs of Object.values(assign)) for (const g of gs) m[g] = (m[g] || 0) + 1;
    return m;
  }, [assign]);

  const visible = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (selected && !(assign[p.key] || []).includes(selected)) return false;
      if (ql && !p.name.toLowerCase().includes(ql)) return false;
      return true;
    });
  }, [projects, assign, selected, q]);

  function toggle(key: string, groupId: string) {
    setAssign((prev) => {
      const cur = prev[key] || [];
      const next = cur.includes(groupId)
        ? cur.filter((g) => g !== groupId)
        : [...cur, groupId];
      const copy = { ...prev };
      if (next.length) copy[key] = next;
      else delete copy[key];
      return copy;
    });
    startTransition(() => {
      toggleProjectGroupAction(key, groupId);
    });
  }

  function create(name: string) {
    if (!name.trim()) return;
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      await createGroupAction(fd);
      setCreating(false);
    });
  }

  const selectedGroup = groups.find((g) => g.id === selected) || null;

  return (
    <section className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
      {/* Cabeçalho retrátil — começa fechado */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-4 flex items-center gap-2.5 hover:bg-[#101010] transition cursor-pointer"
      >
        <ChevronDown
          size={15}
          strokeWidth={2.2}
          className={`text-neutral-500 transition-transform ${open ? "" : "-rotate-90"}`}
        />
        <h2 className="text-sm font-semibold text-white">Todos os projetos</h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">
          {projects.length}
        </span>
      </button>

      {open && (
        <>
      {/* Pastas (cards) */}
      <div className="p-5 border-y border-[#1f1f1f]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Pastas</h2>
          {canEdit && (
            <button
              onClick={() => setCreating((v) => !v)}
              className="text-xs font-semibold text-neutral-400 hover:text-white inline-flex items-center gap-1.5 transition"
            >
              <FolderPlus size={14} strokeWidth={2.2} />
              Nova pasta
            </button>
          )}
        </div>

        {creating && canEdit && (
          <form
            action={(fd) => create(fd.get("name")?.toString() || "")}
            className="mb-3 flex items-center gap-2"
          >
            <input
              name="name"
              autoFocus
              placeholder="Nome da pasta (ex: Cursos PMU)"
              className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
            />
            <button className="btn-primary px-3 py-2 rounded-lg text-sm font-semibold">Criar</button>
          </form>
        )}

        <div className="flex items-stretch gap-2.5 flex-wrap">
          <FolderCard
            label="Todas"
            count={projects.length}
            active={selected === null}
            onClick={() => setSelected(null)}
            icon="all"
          />
          {groups.map((g) => (
            <FolderCard
              key={g.id}
              label={g.name}
              count={countByGroup[g.id] || 0}
              active={selected === g.id}
              onClick={() => setSelected(g.id)}
              accent={g.accent}
            />
          ))}
        </div>
      </div>

      {/* Busca + título da lista */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-white">
            {selectedGroup ? selectedGroup.name : "Todos os projetos"}
          </h3>
          <span className="text-[11px] text-neutral-600 font-semibold">{visible.length}</span>
          {selectedGroup && canEdit && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => {
                  const name = window.prompt("Renomear pasta:", selectedGroup.name);
                  if (name?.trim()) {
                    const fd = new FormData();
                    fd.set("id", selectedGroup.id);
                    fd.set("name", name);
                    startTransition(() => renameGroupAction(fd));
                  }
                }}
                title="Renomear pasta"
                className="w-6 h-6 rounded text-neutral-500 hover:text-white hover:bg-[#161616] flex items-center justify-center"
              >
                <Pencil size={12} strokeWidth={2} />
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Excluir a pasta "${selectedGroup.name}"? Os projetos continuam em Todos.`)) {
                    const fd = new FormData();
                    fd.set("id", selectedGroup.id);
                    startTransition(async () => {
                      await deleteGroupAction(fd);
                      setSelected(null);
                    });
                  }
                }}
                title="Excluir pasta"
                className="w-6 h-6 rounded text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10 flex items-center justify-center"
              >
                <Trash2 size={12} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar projeto…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0f0f0f] border border-[#1f1f1f] text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
          />
        </div>
      </div>

      {/* Lista */}
      {visible.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-neutral-500">
          {q.trim()
            ? `Nenhum projeto encontrado pra “${q}”.`
            : selectedGroup
            ? "Nenhum projeto nessa pasta ainda. Use o botão de pasta na lista “Todas”."
            : "Sem projetos."}
        </p>
      ) : (
        <div>
          {visible.map((p, idx) => {
            const st = STATUS[p.status] || STATUS.draft;
            const inGroups = assign[p.key] || [];
            const openUp = idx >= visible.length - 3 && visible.length > 4;
            return (
              <div
                key={p.key}
                className="relative grid grid-cols-[1fr_auto] lg:grid-cols-[1.6fr_110px_120px_auto] gap-3 items-center px-5 py-3 border-t border-[#161616] hover:bg-[#101010] transition group"
              >
                <Link href={p.href} aria-label={p.name} className="absolute inset-0 z-[1]" />
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-9 h-11 rounded-md bg-gradient-to-br ${grad(p.accent)} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition">
                      {p.name}
                    </p>
                    {p.url ? (
                      <span className="relative z-[2] inline-block w-fit">
                        <SiteUrlLink url={p.url} />
                      </span>
                    ) : (
                      <p className="text-[11px] text-neutral-500 truncate">rascunho</p>
                    )}
                  </div>
                </div>
                <span className="hidden lg:inline-block text-[10px] font-semibold uppercase tracking-[0.12em] bg-[#161616] text-neutral-300 px-2 py-1 rounded w-fit">
                  {p.typeLabel}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 w-fit justify-self-end lg:justify-self-auto ${st.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
                {/* Botão de pasta */}
                {canEdit && (
                  <div className="relative z-[2] hidden lg:block justify-self-end">
                    <button
                      onClick={() => setMenuKey(menuKey === p.key ? null : p.key)}
                      title="Adicionar a uma pasta"
                      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md transition ${
                        inGroups.length
                          ? "bg-[#161616] text-neutral-200"
                          : "text-neutral-500 hover:text-white hover:bg-[#161616]"
                      }`}
                    >
                      {inGroups.length ? <FolderOpen size={13} strokeWidth={2} /> : <Folder size={13} strokeWidth={2} />}
                      {inGroups.length || "Pasta"}
                    </button>
                    {menuKey === p.key && (
                      <>
                        <div className="fixed inset-0 z-[5]" onClick={() => setMenuKey(null)} />
                        <div className={`absolute right-0 ${openUp ? "bottom-9" : "top-9"} z-[6] w-52 max-h-64 overflow-y-auto bg-[#141414] border border-[#262626] rounded-lg shadow-xl p-1.5`}>
                          <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500 font-semibold px-2 py-1.5">
                            Adicionar a pasta
                          </p>
                          {groups.length === 0 && (
                            <p className="text-[11px] text-neutral-500 px-2 py-2">
                              Crie uma pasta primeiro (botão “Nova pasta” acima).
                            </p>
                          )}
                          {groups.map((g) => {
                            const on = inGroups.includes(g.id);
                            return (
                              <button
                                key={g.id}
                                onClick={() => toggle(p.key, g.id)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-neutral-200 hover:bg-[#1d1d1d] transition text-left"
                              >
                                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? "bg-blue-500 border-blue-500" : "border-neutral-600"}`}>
                                  {on && <Check size={11} strokeWidth={3} className="text-white" />}
                                </span>
                                <span className="truncate">{g.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </section>
  );
}

function FolderCard({
  label,
  count,
  active,
  onClick,
  accent,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  accent?: string;
  icon?: "all";
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-36 text-left rounded-xl overflow-hidden border transition ${
        active ? "border-white/40 ring-1 ring-white/20" : "border-[#1f1f1f] hover:border-neutral-600"
      }`}
    >
      <div className={`h-14 bg-gradient-to-br ${icon === "all" ? "from-neutral-700 to-neutral-800" : grad(accent || "blue-indigo")} flex items-center justify-center`}>
        {icon === "all" ? (
          <LayoutGrid size={18} strokeWidth={1.8} className="text-white/80" />
        ) : (
          <Folder size={18} strokeWidth={1.8} className="text-white/85" />
        )}
      </div>
      <div className="px-2.5 py-2 bg-[#0f0f0f]">
        <p className="text-xs font-semibold text-white truncate" title={label}>{label}</p>
        <p className="text-[10px] text-neutral-500 mt-0.5">{count} {count === 1 ? "projeto" : "projetos"}</p>
      </div>
    </button>
  );
}
