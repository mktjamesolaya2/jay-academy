"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  ArrowUp,
  ArrowDown,
  Copy as CopyIcon,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Undo2,
  Redo2,
  GripVertical,
} from "lucide-react";
import {
  BLOCK_LABELS,
  ACCENT_LABELS,
  ACCENT_GRADIENTS,
  defaultBlockData,
  newBlockId,
  type Block,
  type BlockType,
  type BuilderPage,
  type BuilderTheme,
  type HeroData,
  type TestimonialsData,
  type FAQData,
  type CTAData,
  type PricingData,
  type TextData,
  type ImageData,
} from "@/lib/page-builder-types";
import { EditableBlockRenderer } from "@/components/page-builder/editable-renderer";
import { ImageInput } from "@/components/page-builder/image-input";
import { saveBuilderAction } from "@/app/lps/[slug]/build/actions";

type Props = {
  slug: string;
  lpName: string;
  initialPage: BuilderPage;
};

const MAX_HISTORY = 50;

export function BuilderEditor({ slug, lpName, initialPage }: Props) {
  const [page, setPage] = useState<BuilderPage>(initialPage);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPage.blocks[0]?.id ?? null
  );
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addAtIndex, setAddAtIndex] = useState<number>(-1);

  // Undo/redo: history de snapshots de page state.
  const historyRef = useRef<BuilderPage[]>([initialPage]);
  const historyIndexRef = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  // Debounce de snapshots pra agrupar edições de texto consecutivas
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drag-to-reorder de blocos
  const [dragBlockId, setDragBlockId] = useState<string | null>(null);
  const [dropBlockTarget, setDropBlockTarget] = useState<
    { id: string; pos: "before" | "after" } | null
  >(null);

  const selected = page.blocks.find((b) => b.id === selectedId) ?? null;
  const gradient = ACCENT_GRADIENTS[page.theme.accent];

  function pushHistory(next: BuilderPage) {
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = setTimeout(() => {
      const idx = historyIndexRef.current;
      const cut = historyRef.current.slice(0, idx + 1);
      cut.push(next);
      if (cut.length > MAX_HISTORY) cut.shift();
      historyRef.current = cut;
      historyIndexRef.current = cut.length - 1;
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(false);
    }, 400);
  }

  function pushHistoryNow(next: BuilderPage) {
    if (snapshotTimerRef.current) {
      clearTimeout(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    const idx = historyIndexRef.current;
    const cut = historyRef.current.slice(0, idx + 1);
    cut.push(next);
    if (cut.length > MAX_HISTORY) cut.shift();
    historyRef.current = cut;
    historyIndexRef.current = cut.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const prev = historyRef.current[historyIndexRef.current];
    setPage(prev);
    setDirty(true);
    setSaveStatus("idle");
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const next = historyRef.current[historyIndexRef.current];
    setPage(next);
    setDirty(true);
    setSaveStatus("idle");
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Atalho global Ctrl+Z / Ctrl+Shift+Z (ou Ctrl+Y).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        // Não interfere com undo nativo do contentEditable enquanto
        // o usuário está digitando dentro de um campo.
        const target = e.target as HTMLElement | null;
        const editing =
          target?.isContentEditable ||
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA";
        if (editing) return;
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        const target = e.target as HTMLElement | null;
        const editing =
          target?.isContentEditable ||
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA";
        if (editing) return;
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  function updatePage(next: BuilderPage, snapshotMode: "debounce" | "now" = "debounce") {
    setPage(next);
    setDirty(true);
    setSaveStatus("idle");
    if (snapshotMode === "now") pushHistoryNow(next);
    else pushHistory(next);
  }

  function addBlock(type: BlockType, index: number) {
    const newBlock = {
      id: newBlockId(),
      type,
      data: defaultBlockData(type),
    } as Block;
    const insertAt = index < 0 ? page.blocks.length : index;
    const blocks = [
      ...page.blocks.slice(0, insertAt),
      newBlock,
      ...page.blocks.slice(insertAt),
    ];
    updatePage({ ...page, blocks }, "now");
    setSelectedId(newBlock.id);
    setShowAddModal(false);
  }

  function updateBlock(id: string, data: Block["data"]) {
    const blocks = page.blocks.map((b) =>
      b.id === id ? ({ ...b, data } as Block) : b
    );
    updatePage({ ...page, blocks });
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = page.blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= page.blocks.length) return;
    const blocks = [...page.blocks];
    const [removed] = blocks.splice(idx, 1);
    blocks.splice(newIdx, 0, removed);
    updatePage({ ...page, blocks }, "now");
  }

  function reorderBlocks(sourceId: string, targetId: string, position: "before" | "after") {
    if (sourceId === targetId) return;
    const srcIdx = page.blocks.findIndex((b) => b.id === sourceId);
    const tgtIdx = page.blocks.findIndex((b) => b.id === targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const blocks = [...page.blocks];
    const [src] = blocks.splice(srcIdx, 1);
    // Recalcula índice do target depois do splice
    const newTgtIdx = blocks.findIndex((b) => b.id === targetId);
    const insertAt = position === "before" ? newTgtIdx : newTgtIdx + 1;
    blocks.splice(insertAt, 0, src);
    updatePage({ ...page, blocks }, "now");
  }

  function duplicateBlock(id: string) {
    const idx = page.blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const orig = page.blocks[idx];
    const clone = {
      ...orig,
      id: newBlockId(),
      data: JSON.parse(JSON.stringify(orig.data)),
    } as Block;
    const blocks = [
      ...page.blocks.slice(0, idx + 1),
      clone,
      ...page.blocks.slice(idx + 1),
    ];
    updatePage({ ...page, blocks }, "now");
    setSelectedId(clone.id);
  }

  function deleteBlock(id: string) {
    if (!confirm("Excluir esse bloco?")) return;
    const blocks = page.blocks.filter((b) => b.id !== id);
    updatePage({ ...page, blocks }, "now");
    if (selectedId === id) setSelectedId(blocks[0]?.id ?? null);
  }

  function updateTheme(theme: Partial<BuilderTheme>) {
    updatePage({ ...page, theme: { ...page.theme, ...theme } }, "now");
  }

  function handleSave() {
    setSaveStatus("saving");
    setErrorMsg(null);
    startTransition(async () => {
      const result = await saveBuilderAction(slug, JSON.stringify(page));
      if (result.ok) {
        setSaveStatus("saved");
        setDirty(false);
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
        setErrorMsg(result.error ?? "Erro ao salvar");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {/* Topbar */}
      <header className="shrink-0 border-b border-[#1f1f1f] px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={`/lps/${slug}`}
            onClick={(e) => {
              if (dirty && !confirm("Você tem mudanças não salvas. Sair?"))
                e.preventDefault();
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Sair do editor
          </Link>
          <div className="h-5 w-px bg-[#1f1f1f]" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold leading-none">
              Página com blocos
            </p>
            <p className="text-sm font-semibold text-white truncate mt-0.5">
              {lpName}
            </p>
          </div>
          <div className="h-5 w-px bg-[#1f1f1f]" />
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#161616] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 size={13} strokeWidth={2.2} />
            Desfazer
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#161616] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 size={13} strokeWidth={2.2} />
            Refazer
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#161616] transition"
          >
            <ExternalLink size={12} strokeWidth={2.2} />
            Ver no ar
          </Link>
          <SaveStatus status={saveStatus} error={errorMsg} dirty={dirty} />
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || isPending}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" strokeWidth={2.5} />
                Salvando...
              </>
            ) : (
              <>
                <Save size={14} strokeWidth={2.5} />
                Salvar
              </>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Sidebar esquerda: lista de blocos + tema */}
        <aside className="w-72 shrink-0 border-r border-[#1f1f1f] bg-[#0a0a0a] flex flex-col overflow-y-auto">
          <div className="px-4 pt-4 pb-3 border-b border-[#1f1f1f]">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              Tema
            </p>
            <div className="mt-2 space-y-2">
              <select
                value={page.theme.accent}
                onChange={(e) =>
                  updateTheme({ accent: e.target.value as BuilderTheme["accent"] })
                }
                className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-md px-2.5 py-1.5 text-xs text-white"
              >
                {Object.entries(ACCENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={page.theme.darkMode}
                  onChange={(e) => updateTheme({ darkMode: e.target.checked })}
                  className="accent-white"
                />
                Modo escuro
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              Blocos ({page.blocks.length})
            </p>
            <button
              type="button"
              onClick={() => {
                setAddAtIndex(-1);
                setShowAddModal(true);
              }}
              title="Adicionar no final"
              className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition"
            >
              <Plus size={12} strokeWidth={2.4} />
            </button>
          </div>

          {page.blocks.length > 1 && (
            <p className="px-4 pb-2 text-[10px] text-neutral-600 leading-relaxed">
              Arraste pra reordenar.
            </p>
          )}
          <div className="flex-1 px-2 pb-3 space-y-1">
            {page.blocks.length === 0 ? (
              <div className="px-2 py-6 text-center">
                <Sparkles
                  size={20}
                  strokeWidth={1.5}
                  className="text-neutral-600 mx-auto mb-2"
                />
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Sem blocos ainda. Clica no + acima pra começar.
                </p>
              </div>
            ) : (
              page.blocks.map((block, i) => {
                const info = BLOCK_LABELS[block.type];
                const isSelected = block.id === selectedId;
                const isDragging = dragBlockId === block.id;
                const dropHere = dropBlockTarget?.id === block.id;
                return (
                  <div
                    key={block.id}
                    className={`group ${isDragging ? "opacity-40" : ""} ${
                      dropHere && dropBlockTarget?.pos === "before"
                        ? "border-t-2 border-blue-500"
                        : ""
                    } ${
                      dropHere && dropBlockTarget?.pos === "after"
                        ? "border-b-2 border-blue-500"
                        : ""
                    }`}
                    onDragOver={(e) => {
                      if (!dragBlockId || dragBlockId === block.id) return;
                      e.preventDefault();
                      const rect = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      const pos =
                        e.clientY - rect.top < rect.height / 2
                          ? "before"
                          : "after";
                      setDropBlockTarget({ id: block.id, pos });
                    }}
                    onDragLeave={() => setDropBlockTarget(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragBlockId && dropBlockTarget) {
                        reorderBlocks(
                          dragBlockId,
                          block.id,
                          dropBlockTarget.pos
                        );
                      }
                      setDragBlockId(null);
                      setDropBlockTarget(null);
                    }}
                  >
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        setDragBlockId(block.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDragBlockId(null);
                        setDropBlockTarget(null);
                      }}
                      onClick={() => setSelectedId(block.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition ${
                        isSelected
                          ? "bg-blue-500/20 text-white"
                          : "text-neutral-400 hover:bg-[#121212] hover:text-white"
                      }`}
                    >
                      <GripVertical
                        size={11}
                        strokeWidth={2}
                        className="shrink-0 text-neutral-600 cursor-grab"
                      />
                      <span className="text-base shrink-0">{info.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {info.label}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">
                          {blockPreview(block)}
                        </p>
                      </div>
                    </button>
                    {isSelected && (
                      <div className="flex items-center gap-0.5 mt-0.5 ml-2">
                        <RowButton
                          icon={ArrowUp}
                          title="Subir"
                          onClick={() => moveBlock(block.id, -1)}
                          disabled={i === 0}
                        />
                        <RowButton
                          icon={ArrowDown}
                          title="Descer"
                          onClick={() => moveBlock(block.id, 1)}
                          disabled={i === page.blocks.length - 1}
                        />
                        <RowButton
                          icon={CopyIcon}
                          title="Duplicar"
                          onClick={() => duplicateBlock(block.id)}
                        />
                        <RowButton
                          icon={Plus}
                          title="Add abaixo"
                          onClick={() => {
                            setAddAtIndex(i + 1);
                            setShowAddModal(true);
                          }}
                        />
                        <RowButton
                          icon={Trash2}
                          title="Excluir"
                          onClick={() => deleteBlock(block.id)}
                          danger
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Centro: preview */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-neutral-900">
          <div
            className={
              page.theme.darkMode
                ? "min-h-full bg-[#0a0a0a] text-white"
                : "min-h-full bg-white text-neutral-900"
            }
          >
            {page.blocks.length === 0 ? (
              <div className="flex items-center justify-center min-h-[80vh] px-6 text-center">
                <div>
                  <Sparkles
                    size={32}
                    strokeWidth={1.5}
                    className="text-neutral-400 mx-auto mb-3"
                  />
                  <h2 className="text-2xl font-bold mb-2">
                    Comece adicionando um bloco
                  </h2>
                  <p className={`text-sm ${page.theme.darkMode ? "text-neutral-400" : "text-neutral-600"} mb-5 max-w-sm`}>
                    Escolha um tipo na sidebar à esquerda ou clica no botão abaixo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAddAtIndex(-1);
                      setShowAddModal(true);
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r ${gradient} text-white font-semibold text-sm`}
                  >
                    <Plus size={14} strokeWidth={2.4} />
                    Adicionar bloco
                  </button>
                </div>
              </div>
            ) : (
              page.blocks.map((block, idx) => {
                const isSelected = selectedId === block.id;
                return (
                  <div
                    key={block.id}
                    onClick={(e) => {
                      // Não roubar foco de inputs editáveis
                      if ((e.target as HTMLElement).closest("[contenteditable]"))
                        return;
                      setSelectedId(block.id);
                    }}
                    className={`relative ${
                      isSelected
                        ? "outline outline-2 outline-blue-500 outline-offset-[-2px]"
                        : "hover:outline hover:outline-1 hover:outline-blue-500/30 hover:outline-offset-[-1px]"
                    }`}
                  >
                    {isSelected && (
                      <FloatingBlockToolbar
                        canMoveUp={idx > 0}
                        canMoveDown={idx < page.blocks.length - 1}
                        onMoveUp={() => moveBlock(block.id, -1)}
                        onMoveDown={() => moveBlock(block.id, 1)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onDelete={() => deleteBlock(block.id)}
                        onAddBelow={() => {
                          setAddAtIndex(idx + 1);
                          setShowAddModal(true);
                        }}
                      />
                    )}
                    <EditableBlockRenderer
                      block={block}
                      onChange={(data) => updateBlock(block.id, data)}
                      gradient={gradient}
                      dark={page.theme.darkMode}
                    />
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Sidebar direita: editor do bloco */}
        <aside className="w-80 shrink-0 border-l border-[#1f1f1f] bg-[#0a0a0a] flex flex-col overflow-y-auto">
          {selected ? (
            <BlockEditorPanel
              block={selected}
              onChange={(data) => updateBlock(selected.id, data)}
            />
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-neutral-500 leading-relaxed">
                Selecione um bloco na lista (esquerda) ou no preview pra editar
                seu conteúdo aqui.
              </p>
            </div>
          )}
        </aside>
      </div>

      {showAddModal && (
        <AddBlockModal
          onClose={() => setShowAddModal(false)}
          onPick={(type) => addBlock(type, addAtIndex)}
        />
      )}
    </div>
  );
}

function FloatingBlockToolbar({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onAddBelow,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddBelow: () => void;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-0.5 bg-[#0d0d0d] border border-[#262626] rounded-lg p-1 shadow-2xl"
    >
      <ToolbarBtn
        icon={ArrowUp}
        title="Subir bloco"
        onClick={onMoveUp}
        disabled={!canMoveUp}
      />
      <ToolbarBtn
        icon={ArrowDown}
        title="Descer bloco"
        onClick={onMoveDown}
        disabled={!canMoveDown}
      />
      <span className="w-px h-5 bg-[#262626] mx-0.5" />
      <ToolbarBtn icon={CopyIcon} title="Duplicar" onClick={onDuplicate} />
      <ToolbarBtn icon={Plus} title="Adicionar bloco abaixo" onClick={onAddBelow} />
      <span className="w-px h-5 bg-[#262626] mx-0.5" />
      <ToolbarBtn icon={Trash2} title="Excluir" onClick={onDelete} danger />
    </div>
  );
}

function ToolbarBtn({
  icon: Icon,
  title,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? "text-rose-300 hover:bg-rose-500/15"
          : "text-neutral-300 hover:text-white hover:bg-[#1a1a1a]"
      }`}
    >
      <Icon size={13} strokeWidth={2.2} />
    </button>
  );
}

function RowButton({
  icon: Icon,
  title,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-6 h-6 rounded-md flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed ${
        danger
          ? "text-rose-400 hover:bg-rose-500/15"
          : "text-neutral-500 hover:text-white hover:bg-[#161616]"
      }`}
    >
      <Icon size={11} strokeWidth={2.2} />
    </button>
  );
}

function SaveStatus({
  status,
  error,
  dirty,
}: {
  status: "idle" | "saving" | "saved" | "error";
  error: string | null;
  dirty: boolean;
}) {
  if (status === "saving") {
    return (
      <span className="text-xs text-neutral-400 font-medium inline-flex items-center gap-1">
        <Loader2 size={12} className="animate-spin" strokeWidth={2.2} />
        Salvando...
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="text-xs text-emerald-300 font-medium inline-flex items-center gap-1">
        <CheckCircle2 size={12} strokeWidth={2.2} />
        Salvo
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-xs text-rose-300 font-medium inline-flex items-center gap-1">
        <AlertCircle size={12} strokeWidth={2.2} />
        {error || "Erro"}
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="text-xs text-amber-300 font-medium inline-flex items-center gap-1">
        <AlertCircle size={12} strokeWidth={2.2} />
        Não salvo
      </span>
    );
  }
  return null;
}

function AddBlockModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (type: BlockType) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-1">Adicionar bloco</h3>
        <p className="text-xs text-neutral-500 mb-5">
          Escolha o tipo de seção pra inserir.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {(Object.keys(BLOCK_LABELS) as BlockType[]).map((type) => {
            const info = BLOCK_LABELS[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => onPick(type)}
                className="flex items-start gap-3 p-4 rounded-xl bg-[#0f0f0f] border border-[#1f1f1f] hover:border-blue-500/50 hover:bg-[#121212] transition text-left"
              >
                <span className="text-2xl shrink-0">{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {info.label}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    {info.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium text-neutral-400 hover:text-white hover:bg-[#161616] transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function blockPreview(block: Block): string {
  switch (block.type) {
    case "hero":
      return block.data.title || "(sem título)";
    case "testimonials":
      return `${block.data.items.length} depoimentos`;
    case "faq":
      return `${block.data.items.length} perguntas`;
    case "cta":
      return block.data.title || "(sem título)";
    case "pricing":
      return `${block.data.plans.length} planos`;
    case "text":
      return block.data.content.slice(0, 50) || "(vazio)";
    case "image":
      return block.data.alt || (block.data.src ? "imagem" : "(sem imagem)");
  }
}

// ─── Painel de edição por tipo de bloco ───────────────────────────

function BlockEditorPanel({
  block,
  onChange,
}: {
  block: Block;
  onChange: (data: Block["data"]) => void;
}) {
  const info = BLOCK_LABELS[block.type];

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-[#1f1f1f]">
        <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
          Editando
        </p>
        <h3 className="text-base font-bold text-white mt-1 inline-flex items-center gap-2">
          <span className="text-lg">{info.emoji}</span>
          {info.label}
        </h3>
      </div>

      <div className="px-5 py-5 space-y-4">
        {block.type === "hero" && (
          <HeroEditor data={block.data} onChange={(d) => onChange(d)} />
        )}
        {block.type === "testimonials" && (
          <TestimonialsEditor data={block.data} onChange={(d) => onChange(d)} />
        )}
        {block.type === "faq" && (
          <FAQEditor data={block.data} onChange={(d) => onChange(d)} />
        )}
        {block.type === "cta" && (
          <CTAEditor data={block.data} onChange={(d) => onChange(d)} />
        )}
        {block.type === "pricing" && (
          <PricingEditor data={block.data} onChange={(d) => onChange(d)} />
        )}
        {block.type === "text" && (
          <TextEditor data={block.data} onChange={(d) => onChange(d)} />
        )}
        {block.type === "image" && (
          <ImageEditor data={block.data} onChange={(d) => onChange(d)} />
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-1.5">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-neutral-600 mt-1 leading-relaxed">
          {hint}
        </span>
      )}
    </label>
  );
}

const inputClass =
  "w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-md px-2.5 py-1.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition";
const textareaClass = inputClass + " resize-none";

function HeroEditor({
  data,
  onChange,
}: {
  data: HeroData;
  onChange: (d: HeroData) => void;
}) {
  return (
    <>
      <Field label="Eyebrow (texto pequeno acima)">
        <input
          type="text"
          value={data.eyebrow ?? ""}
          onChange={(e) => onChange({ ...data, eyebrow: e.target.value })}
          className={inputClass}
          placeholder="Ex: CURSO EM DESTAQUE"
        />
      </Field>
      <Field label="Título principal">
        <textarea
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          rows={2}
          className={textareaClass}
        />
      </Field>
      <Field label="Subtítulo">
        <textarea
          value={data.subtitle ?? ""}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          rows={2}
          className={textareaClass}
        />
      </Field>
      <Field label="Imagem de fundo" hint="Cole uma URL ou envie do computador. Deixe vazio pra usar bg sólido.">
        <ImageInput
          value={data.backgroundImage ?? ""}
          onChange={(v) => onChange({ ...data, backgroundImage: v })}
        />
      </Field>
      <Field label="Texto do botão">
        <input
          type="text"
          value={data.ctaLabel ?? ""}
          onChange={(e) => onChange({ ...data, ctaLabel: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Link do botão">
        <input
          type="url"
          value={data.ctaUrl ?? ""}
          onChange={(e) => onChange({ ...data, ctaUrl: e.target.value })}
          className={inputClass}
          placeholder="https://..."
        />
      </Field>
      <Field label="Alinhamento">
        <select
          value={data.align}
          onChange={(e) =>
            onChange({ ...data, align: e.target.value as "left" | "center" })
          }
          className={inputClass}
        >
          <option value="center">Centralizado</option>
          <option value="left">Alinhado à esquerda</option>
        </select>
      </Field>
    </>
  );
}

function TestimonialsEditor({
  data,
  onChange,
}: {
  data: TestimonialsData;
  onChange: (d: TestimonialsData) => void;
}) {
  function updateItem(idx: number, patch: Partial<TestimonialsData["items"][number]>) {
    const items = data.items.map((it, i) =>
      i === idx ? { ...it, ...patch } : it
    );
    onChange({ ...data, items });
  }
  function addItem() {
    onChange({
      ...data,
      items: [
        ...data.items,
        { name: "Novo cliente", role: "", text: "Novo depoimento" },
      ],
    });
  }
  function removeItem(idx: number) {
    onChange({ ...data, items: data.items.filter((_, i) => i !== idx) });
  }
  return (
    <>
      <Field label="Eyebrow">
        <input
          type="text"
          value={data.eyebrow ?? ""}
          onChange={(e) => onChange({ ...data, eyebrow: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Título da seção">
        <input
          type="text"
          value={data.title ?? ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="space-y-3 border-t border-[#1f1f1f] pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
          Depoimentos ({data.items.length})
        </p>
        {data.items.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-rose-400 hover:text-rose-300 text-[10px] font-semibold"
              >
                Remover
              </button>
            </div>
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(idx, { name: e.target.value })}
              placeholder="Nome"
              className={inputClass}
            />
            <input
              type="text"
              value={item.role ?? ""}
              onChange={(e) => updateItem(idx, { role: e.target.value })}
              placeholder="Profissão / cargo"
              className={inputClass}
            />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold mb-1">
                Foto (opcional)
              </p>
              <ImageInput
                value={item.avatar ?? ""}
                onChange={(v) => updateItem(idx, { avatar: v })}
                placeholder="URL da foto"
              />
            </div>
            <textarea
              value={item.text}
              onChange={(e) => updateItem(idx, { text: e.target.value })}
              rows={3}
              placeholder="Depoimento"
              className={textareaClass}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="w-full px-3 py-2 rounded-md text-xs font-semibold bg-[#161616] border border-dashed border-[#262626] text-neutral-300 hover:text-white hover:border-neutral-500 transition"
        >
          + Adicionar depoimento
        </button>
      </div>
    </>
  );
}

function FAQEditor({
  data,
  onChange,
}: {
  data: FAQData;
  onChange: (d: FAQData) => void;
}) {
  function updateItem(idx: number, patch: Partial<FAQData["items"][number]>) {
    const items = data.items.map((it, i) =>
      i === idx ? { ...it, ...patch } : it
    );
    onChange({ ...data, items });
  }
  function addItem() {
    onChange({
      ...data,
      items: [
        ...data.items,
        { question: "Nova pergunta", answer: "Nova resposta" },
      ],
    });
  }
  function removeItem(idx: number) {
    onChange({ ...data, items: data.items.filter((_, i) => i !== idx) });
  }
  return (
    <>
      <Field label="Eyebrow">
        <input
          type="text"
          value={data.eyebrow ?? ""}
          onChange={(e) => onChange({ ...data, eyebrow: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Título da seção">
        <input
          type="text"
          value={data.title ?? ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="space-y-3 border-t border-[#1f1f1f] pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
          Perguntas ({data.items.length})
        </p>
        {data.items.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-rose-400 hover:text-rose-300 text-[10px] font-semibold"
              >
                Remover
              </button>
            </div>
            <input
              type="text"
              value={item.question}
              onChange={(e) => updateItem(idx, { question: e.target.value })}
              placeholder="Pergunta"
              className={inputClass}
            />
            <textarea
              value={item.answer}
              onChange={(e) => updateItem(idx, { answer: e.target.value })}
              rows={3}
              placeholder="Resposta"
              className={textareaClass}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="w-full px-3 py-2 rounded-md text-xs font-semibold bg-[#161616] border border-dashed border-[#262626] text-neutral-300 hover:text-white hover:border-neutral-500 transition"
        >
          + Adicionar pergunta
        </button>
      </div>
    </>
  );
}

function CTAEditor({
  data,
  onChange,
}: {
  data: CTAData;
  onChange: (d: CTAData) => void;
}) {
  return (
    <>
      <Field label="Título">
        <textarea
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          rows={2}
          className={textareaClass}
        />
      </Field>
      <Field label="Subtítulo">
        <textarea
          value={data.subtitle ?? ""}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          rows={2}
          className={textareaClass}
        />
      </Field>
      <Field label="Texto do botão">
        <input
          type="text"
          value={data.ctaLabel}
          onChange={(e) => onChange({ ...data, ctaLabel: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Link do botão">
        <input
          type="url"
          value={data.ctaUrl}
          onChange={(e) => onChange({ ...data, ctaUrl: e.target.value })}
          className={inputClass}
          placeholder="https://..."
        />
      </Field>
    </>
  );
}

function PricingEditor({
  data,
  onChange,
}: {
  data: PricingData;
  onChange: (d: PricingData) => void;
}) {
  function updatePlan(idx: number, patch: Partial<PricingData["plans"][number]>) {
    const plans = data.plans.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChange({ ...data, plans });
  }
  function updateFeatures(idx: number, raw: string) {
    const features = raw.split("\n").filter((l) => l.trim() !== "");
    updatePlan(idx, { features });
  }
  function addPlan() {
    onChange({
      ...data,
      plans: [
        ...data.plans,
        {
          name: "Novo plano",
          price: "R$ 0",
          features: ["Feature 1"],
          ctaLabel: "Quero",
          ctaUrl: "#",
        },
      ],
    });
  }
  function removePlan(idx: number) {
    onChange({ ...data, plans: data.plans.filter((_, i) => i !== idx) });
  }
  return (
    <>
      <Field label="Eyebrow">
        <input
          type="text"
          value={data.eyebrow ?? ""}
          onChange={(e) => onChange({ ...data, eyebrow: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Título da seção">
        <input
          type="text"
          value={data.title ?? ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="space-y-3 border-t border-[#1f1f1f] pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
          Planos ({data.plans.length})
        </p>
        {data.plans.map((plan, idx) => (
          <div
            key={idx}
            className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                #{idx + 1}
              </span>
              <button
                type="button"
                onClick={() => removePlan(idx)}
                className="text-rose-400 hover:text-rose-300 text-[10px] font-semibold"
              >
                Remover
              </button>
            </div>
            <input
              type="text"
              value={plan.name}
              onChange={(e) => updatePlan(idx, { name: e.target.value })}
              placeholder="Nome do plano"
              className={inputClass}
            />
            <input
              type="text"
              value={plan.price}
              onChange={(e) => updatePlan(idx, { price: e.target.value })}
              placeholder="Preço (ex: R$ 297)"
              className={inputClass}
            />
            <input
              type="text"
              value={plan.period ?? ""}
              onChange={(e) => updatePlan(idx, { period: e.target.value })}
              placeholder="Período (ex: à vista)"
              className={inputClass}
            />
            <textarea
              value={plan.features.join("\n")}
              onChange={(e) => updateFeatures(idx, e.target.value)}
              rows={4}
              placeholder="Uma feature por linha"
              className={textareaClass}
            />
            <input
              type="text"
              value={plan.ctaLabel}
              onChange={(e) => updatePlan(idx, { ctaLabel: e.target.value })}
              placeholder="Texto do botão"
              className={inputClass}
            />
            <input
              type="url"
              value={plan.ctaUrl}
              onChange={(e) => updatePlan(idx, { ctaUrl: e.target.value })}
              placeholder="Link do botão"
              className={inputClass}
            />
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={!!plan.highlight}
                onChange={(e) => updatePlan(idx, { highlight: e.target.checked })}
                className="accent-white"
              />
              Plano destacado
            </label>
          </div>
        ))}
        <button
          type="button"
          onClick={addPlan}
          className="w-full px-3 py-2 rounded-md text-xs font-semibold bg-[#161616] border border-dashed border-[#262626] text-neutral-300 hover:text-white hover:border-neutral-500 transition"
        >
          + Adicionar plano
        </button>
      </div>
    </>
  );
}

function TextEditor({
  data,
  onChange,
}: {
  data: TextData;
  onChange: (d: TextData) => void;
}) {
  return (
    <>
      <Field
        label="Texto"
        hint="Markdown básico: **negrito**, _itálico_, [link](url), ## H2, ### H3"
      >
        <textarea
          value={data.content}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          rows={10}
          className={textareaClass}
        />
      </Field>
      <Field label="Alinhamento">
        <select
          value={data.align}
          onChange={(e) =>
            onChange({ ...data, align: e.target.value as "left" | "center" })
          }
          className={inputClass}
        >
          <option value="left">Esquerda</option>
          <option value="center">Centralizado</option>
        </select>
      </Field>
    </>
  );
}

function ImageEditor({
  data,
  onChange,
}: {
  data: ImageData;
  onChange: (d: ImageData) => void;
}) {
  return (
    <>
      <Field label="Imagem" hint="Cole uma URL ou envie do computador">
        <ImageInput
          value={data.src}
          onChange={(v) => onChange({ ...data, src: v })}
        />
      </Field>
      <Field label="Texto alternativo (alt)">
        <input
          type="text"
          value={data.alt ?? ""}
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Legenda (opcional)">
        <input
          type="text"
          value={data.caption ?? ""}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
          className={inputClass}
        />
      </Field>
    </>
  );
}
