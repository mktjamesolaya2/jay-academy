"use client";

import { ExternalLink } from "lucide-react";

export function SiteUrlLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-blue-400 transition truncate"
    >
      {url}
      <ExternalLink size={10} strokeWidth={2.2} className="shrink-0" />
    </a>
  );
}
