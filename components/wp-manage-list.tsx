"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Globe,
  Lock,
  Pencil,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  FolderInput,
} from "lucide-react";
import {
  bulkPublishAction,
  bulkUnpublishAction,
  bulkTrashAction,
  bulkCategorizeAction,
} from "@/app/wp-pages/manage-actions";
import type { SavedSummary } from "@/lib/wp-content-storage";

type StatusFilter = "all" | "published" | "draft";
type CatFilter = "all" | "website" | "lp" | "form" | "none";
type DomFilter = "all" | "main" | "lp";

const keyOf = (s: { domain: string; slug: string }) => `${s.domain}::${s.slug}`;
const domainLabel = (d: string) =>
  d === "main" ? "jayacademy.com.br" : "lp.jayacademy.com.br";
const catLabel = (c?: string) =>
  c === "website"
    ? "Website"
    : c === "lp"
    ? "Landing page"
    : c === "form"
    ? "Formulário"
    : "Sem categoria";

export function WpManageList({
  pages,
  canEdit,
}: {
  pages: SavedSummary[];
  canEdit: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [cat, setCat] = useState<CatFilter>("all");
  const [dom, setDom] = useState<DomFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q))
        return false;
      if (status === "published" && !p.published) return false;
      if (status === "draft" && p.published) return false;
      if (cat === "none" && p.placed) return false;
      if (cat !== "all" && cat !== "none" && p.placed !== cat) return false;
      if (dom !== "all" && p.domain !== dom) return false;
      return true;
    });
  }, [pages, query, status, cat, dom]);

  const filteredKeys = filtered.map(keyOf);
  const allSelected =
    filtered.length > 0 && filteredKeys.every((k) => selected.has(k));
  const selectedItems = pages
    .filter((p) => selected.has(keyOf(p)))
    .map((p) => ({ domain: p.domain, slug: p.slug }));

  function toggle(k: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filteredKeys.forEach((k) => next.delete(k));
      else filteredKeys.forEach((k) => next.add(k));
      return next;
    });
  }
  function clearSel() {
    setSelected(new Set());
  }

  function runBulk(fn: () => Promise<void>) {
    startTransition(async () => {
      await fn();
      setSelected(new Set());
    });
  }

  const hasFilters = query || status !== "all" || cat !== "all" || dom !== "all";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={14}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou slug..."
            className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
          />
        </div>
        <FilterSelect
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            ["all", "Todos os status"],
            ["published", "Publicadas"],
            ["draft", "Não publicadas"],
          ]}
        />
        <FilterSelect
          value={cat}
          onChange={(v) => setCat(v as CatFilter)}
          options={[
            ["all", "Todas categorias"],
            ["website", "Website"],
            ["lp", "Landing page"],
            ["form", "Formulário"],
            ["none", "Sem categoria"],
          ]}
        />
        <FilterSelect
          value={dom}
          onChange={(v) => setDom(v as DomFilter)}
          options={[
            ["all", "Todos domínios"],
            ["main", "jayacademy.com.br"],
            ["lp", "lp.jayacademy.com.br"],
          ]}
        />
      </div>

      {/* Contagem / limpar filtros */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500">
        <span>
          {filtered.length} de {pages.length} página
          {pages.length === 1 ? "" : "s"}
        </span>
        {hasFilters && (
          <button
            onClick={() => {
              setQuery("");
              setStatus("all");
              setCat("all");
              setDom("all");
            }}
            className="inline-flex items-center gap-1 hover:text-white transition"
          >
            <X size={11} strokeWidth={2.4} />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Barra de ações em lote */}
      {canEdit && selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap bg-[#0d0d0d] border border-[#262626] rounded-xl px-4 py-3 sticky top-3 z-10">
          <span className="text-sm font-semibold text-white">
            {selected.size} selecionada{selected.size === 1 ? "" : "s"}
          </span>
          {isPending && (
            <Loader2 size={14} className="animate-spin text-neutral-400" />
          )}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <BulkBtn
              onClick={() => runBulk(() => bulkPublishAction(selectedItems))}
              disabled={isPending}
              icon={<Globe size={12} strokeWidth={2.4} />}
              className="btn-primary"
            >
              Publicar
            </BulkBtn>
            <BulkBtn
              onClick={() => runBulk(() => bulkUnpublishAction(selectedItems))}
              disabled={isPending}
              icon={<Lock size={12} strokeWidth={2.4} />}
              className="bg-[#161616] text-neutral-300 ring-1 ring-[#262626] hover:bg-[#222]"
            >
              Despublicar
            </BulkBtn>
            <select
              disabled={isPending}
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                const type = v === "none" ? null : (v as "website" | "lp" | "form");
                runBulk(() => bulkCategorizeAction(selectedItems, type));
                e.target.value = "";
              }}
              className="bg-[#161616] text-neutral-300 ring-1 ring-[#262626] rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer hover:bg-[#222]"
            >
              <option value="" disabled>
                Categorizar...
              </option>
              <option value="website">Website</option>
              <option value="lp">Landing page</option>
              <option value="form">Formulário</option>
              <option value="none">Sem categoria</option>
            </select>
            <BulkBtn
              onClick={() => {
                if (
                  confirm(
                    `Mover ${selected.size} página(s) pra lixeira?`
                  )
                )
                  runBulk(() => bulkTrashAction(selectedItems));
              }}
              disabled={isPending}
              icon={<Trash2 size={12} strokeWidth={2.4} />}
              className="bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/25 hover:bg-rose-500/20"
            >
              Lixeira
            </BulkBtn>
            <button
              onClick={clearSel}
              className="text-neutral-500 hover:text-white transition p-1.5"
              title="Limpar seleção"
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-[#262626] rounded-2xl py-12 text-center text-sm text-neutral-500">
          Nenhuma página com esses filtros.
        </div>
      ) : (
        <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold bg-[#0d0d0d] border-b border-[#1f1f1f]">
                {canEdit && (
                  <th className="pl-5 pr-2 py-3 w-9">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="accent-white cursor-pointer"
                      aria-label="Selecionar todas"
                    />
                  </th>
                )}
                <th className="px-6 py-3">Página</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const k = keyOf(s);
                const publicSlug = s.publicSlug || s.slug;
                const isSel = selected.has(k);
                return (
                  <tr
                    key={k}
                    className={
                      "border-b border-[#161616] last:border-0 transition " +
                      (isSel ? "bg-[#121418]" : "hover:bg-[#101010]")
                    }
                  >
                    {canEdit && (
                      <td className="pl-5 pr-2 py-4 align-top">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggle(k)}
                          className="accent-white cursor-pointer"
                          aria-label={`Selecionar ${s.title}`}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 align-top">
                      <p
                        className="text-sm text-white font-semibold leading-tight line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: s.title }}
                      />
                      <p className="text-[11px] text-neutral-500 font-mono mt-1">
                        {domainLabel(s.domain)}/{s.slug}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className="text-[11px] text-neutral-400 font-medium">
                        {catLabel(s.placed)}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {s.published ? (
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25">
                            <CheckCircle2 size={11} strokeWidth={2.4} />
                            Publicada
                          </span>
                          <Link
                            href={`/${publicSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white font-mono transition"
                          >
                            /{publicSlug}
                            <ExternalLink size={10} strokeWidth={2} />
                          </Link>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-[#161616] text-neutral-400 ring-1 ring-[#262626]">
                          <Lock size={11} strokeWidth={2.4} />
                          Não publicada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <Link
                          href={`/wp-pages/${s.domain}/${encodeURIComponent(
                            s.slug
                          )}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-neutral-300 bg-[#161616] ring-1 ring-[#262626] hover:bg-[#222] hover:text-white transition"
                        >
                          <ExternalLink size={11} strokeWidth={2.4} />
                          Ver
                        </Link>
                        {canEdit && (
                          <Link
                            href={`/wp-pages/${s.domain}/${encodeURIComponent(
                              s.slug
                            )}/edit`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-neutral-300 bg-[#161616] ring-1 ring-[#262626] hover:bg-[#222] hover:text-white transition"
                          >
                            <Pencil size={11} strokeWidth={2.4} />
                            Editar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-neutral-600 cursor-pointer transition"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function BulkBtn({
  children,
  onClick,
  disabled,
  icon,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60 disabled:cursor-wait " +
        (className ?? "")
      }
    >
      {icon}
      {children}
    </button>
  );
}
