"use client";

import { motion } from "motion/react";
import { SceneFrame, SceneSubtitle, SceneTitle } from "./scene-frame";

const ANALOGY = [
  { from: "Filme", to: "Curso" },
  { from: "Série", to: "Formação" },
  { from: "Trailer", to: "Prévia da técnica" },
  { from: "Capa", to: "Card visual" },
  { from: "Categoria", to: "Trilha de aprendizagem" },
  { from: "Recomendado pra você", to: "Quiz de indicação" },
  { from: "Assistir agora", to: "Começar formação" },
];

export function SceneConceito() {
  return (
    <SceneFrame id="conceito" eyebrow="O conceito criativo" bg="default">
      <SceneTitle highlight="Netflix dos cursos do James.">É a</SceneTitle>
      <SceneSubtitle>
        Familiar pro aluno. Premium pra marca. Em vez de empurrar venda, criou
        vitrine. Em vez de explicar curso, deixou o catálogo falar.
      </SceneSubtitle>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-14 md:mt-16 max-w-3xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
          {ANALOGY.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
              className="flex items-center gap-3 py-2"
            >
              <span className="text-sm md:text-base text-neutral-500 font-medium min-w-[120px] md:min-w-[140px]">
                {a.from}
              </span>
              <span className="text-neutral-700">→</span>
              <span className="text-sm md:text-base font-serif italic bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent font-medium">
                {a.to}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="mt-12 md:mt-14 text-center text-base md:text-lg font-serif italic text-white/90 max-w-2xl mx-auto leading-relaxed"
        style={{ textWrap: "balance" }}
      >
        &ldquo;A escolha do formato streaming foi estratégica: transforma cursos
        numa vitrine visual, familiar e navegável, aumentando exploração e
        percepção de valor antes da decisão de compra.&rdquo;
      </motion.p>
    </SceneFrame>
  );
}
