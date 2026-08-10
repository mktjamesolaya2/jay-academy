"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  X,
  Copy,
  Check,
  Film,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import {
  createMediaPageAction,
  renameMediaPageAction,
  deleteMediaPageAction,
  uploadMediaAction,
  addMediaByUrlAction,
  sincronizarRepositorioAction,
  moveMediaToPageAction,
  deleteMediaAction,
} from "@/app/midia/actions";
import type { MediaItem, MediaPage } from "@/lib/media-types";
import { albunsDa } from "@/lib/media-albuns";
import { escolherCapa } from "@/lib/media-nomes";

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
  /**
   * Os álbuns de uma mídia. Uma foto pode estar em vários — o logo e a foto do
   * professor aparecem em dezenas de páginas, e antes cada página nova roubava
   * a foto da anterior. Álbum que sumiu do cadastro não conta.
   */
  const albunsDe = (it: MediaItem) => {
    const todos = albunsDa(it).filter((a) => pageIds.has(a));
    return todos.length ? todos : [NO_PAGE];
  };

  const countByPage = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of items) for (const a of albunsDe(it)) m[a] = (m[a] || 0) + 1;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, pageIds]);

  const thumbByPage = useMemo(() => {
    // Agrupa e deixa `escolherCapa` decidir: pegar a primeira imagem dava
    // capa de ícone borrado (despertador, logo do PayPal) na maioria dos
    // grupos vindos do WP.
    const porGrupo: Record<string, MediaItem[]> = {};
    for (const it of items) for (const a of albunsDe(it)) (porGrupo[a] ||= []).push(it);
    const m: Record<string, string> = {};
    for (const [k, lista] of Object.entries(porGrupo)) {
      const capa = escolherCapa(lista);
      if (capa) m[k] = capa;
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, pageIds]);

  const [aviso, setAviso] = useState<string | null>(null);
  /** índice da foto aberta no visualizador; null = parede */
  const [fotoAberta, setFoto] = useState<number | null>(null);

  function sincronizarRepositorio() {
    setErr(null);
    setAviso(null);
    startTransition(async () => {
      const r = await sincronizarRepositorioAction();
      if (!r.ok) return setErr(r.error || "Erro ao sincronizar");
      const partes = [`${r.arquivos} arquivos em ${r.albuns} álbuns`];
      if (r.novos) partes.push(`${r.novos} novos`);
      if (r.consertados) partes.push(`${r.consertados} imagens recuperadas`);
      if (r.removidas) partes.push(`${r.removidas} que não existem mais saíram`);
      if (r.paginasWp) partes.push(`${r.paginasWp} páginas do WordPress reconferidas`);
      if (r.semImagem)
        partes.push(`${r.semImagem} sem nenhuma imagem na biblioteca`);
      setAviso(partes.join(" · ") + ".");
    });
  }

  function createPage(name: string) {
    setErr(null);
    const fd = new FormData();
    fd.set("name", name);
    startTransition(async () => {
      const r = await createMediaPageAction(fd);
      if (!r.ok) setErr(r.error || "Erro ao criar álbum");
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
      noPageCount > 0 && (!ql || "sem álbum".includes(ql) || "sem album".includes(ql));

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
              placeholder="Buscar álbum…"
              className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
            />
          </div>
          {canEdit && (
            <>
              {/* A galeria já se sincroniza sozinha quando o repositório muda
                  (ver sincronizarSeMudou em app/midia/page.tsx). Este botão é o
                  conserto manual, pra quando alguma imagem não aparecer. */}
              <button
                type="button"
                onClick={sincronizarRepositorio}
                disabled={isPending}
                title="Reconfere a biblioteca contra os arquivos do repositório e recupera imagens quebradas"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#262626] text-sm font-semibold text-neutral-300 hover:text-white hover:border-neutral-600 transition disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 size={15} strokeWidth={2.4} className="animate-spin" />
                ) : (
                  <ImagePlus size={15} strokeWidth={2.4} />
                )}
                Reconferir imagens
              </button>
              <button
                type="button"
                onClick={() => setCreating((v) => !v)}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
              >
                <FolderPlus size={15} strokeWidth={2.4} />
                Novo álbum
              </button>
            </>
          )}
        </div>

        {err && (
          <div className="bg-rose-500/10 border border-rose-500/25 rounded-md px-3 py-2 text-[12px] text-rose-300 font-medium">
            {err}
          </div>
        )}

        {aviso && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-md px-3 py-2 text-[12px] text-emerald-300 font-medium">
            {aviso}
          </div>
        )}

        {creating && canEdit && (
          <form
            action={(fd) => createPage((fd.get("name")?.toString() || "").trim())}
            className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-4 flex items-end gap-3 flex-wrap"
          >
            <label className="flex-1 min-w-[240px]">
              <span className="block text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
                Nome do álbum
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
              {ql ? `Nenhum álbum com “${q}”.` : "Nenhum álbum ainda."}
            </p>
            {!ql && canEdit && (
              <p className="text-neutral-500 text-sm mt-1">
                Crie um álbum, reconfira as imagens do repositório ou importe do WordPress —
                as importadas viram álbum sozinhas.
              </p>
            )}
          </div>
        ) : (
          /* auto-fill em vez de colunas fixas: numa tela larga cabem mais
             álbuns por linha, como na grade do app de Fotos. O respiro
             vertical é maior que o horizontal por causa do nome embaixo. */
          <div
            className="grid gap-x-4 gap-y-7"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
          >
            {showNoPage && (
              <PageCard
                title="Sem álbum"
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
                icon={p.source === "wp" ? "wp" : p.source === "lp" ? "lp" : "manual"}
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
  const title = open === NO_PAGE ? "Sem álbum" : page?.name ?? "Álbum";
  const pageItems = items.filter((it) => albunsDe(it).includes(open));
  const movePages = pages.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              setOpen(null);
              setErr(null);
              setFoto(null);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-white transition shrink-0"
          >
            <ArrowLeft size={15} strokeWidth={2.2} />
            Álbuns
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
                    const name = window.prompt("Novo nome do álbum:", page.name);
                    if (name && name.trim()) {
                      const fd = new FormData();
                      fd.set("id", page.id);
                      fd.set("name", name);
                      startTransition(() => renameMediaPageAction(fd));
                    }
                  }}
                  title="Renomear álbum"
                  className="w-9 h-9 rounded-lg bg-[#161616] text-neutral-400 hover:text-white flex items-center justify-center transition"
                >
                  <Pencil size={14} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Excluir o álbum "${page.name}"? As mídias não somem — voltam pra "Sem álbum".`
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
                  title="Excluir álbum"
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
          <p className="text-neutral-300 font-semibold">Nenhuma mídia neste álbum</p>
          {canEdit && (
            <p className="text-neutral-500 text-sm mt-1">
              Envie um arquivo aqui ou mova mídias de outro álbum.
            </p>
          )}
        </div>
      ) : (
        /**
         * A parede de fotos do app de Fotos: quadrados colados, sem legenda,
         * sem moldura. A densidade É a interface — quem procura uma imagem
         * reconhece pela imagem, não pelo nome do arquivo. Nome, categoria e
         * ações moram no visualizador, a um clique.
         */
        <div
          className="grid gap-[3px] overflow-hidden rounded-xl"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))" }}
        >
          {pageItems.map((m, i) => (
            <PhotoTile key={m.id} item={m} onOpen={() => setFoto(i)} />
          ))}
        </div>
      )}

      {fotoAberta !== null && pageItems[fotoAberta] && (
        <Visualizador
          itens={pageItems}
          indice={fotoAberta}
          canEdit={canEdit}
          movePages={movePages}
          onIr={setFoto}
          onFechar={() => setFoto(null)}
        />
      )}
    </div>
  );
}

/** Um quadradinho da parede. Sem texto: só a imagem. */
function PhotoTile({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      title={item.name}
      aria-label={`Abrir ${item.name}`}
      className="group relative aspect-square overflow-hidden bg-[#141414] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
    >
      {item.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 motion-safe:group-hover:scale-[1.06]"
        />
      ) : (
        /* vídeo e arquivo não têm o que mostrar — aí sim o nome aparece,
           senão vira um quadrado preto indecifrável no meio da parede */
        <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-2 text-center">
          {item.type === "video" ? (
            <Film size={20} strokeWidth={1.6} className="text-neutral-500" />
          ) : (
            <FileText size={20} strokeWidth={1.6} className="text-neutral-500" />
          )}
          <span className="line-clamp-2 text-[9.5px] leading-tight text-neutral-500">
            {item.name}
          </span>
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 bg-white/0 transition group-hover:bg-white/10" />
    </button>
  );
}

/**
 * Álbum, no formato do app de Fotos: a capa QUADRADA é o objeto — sem moldura,
 * sem fundo de cartão, sem etiqueta carimbada em cima da imagem. Nome e
 * contagem moram embaixo, e a origem (WP/LP) virou texto discreto ali, porque
 * é informação útil mas não é o assunto da tela.
 *
 * A lasquinha atrás da capa é a pilha do iOS: diz "isto é uma coleção, não uma
 * foto". É o único enfeite — não somar outros.
 */
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
  icon: "wp" | "manual" | "lp" | "none";
  onClick: () => void;
}) {
  // Só o que é exceção merece etiqueta. Desde que a galeria passou a trazer o
  // repositório inteiro, quase todo álbum é "LP" — repetir isso em 16 cartões
  // não informa nada. O que muda o entendimento é ter vindo de fora.
  const origem = icon === "wp" ? "WordPress" : null;

  return (
    <button
      onClick={onClick}
      className="group text-left focus:outline-none"
      aria-label={`Abrir ${title}, ${subtitle}`}
    >
      <div className="relative">
        {/* pilha: a lasquinha que aparece atrás da capa */}
        <div
          aria-hidden
          className="absolute inset-x-2.5 -bottom-1 h-3 rounded-b-[13px] bg-[#242424]"
        />
        <div className="relative aspect-square overflow-hidden rounded-[15px] bg-[#141414] ring-1 ring-white/[0.06] transition duration-300 group-hover:ring-white/20 group-focus-visible:ring-2 group-focus-visible:ring-white motion-safe:group-hover:-translate-y-0.5">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 motion-safe:group-hover:scale-[1.04]"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <Folder size={26} strokeWidth={1.4} className="text-neutral-700" />
            </span>
          )}
        </div>
      </div>

      <p
        className="mt-3 truncate text-[13.5px] font-semibold tracking-[-0.01em] text-white"
        title={title}
      >
        {title}
      </p>
      <p className="mt-0.5 text-[12px] text-neutral-500">
        {subtitle}
        {origem && <span className="text-neutral-600"> · {origem}</span>}
      </p>
    </button>
  );
}


/**
 * Visualizador — o equivalente a tocar numa foto no app de Fotos: a imagem
 * ocupa a tela, e o que é operação (copiar link, mover, excluir) fica numa
 * barra discreta embaixo, fora do caminho.
 *
 * Setas andam entre as fotos e Esc fecha, porque é o que a mão espera depois
 * de abrir uma galeria.
 */
function Visualizador({
  itens,
  indice,
  canEdit,
  movePages,
  onIr,
  onFechar,
}: {
  itens: MediaItem[];
  indice: number;
  canEdit: boolean;
  movePages: { id: string; name: string }[];
  onIr: (i: number) => void;
  onFechar: () => void;
}) {
  const item = itens[indice];
  const [copiado, setCopiado] = useState(false);
  const [baixando, setBaixando] = useState(false);
  /** medida real do arquivo, lida da imagem já carregada */
  const [medida, setMedida] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => setMedida(null), [item.url]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
      if (e.key === "ArrowRight" && indice < itens.length - 1) onIr(indice + 1);
      if (e.key === "ArrowLeft" && indice > 0) onIr(indice - 1);
    };
    window.addEventListener("keydown", tecla);
    // trava a rolagem do fundo enquanto o visualizador está aberto
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [indice, itens.length, onIr, onFechar]);

  async function copiar() {
    const url = item.url.startsWith("http")
      ? item.url
      : window.location.origin + item.url;
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  /**
   * Baixa o arquivo ORIGINAL, do jeito que ele está guardado — nada é
   * redimensionado nem recomprimido no caminho. O `<a download>` sozinho não
   * serve: ele é ignorado quando o arquivo mora em outro domínio (Supabase),
   * e aí o navegador abre a imagem em vez de baixar. Então busca o arquivo,
   * baixa do blob, e só cai pra "abrir em outra aba" se o CORS barrar.
   */
  async function baixar() {
    setBaixando(true);
    try {
      const resposta = await fetch(item.url);
      if (!resposta.ok) throw new Error(String(resposta.status));
      const blob = await resposta.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = nomeDeArquivo(item);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(item.url, "_blank", "noopener");
    } finally {
      setBaixando(false);
    }
  }

  function excluir() {
    if (!confirm(`Excluir "${item.name}" da biblioteca?`)) return;
    const fd = new FormData();
    fd.set("id", item.id);
    startTransition(async () => {
      await deleteMediaAction(fd);
      onFechar();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      onClick={onFechar}
      className="fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150"
    >
      <div
        className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white" title={item.name}>
            {item.name}
          </p>
          <p className="text-[11px] text-neutral-500">
            {indice + 1} de {itens.length}
            {medida ? ` · ${medida}` : ""}
            {item.size ? ` · ${Math.round(item.size / 1024)} kB` : ""}
          </p>
        </div>
        <button
          onClick={onFechar}
          aria-label="Fechar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={17} strokeWidth={2.2} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-2">
        {indice > 0 && (
          <Seta lado="esq" onClick={() => onIr(indice - 1)} />
        )}
        {item.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.name}
            onClick={(e) => e.stopPropagation()}
            // a medida real do arquivo, não a que coube na tela: é ela que diz
            // se a imagem serve pra impressão ou só pra web
            onLoad={(e) =>
              setMedida(
                `${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight}`
              )
            }
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-3 text-neutral-400"
          >
            {item.type === "video" ? (
              <Film size={40} strokeWidth={1.4} />
            ) : (
              <FileText size={40} strokeWidth={1.4} />
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noopener"
              className="text-sm font-semibold text-white underline underline-offset-4"
            >
              Abrir arquivo
            </a>
          </div>
        )}
        {indice < itens.length - 1 && (
          <Seta lado="dir" onClick={() => onIr(indice + 1)} />
        )}
      </div>

      <div
        className="flex flex-wrap items-center justify-center gap-2 px-4 py-4 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={baixar}
          disabled={baixando}
          title="Baixa o arquivo original, sem reduzir nada"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-[#0a0a0a] transition hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
        >
          {baixando ? (
            <Loader2 size={13} strokeWidth={2.6} className="animate-spin" />
          ) : (
            <Download size={13} strokeWidth={2.4} />
          )}
          Baixar
        </button>
        <button
          onClick={copiar}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {copiado ? (
            <>
              <Check size={13} strokeWidth={2.6} /> Link copiado
            </>
          ) : (
            <>
              <Copy size={13} strokeWidth={2.4} /> Copiar link
            </>
          )}
        </button>
        {canEdit && (
          <>
            <select
              value={item.pageId ?? "__none__"}
              onChange={(e) => {
                const v = e.target.value;
                startTransition(async () => {
                  await moveMediaToPageAction(
                    [item.id],
                    v === "__none__" ? null : v
                  );
                });
              }}
              aria-label="Mover para outro álbum"
              className="max-w-[240px] cursor-pointer truncate rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[12.5px] font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <option value="__none__">Sem álbum</option>
              {movePages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={excluir}
              className="inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/15 px-4 py-2 text-[12.5px] font-semibold text-rose-200 transition hover:bg-rose-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <Trash2 size={13} strokeWidth={2.2} /> Excluir
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Nome pro arquivo salvo. As do espelho do WP se chamam
 * `<hash12>-<nome de verdade>-<sufixo>.jpg` — salvar isso no computador do
 * James não ajuda ninguém, então tira a moldura e deixa o nome original.
 */
function nomeDeArquivo(item: MediaItem): string {
  const ext = (item.url.split("?")[0].match(/\.[a-z0-9]+$/i) || [""])[0];
  const limpo = item.name
    .replace(/^[0-9a-f]{12}-/, "")
    .replace(/-[0-9a-z]{10}(?=\.[a-z0-9]+$|$)/i, "");
  return limpo.toLowerCase().endsWith(ext.toLowerCase()) ? limpo : limpo + ext;
}

function Seta({ lado, onClick }: { lado: "esq" | "dir"; onClick: () => void }) {
  const Icone = lado === "esq" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={lado === "esq" ? "Anterior" : "Próxima"}
      className={`absolute ${
        lado === "esq" ? "left-2 sm:left-5" : "right-2 sm:right-5"
      } z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white`}
    >
      <Icone size={20} strokeWidth={2.2} />
    </button>
  );
}
