"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Upload,
  Link as LinkIcon,
  Search,
  Copy,
  Check,
  Trash2,
  Film,
  FileText,
  Loader2,
  ImagePlus,
} from "lucide-react";
import {
  uploadMediaAction,
  addMediaByUrlAction,
  deleteMediaAction,
  moveMediaToPageAction,
} from "@/app/midia/actions";
import { MEDIA_CATEGORIES, type MediaItem } from "@/lib/media-types";

export function MediaLibrary({
  items,
  canEdit,
}: {
  items: MediaItem[];
  canEdit: boolean;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("Todos");
  const [uploadCat, setUploadCat] = useState<string>("Logos");
  const [urlOpen, setUrlOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => {
      if (cat !== "Todos" && m.category !== cat) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, cat]);

  function onPickFile(file: File) {
    setErr(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("category", uploadCat);
    startTransition(async () => {
      const r = await uploadMediaAction(fd);
      if (!r.ok) setErr(r.error || "Erro no upload");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar arquivo..."
            className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
          />
        </div>

        {canEdit && (
          <>
            <select
              value={uploadCat}
              onChange={(e) => setUploadCat(e.target.value)}
              className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 focus:outline-none cursor-pointer"
              title="Categoria do upload"
            >
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isPending}
              onClick={() => fileRef.current?.click()}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" strokeWidth={2.4} />
              ) : (
                <Upload size={14} strokeWidth={2.4} />
              )}
              Enviar arquivo
            </button>
            <input
              ref={fileRef}
              type="file"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
            />

            <button
              type="button"
              onClick={() => setUrlOpen((v) => !v)}
              className="btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <LinkIcon size={14} strokeWidth={2.4} />
              Por URL
            </button>
          </>
        )}
      </div>

      {err && (
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-md px-3 py-2 text-[12px] text-rose-300 font-medium">
          {err}
        </div>
      )}

      {/* Adicionar por URL */}
      {urlOpen && canEdit && (
        <form
          action={(fd) =>
            startTransition(async () => {
              setErr(null);
              fd.set("category", uploadCat);
              const r = await addMediaByUrlAction(fd);
              if (!r.ok) setErr(r.error || "Erro");
              else setUrlOpen(false);
            })
          }
          className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-4 flex items-end gap-3 flex-wrap"
        >
          <label className="flex-1 min-w-[240px]">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
              URL do arquivo (ex: vídeo)
            </span>
            <input
              name="url"
              placeholder="https://.../video.mp4"
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </label>
          <label className="min-w-[160px]">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
              Nome (opcional)
            </span>
            <input
              name="name"
              placeholder="Nome amigável"
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-70"
          >
            Adicionar
          </button>
        </form>
      )}

      {/* Categorias */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {["Todos", ...MEDIA_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={
              "px-3 py-1.5 rounded-full text-xs font-semibold transition " +
              (cat === c
                ? "bg-white text-[#0a0a0a]"
                : "bg-[#161616] text-neutral-400 hover:text-white")
            }
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-[#262626] rounded-2xl py-16 text-center">
          <ImagePlus
            size={26}
            strokeWidth={1.6}
            className="mx-auto text-neutral-600 mb-3"
          />
          <p className="text-neutral-300 font-semibold">
            {items.length === 0 ? "Nenhum arquivo ainda" : "Nada nessa categoria"}
          </p>
          {items.length === 0 && canEdit && (
            <p className="text-neutral-500 text-sm mt-1">
              Envie um arquivo ou adicione por URL pra começar.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((m) => (
            <MediaCard key={m.id} item={m} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MediaCard({
  item,
  canEdit,
  movePages,
}: {
  item: MediaItem;
  canEdit: boolean;
  /** Se fornecido, mostra um seletor pra mover a mídia entre páginas. */
  movePages?: { id: string; name: string }[];
}) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function move(value: string) {
    startTransition(async () => {
      await moveMediaToPageAction([item.id], value === "__none__" ? null : value);
    });
  }

  function fullUrl() {
    if (item.url.startsWith("http")) return item.url;
    return typeof window !== "undefined"
      ? window.location.origin + item.url
      : item.url;
  }

  async function copy() {
    await navigator.clipboard.writeText(fullUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function remove() {
    if (!confirm(`Excluir "${item.name}" da biblioteca?`)) return;
    const fd = new FormData();
    fd.set("id", item.id);
    startTransition(() => deleteMediaAction(fd));
  }

  return (
    <div className="group bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl overflow-hidden">
      <div className="aspect-square bg-[#161616] relative flex items-center justify-center overflow-hidden">
        {item.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : item.type === "video" ? (
          <Film size={28} strokeWidth={1.6} className="text-neutral-500" />
        ) : (
          <FileText size={28} strokeWidth={1.6} className="text-neutral-500" />
        )}

        {/* Hover actions */}
        <div className="absolute inset-x-0 bottom-0 p-2 flex items-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={copy}
            title="Copiar link"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/90 text-[#0a0a0a] rounded-md py-1.5 text-[11px] font-semibold hover:bg-white"
          >
            {copied ? (
              <>
                <Check size={11} strokeWidth={2.6} /> Copiado
              </>
            ) : (
              <>
                <Copy size={11} strokeWidth={2.4} /> Copiar link
              </>
            )}
          </button>
          {canEdit && (
            <button
              onClick={remove}
              title="Excluir"
              className="w-7 h-7 rounded-md bg-rose-500/90 text-white flex items-center justify-center hover:bg-rose-500 shrink-0"
            >
              <Trash2 size={12} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
      <div className="px-2.5 py-2">
        <p className="text-xs font-semibold text-white truncate" title={item.name}>
          {item.name}
        </p>
        <p className="text-[10px] text-neutral-500 mt-0.5">{item.category}</p>
        {movePages && canEdit && (
          <select
            value={item.pageId ?? "__none__"}
            onChange={(e) => move(e.target.value)}
            title="Mover pra página"
            className="mt-1.5 w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-1.5 py-1 text-[10px] text-neutral-400 focus:outline-none cursor-pointer"
          >
            <option value="__none__">Sem página</option>
            {movePages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
