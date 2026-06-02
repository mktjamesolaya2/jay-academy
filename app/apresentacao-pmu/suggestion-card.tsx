"use client";

import { motion } from "motion/react";
import { Lightbulb, ArrowRight } from "lucide-react";
import type { ChatGPTSuggestion } from "./scenes-data";

export function SuggestionCard({
  suggestion,
  index = 0,
}: {
  suggestion: ChatGPTSuggestion;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="bg-amber-500/[0.04] border border-amber-500/30 rounded-2xl p-5 md:p-6 space-y-3"
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Lightbulb size={16} strokeWidth={2.2} className="text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300/90 font-semibold mb-1">
            Sugestão do ChatGPT
          </p>
          <h3 className="text-lg md:text-xl font-serif font-light italic text-white tracking-tight leading-tight">
            {suggestion.title}
          </h3>
        </div>
      </div>

      {(suggestion.before || suggestion.after) && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
          {suggestion.before ? (
            <div className="bg-[#0a0a0a]/60 border border-white/[0.06] rounded-xl p-3.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-1.5">
                Hoje
              </p>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {suggestion.before}
              </p>
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
          <span className="hidden md:flex items-center justify-center text-amber-400/60">
            <ArrowRight size={18} strokeWidth={2} />
          </span>
          <div className="bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.08] border border-amber-500/25 rounded-xl p-3.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-300 font-semibold mb-1.5">
              Pode virar
            </p>
            <p className="text-sm text-white leading-relaxed font-medium">
              {suggestion.after}
            </p>
          </div>
        </div>
      )}

      {suggestion.rationale && (
        <p className="text-xs text-neutral-400 leading-relaxed italic pl-12">
          {suggestion.rationale}
        </p>
      )}
    </motion.div>
  );
}
