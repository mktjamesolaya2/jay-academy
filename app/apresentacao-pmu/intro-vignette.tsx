"use client";

import { motion } from "motion/react";

/**
 * Vinheta de abertura estilo Netflix "tudum".
 * Fundo preto, logo PMU CLASS aparece grande com pulse + gradient.
 *
 * Roda quando o usuário entra na cena de intro e some sozinha
 * com fade quando rola pra próxima.
 */
export function IntroVignette({ onDone }: { onDone?: () => void }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Glow de fundo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="w-[800px] h-[800px] max-w-[120vw] max-h-[120vw] rounded-full bg-gradient-to-br from-pink-500/20 via-orange-500/10 to-transparent blur-3xl" />
      </motion.div>

      {/* Logo "tudum" — duas linhas */}
      <div className="relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 16, letterSpacing: "0.05em" }}
          animate={{ opacity: 1, y: 0, letterSpacing: "0.5em" }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          className="text-[11px] md:text-[13px] uppercase tracking-[0.5em] text-white/60 font-medium mb-6 md:mb-8"
        >
          Jay Academy apresenta
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.7, filter: "blur(20px)" }}
          animate={{
            opacity: 1,
            scale: [0.7, 1.08, 1],
            filter: "blur(0px)",
          }}
          transition={{
            duration: 1.8,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.6,
          }}
          className="relative flex items-center justify-center"
        >
          <img
            src="/apresentacao-pmu/logo.png"
            alt="PMU CLASS"
            className="h-40 md:h-56 lg:h-64 w-auto drop-shadow-[0_20px_60px_rgba(236,72,153,0.35)]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.2 }}
          className="mt-6 md:mt-8 text-sm md:text-base text-neutral-400 tracking-[0.3em] uppercase"
        >
          O microsite educacional de vendas
        </motion.p>

        <motion.button
          type="button"
          onClick={onDone}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.2 }}
          className="mt-10 md:mt-14 inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white text-neutral-900 font-bold text-sm tracking-[0.18em] uppercase hover:bg-neutral-100 transition shadow-2xl shadow-pink-500/20"
        >
          Começar apresentação
        </motion.button>
      </div>

      {/* Hint pra rolar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/40"
      >
        ↓ Role ou use as setas
      </motion.div>
    </div>
  );
}
