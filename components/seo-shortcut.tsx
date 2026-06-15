"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { SeoEditor } from "./seo-editor";

type Initial = {
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  seoCanonical?: string;
  seoNoIndex?: boolean;
};

type Props = {
  domain: string;
  slug: string;
  initialSlug: string;
  pageTitle: string;
  initial: Initial;
};

export function SeoShortcut(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left flex items-start gap-3 p-3 rounded-lg border border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#121212] transition"
      >
        <Search size={14} strokeWidth={2} className="text-neutral-500 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white">SEO da página</p>
          <p className="text-[11px] text-neutral-500 truncate font-medium">
            Google + compartilhamento
          </p>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 py-8 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl max-w-4xl w-full shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#1f1f1f] sticky top-0 bg-[#0f0f0f] rounded-t-2xl z-10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                  SEO da página
                </p>
                <h3 className="text-base font-semibold text-white mt-0.5">
                  Como aparece no Google e ao compartilhar
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-500 hover:text-white transition"
                aria-label="Fechar"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="p-6">
              <SeoEditor {...props} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
