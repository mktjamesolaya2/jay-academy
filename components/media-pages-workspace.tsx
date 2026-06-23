"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Search,
  FolderPlus,
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  Loader2,
  Folder,
  Globe,
  Pencil,
  Trash2,
  ImagePlus,
} from "lucide-react";
import { MediaCard } from "./media-library";
import {
  createMediaPageAction,
  renameMediaPageAction,
  deleteMediaPageAction,
  uploadMediaAction,
  addMediaByUrlAction,
} from "@/app/midia/actions";
import type { MediaItem, MediaPage } from "@/lib/media-types";

const NO_PAGE = "__none__";

export function MediaPagesWorkspace({
  items,
  pages,
  canEdit,
}: {
  items: MediaItem[];
  pages: MediaPage[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const pageIds = useMemo(() => new Set(pages.map((p) => p.id)), [pages]);
  const pageOf = (it: MediaItem) =>
    it.pageId && pageIds.has(it.pageId) ? it.pageId : NO_PAGE;

  const countByPage = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of items) m[pageOf(it)] = (m[pageOf(it)] || 0) + 1;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, pageIds]);

  const thumbByPage = useMemo(() => {
    const m: Record<string, string> = {};
    for (const it of items) {
      if (it.type !== "image") continue;
      const k = pageOf(it);
      if (!m[k]) m[k] = it.url;
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, pageIds]);

  function createPage(name: string) {
    setErr(null);
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const r = await createMediaPageAction(fd);
      if (!r.ok) setErr(r.error || "Erro ao criar página");
      else {
        setCreating(false);
        if (r.id) setOpen(r.id);
      }
    });
  }

  function uploadTo(pageId: string | null, file: File) {
    setErr(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("category", "Importadas do WP");
    if (pageId) fd.set("pageId", pageId);
    startTransition(async () => {
      const r = await uploadMediaAction(fd);
      if (!r.ok) setErr(r.error || "Erro no upload");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  // ─────────────────────────── OVERVIEW ───────────────────────────
  if (open === null) {
    const ql = q.trim().toLowerCase();
    const visiblePages = pages.filter((p) => {
      if (ql && !p.name.toLowerCase().includes(ql)) return false;
      // Esconde páginas WP vazias (auto-criadas que ficaram sem mídia).
      // Páginas manuais ficam mesmo vazias (o usuário criou de propósito).
      if (p.source === "wp" && (countByPage[p.id] || 0) === 0) return false;
      return true;
    });
    const noPageCount = countByPage[NO_PAGE] || 0;
    const showNoPage =
      noPageCount > 0 && (!ql || "sem página".includes(ql) || "sem pagina".includes(ql));

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar página por nome…"
              className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
            >
              <FolderPlus size={15} strokeWidth={2.4} />
              Nova página
            </button>
          )}
        </div>

        {err && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-md px-3 py-2 text-[12px] text-rose-300 font-medium">
            {err}
          </div>
        )}

        {creating && canEdit && (
          <form
            action={(fd) => createPage((fd.get("name")?.toString() || "").trim())}
            className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-4 flex items-end gap-3 flex-wrap"
          >
            <label className="flex-1 min-w-[240px]">
              <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
                Nome da página
              </span>
              <input
                name="name"
                autoFocus
                placeholder="Ex: Depoimentos 2026"
                className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
            >
              Criar
            </button>
          </form>
        )}

        {visiblePages.length === 0 && !showNoPage ? (
          <div className="border border-dashed border-[#262626] rounded-2xl py-16 text-center">
            <Folder size={26} strokeWidth={1.6} className="mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-300 font-semibold">
              {ql ? `Nenhuma página encontrada pra “${q}”.` : "Nenhuma página ainda."}
            </p>
            {!ql && canEdit && (
              <p className="text-neutral-500 text-sm mt-1">
                Crie uma página ou importe páginas do WordPress (elas viram páginas
                automaticamente).
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {showNoPage && (
              <PageCard
                title="Sem página"
                subtitle={`${noPageCount} mídia${noPageCount === 1 ? "" : "s"}`}
                thumb={thumbByPage[NO_PAGE]}
                icon="none"
                onClick={() => setOpen(NO_PAGE)}
              />
            )}
            {visiblePages.map((p) => (
              <PageCard
                key={p.id}
                title={p.name}
                subtitle={`${countByPage[p.id] || 0} mídia${
                  (countByPage[p.id] || 0) === 1 ? "" : "s"
                }`}
                thumb={thumbByPage[p.id]}
                icon={p.source === "wp" ? "wp" : "manual"}
                onClick={() => setOpen(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────── DETALHE DE UMA PÁGINA ───────────────────────────
  const page = pages.find((p) => p.id === open) || null;
  const title = open === NO_PAGE ? "Sem página" : page?.name ?? "Página";
  const pageItems = items.filter((it) => pageOf(it) === open);
  const movePages = pages.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              setOpen(null);
              setErr(null);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-white transition shrink-0"
          >
            <ArrowLeft size={15} strokeWidth={2.2} />
            Páginas
          </button>
          <span className="text-neutral-700">/</span>
          <h3 className="text-lg font-semibold text-white tracking-[-0.02em] truncate">
            {title}
          </h3>
          <span className="text-xs text-neutral-500">
            ({pageItems.length})
          </span>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => fileRef.current?.click()}
              className="btn-primary inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" strokeWidth={2.4} />
              ) : (
                <Upload size={14} strokeWidth={2.4} />
              )}
              Enviar aqui
            </button>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadTo(open === NO_PAGE ? null : open, f);
              }}
            />
            {page?.source === "manual" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const name = window.prompt("Novo nome da página:", page.name);
                    if (name && name.trim()) {
                      const fd = new FormData();
                      fd.set("id", page.id);
                      fd.set("name", name);
                      startTransition(() => renameMediaPageAction(fd));
                    }
                  }}
                  title="Renomear página"
                  className="w-9 h-9 rounded-lg bg-[#161616] text-neutral-400 hover:text-white flex items-center justify-center transition"
                >
                  <Pencil size={14} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Excluir a página "${page.name}"? As mídias não somem — voltam pra "Sem página".`
                      )
                    ) {
                      const fd = new FormData();
                      fd.set("id", page.id);
                      startTransition(async () => {
                        await deleteMediaPageAction(fd);
                        setOpen(null);
                      });
                    }
                  }}
                  title="Excluir página"
                  className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 flex items-center justify-center transition"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {err && (
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-md px-3 py-2 text-[12px] text-rose-300 font-medium">
          {err}
        </div>
      )}

      {pageItems.length === 0 ? (
        <div className="border border-dashed border-[#262626] rounded-2xl py-16 text-center">
          <ImagePlus size={26} strokeWidth={1.6} className="mx-auto text-neutral-600 mb-3" />
          <p className="text-neutral-300 font-semibold">Nenhuma mídia nessa página</p>
          {canEdit && (
            <p className="text-neutral-500 text-sm mt-1">
              Envie um arquivo aqui ou mova mídias de outra página.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {pageItems.map((m) => (
            <MediaCard
              key={m.id}
              item={m}
              canEdit={canEdit}
              movePages={movePages}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PageCard({
  title,
  subtitle,
  thumb,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  thumb?: string;
  icon: "wp" | "manual" | "none";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl overflow-hidden hover:border-neutral-600 transition"
    >
      <div className="aspect-[4/3] bg-[#161616] relative flex items-center justify-center overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition"
          />
        ) : (
          <Folder size={30} strokeWidth={1.4} className="text-neutral-600" />
        )}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] px-1.5 py-0.5 rounded bg-black/60 text-neutral-300 backdrop-blur">
          {icon === "wp" ? (
            <>
              <Globe size={9} strokeWidth={2.4} /> WP
            </>
          ) : icon === "manual" ? (
            <>
              <Folder size={9} strokeWidth={2.4} /> Página
            </>
          ) : (
            "Sem página"
          )}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-white truncate" title={title}>
          {title}
        </p>
        <p className="text-[11px] text-neutral-500 mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}
