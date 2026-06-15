"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Clock, X, Loader2 } from "lucide-react";
import { scheduleAction } from "@/app/wp-pages/manage-actions";
import { formatDateTimeBR } from "@/lib/format-date";

export function ScheduleControl({
  domain,
  slug,
  mode,
  current,
}: {
  domain: string;
  slug: string;
  mode: "publish" | "unpublish";
  current?: string;
}) {
  const [when, setWhen] = useState("");
  const [isPending, startTransition] = useTransition();
  const isPublish = mode === "publish";

  function submit(clear: boolean) {
    const fd = new FormData();
    fd.set("domain", domain);
    fd.set("slug", slug);
    fd.set("mode", mode);
    if (clear) fd.set("clear", "1");
    else fd.set("when", when);
    startTransition(() => scheduleAction(fd));
  }

  if (current) {
    return (
      <div className="flex items-center justify-between gap-3 bg-violet-500/5 border border-violet-500/25 rounded-lg px-3 py-2.5">
        <div className="flex items-start gap-2 min-w-0">
          <Clock size={13} strokeWidth={2.2} className="text-violet-300 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-violet-200">
              {isPublish ? "Publica" : "Despublica"} automaticamente
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              em {formatDateTimeBR(current)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={isPending}
          title="Cancelar agendamento"
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white transition"
        >
          {isPending ? (
            <Loader2 size={11} className="animate-spin" strokeWidth={2.4} />
          ) : (
            <X size={12} strokeWidth={2.4} />
          )}
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5">
        <CalendarClock size={12} strokeWidth={2.4} />
        {isPublish ? "Agendar publicação" : "Agendar despublicação"}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-neutral-600 [color-scheme:dark]"
        />
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={!when || isPending}
          className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" strokeWidth={2.4} />
          ) : (
            <CalendarClock size={13} strokeWidth={2.2} />
          )}
          Agendar
        </button>
      </div>
      <p className="text-[11px] text-neutral-600 mt-1.5">
        {isPublish
          ? "A página é publicada sozinha na data marcada."
          : "A página sai do ar sozinha na data marcada."}
      </p>
    </div>
  );
}
