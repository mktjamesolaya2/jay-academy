"use client";

import { useState } from "react";
import Link from "next/link";
import { Images, X, Loader2, ImagePlus } from "lucide-react";
import { listMediaImagesAction } from "@/app/midia/actions";
import type { MediaItem } from "@/lib/media-types";

/**
 * Botão "Biblioteca" + modal que mostra as imagens da biblioteca de mídia.
 * Ao clicar numa imagem, chama onPick(url) e fecha.
 */
export function MediaPicker({
  onPick,
  className,
  label = "Biblioteca",
  compact = false,
}: {
  onPick: (url: string) => void;
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function openModal() {
    setOpen(true);
    if (items === null) {
      setLoading(true);
      try {
        setItems(await listMediaImagesAction());
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        title="Escolher da biblioteca"
        className={
          className ??
          (compact
            ? "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#161616] border border-[#1f1f1f] hover:border-neutral-700 hover:text-white text-neutral-300 transition"
            : "inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#161616] border border-[#1f1f1f] hover:border-neutral-700 hover:text-white text-neutral-300 text-sm font-semibold transition")
        }
      >
        <Images size={compact ? 13 : 14} strokeWidth={2.2} />
        {!compact && label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 py-8 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl max-w-3xl w-full shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#1f1f1f]">
              <h3 className="text-base font-semibold text-white">
                Escolher da biblioteca
              </h3>
              <div className="flex items-center gap-3">
                <Link
                  href="/midia"
                  target="_blank"
                  className="text-[11px] font-semibold text-neutral-400 hover:text-white transition"
                >
                  Abrir biblioteca ↗
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="text-neutral-500 hover:text-white transition"
                  aria-label="Fechar"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="py-16 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-neutral-500" />
                </div>
              ) : !items || items.length === 0 ? (
                <div className="py-14 text-center">
                  <ImagePlus
                    size={24}
                    strokeWidth={1.6}
                    className="mx-auto text-neutral-600 mb-3"
                  />
                  <p className="text-neutral-300 font-semibold text-sm">
                    Nenhuma imagem na biblioteca ainda
                  </p>
                  <Link
                    href="/midia"
                    target="_blank"
                    className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mt-4"
                  >
                    <ImagePlus size={13} strokeWidth={2.4} />
                    Enviar imagens
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto">
                  {items.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onPick(m.url);
                        setOpen(false);
                      }}
                      title={m.name}
                      className="group rounded-lg overflow-hidden border border-[#1f1f1f] hover:border-white transition"
                    >
                      <span className="block aspect-square bg-[#161616] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.url}
                          alt={m.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </span>
                      <span className="block text-[10px] text-neutral-400 truncate px-1.5 py-1">
                        {m.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
