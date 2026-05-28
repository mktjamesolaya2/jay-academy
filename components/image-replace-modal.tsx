"use client";

import { useState } from "react";
import { X, Upload, Link as LinkIcon, Loader2, Check } from "lucide-react";
import { uploadImageAction } from "@/app/wp-pages/[domain]/[slug]/edit/upload-action";

export type SelectedImage = {
  currentSrc: string;
  alt: string;
  width: number;
  height: number;
};

type Tab = "url" | "upload";

export function ImageReplaceModal({
  image,
  onClose,
  onReplace,
}: {
  image: SelectedImage;
  onClose: () => void;
  onReplace: (newSrc: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleUrlPreview() {
    setError(null);
    if (!url.trim()) {
      setError("Cole uma URL primeiro");
      return;
    }
    setPreviewSrc(url.trim());
  }

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadImageAction(formData);
      if (result.ok) {
        setPreviewSrc(result.url);
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  function handleConfirm() {
    if (!previewSrc) return;
    onReplace(previewSrc);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-[#1f1f1f]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              Trocar imagem
            </p>
            <h3 className="text-xl font-semibold text-white tracking-[-0.02em] mt-1">
              {image.alt || "Imagem sem descrição"}
            </h3>
            <p className="text-[11px] text-neutral-500 font-mono mt-1 truncate max-w-md">
              {image.currentSrc}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition"
            aria-label="Fechar"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 pt-5 pb-2 flex items-center gap-1 border-b border-[#1f1f1f]">
          <TabButton active={tab === "url"} onClick={() => setTab("url")}>
            <LinkIcon size={13} strokeWidth={2.2} />
            URL externa
          </TabButton>
          <TabButton active={tab === "upload"} onClick={() => setTab("upload")}>
            <Upload size={13} strokeWidth={2.2} />
            Upload local
          </TabButton>
        </div>

        <div className="px-6 py-5 space-y-4">
          {tab === "url" ? (
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold block">
                Cole o link da nova imagem
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
                />
                <button
                  type="button"
                  onClick={handleUrlPreview}
                  className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                >
                  Carregar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold block">
                Selecione uma imagem do computador
              </label>
              <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-[#262626] hover:border-neutral-600 rounded-lg px-4 py-8 cursor-pointer transition bg-[#0a0a0a]">
                {uploading ? (
                  <>
                    <Loader2
                      size={20}
                      strokeWidth={2}
                      className="animate-spin text-neutral-400"
                    />
                    <span className="text-sm text-neutral-400">
                      Enviando...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={20} strokeWidth={1.8} className="text-neutral-400" />
                    <span className="text-sm text-neutral-300 font-medium">
                      Click pra escolher arquivo
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      JPG, PNG, GIF, WEBP até 10MB
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
              </label>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-300 font-medium">{error}</p>
          )}

          {previewSrc && (
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-2">
                Preview da nova imagem
              </p>
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg p-3">
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="max-w-full max-h-64 mx-auto rounded"
                  onError={() => setError("Não consegui carregar essa imagem")}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-3 border-t border-[#1f1f1f] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-neutral-500 hover:text-white transition px-4 py-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!previewSrc}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={14} strokeWidth={2.5} />
            Trocar imagem
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white border-b-2 border-white -mb-px"
          : "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-300 border-b-2 border-transparent -mb-px"
      }
    >
      {children}
    </button>
  );
}
