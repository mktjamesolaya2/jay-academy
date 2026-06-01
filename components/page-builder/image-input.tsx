"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X, AlertCircle } from "lucide-react";
import { uploadImageAction } from "@/app/wp-pages/[domain]/[slug]/edit/upload-action";

/**
 * Campo de imagem que aceita URL OU upload do computador.
 * Reusa a mesma Server Action do editor WP (upload-action.ts) — vai
 * pro Vercel Blob em prod, filesystem em dev.
 */
export function ImageInput({
  value,
  onChange,
  placeholder = "https://...",
}: {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadImageAction(fd);
      if (res.ok) {
        onChange(res.url);
      } else {
        setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  function openPicker() {
    fileInputRef.current?.click();
  }

  function clear() {
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] rounded-md px-2.5 py-1.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
        />
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          title="Enviar do computador"
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#161616] border border-[#1f1f1f] hover:border-neutral-700 hover:text-white text-neutral-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 size={13} strokeWidth={2.2} className="animate-spin" />
          ) : (
            <Upload size={13} strokeWidth={2.2} />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-[11px] text-rose-300 font-medium inline-flex items-center gap-1">
          <AlertCircle size={11} strokeWidth={2.4} />
          {error}
        </p>
      )}

      {value && !uploading && (
        <div className="relative inline-block">
          <img
            src={value}
            alt=""
            className="max-h-20 rounded border border-[#1f1f1f]"
            onError={() => setError("Não consegui carregar essa imagem")}
          />
          <button
            type="button"
            onClick={clear}
            title="Remover imagem"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-400 text-white inline-flex items-center justify-center transition"
          >
            <X size={11} strokeWidth={2.4} />
          </button>
        </div>
      )}
    </div>
  );
}
