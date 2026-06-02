"use client";

import { motion } from "motion/react";
import { SceneFrame, SceneSubtitle, SceneTitle } from "./scene-frame";
import { SuggestionCard } from "./suggestion-card";
import { CHATGPT_SUGGESTIONS } from "./scenes-data";

const DOBRAS = [
  {
    title: "Hero / Vitrine principal",
    desc: "Curso em destaque, banner cinematográfico, identidade streaming",
  },
  {
    title: "Carrossel de cursos",
    desc: "Cards no estilo Netflix com capa, nome e CTA",
  },
  {
    title: "Catálogo por categoria",
    desc: "Iniciantes, sobrancelhas, lábios, formação avançada, presencial",
  },
  {
    title: "Sobre James Olaya",
    desc: "Trajetória, clínica, autoridade técnica internacional",
  },
  {
    title: "Banner promocional",
    desc: "Oferta em destaque, campanha do mês, CTA direto",
  },
  {
    title: "Quiz de perfil",
    desc: "Descobre o momento do aluno e indica trilha",
  },
  {
    title: "Prova social",
    desc: "Antes/depois, resultados, depoimentos, bastidores",
  },
  {
    title: "FAQ + CTA final",
    desc: "Quebra objeções e direciona pra compra ou WhatsApp",
  },
];

export function SceneVitrine() {
  return (
    <SceneFrame id="vitrine" eyebrow="A página principal" bg="subtle">
      <SceneTitle highlight="quem entra explora.">A home é um hub —</SceneTitle>
      <SceneSubtitle>
        9 dobras organizadas pra apresentar, educar, comparar e converter. Cada
        uma tem um papel claro na jornada.
      </SceneSubtitle>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-12 md:mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3"
      >
        {DOBRAS.map((d, i) => (
          <motion.div
            key={d.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.05 }}
            className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-1.5">
              Dobra {String(i + 1).padStart(2, "0")}
            </p>
            <h4 className="text-sm font-semibold text-white tracking-tight mb-1">
              {d.title}
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {d.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Sugestões do ChatGPT */}
      <div className="mt-14 md:mt-16 space-y-4">
        {CHATGPT_SUGGESTIONS.vitrine.map((s, i) => (
          <SuggestionCard key={i} suggestion={s} index={i} />
        ))}
      </div>
    </SceneFrame>
  );
}
