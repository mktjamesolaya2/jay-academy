"use client";

import { motion } from "motion/react";
import { Sparkles, Compass, ShoppingBag, MessageCircleHeart } from "lucide-react";
import { SceneFrame, SceneSubtitle, SceneTitle } from "./scene-frame";

const PILARES = [
  {
    icon: Compass,
    title: "Descoberta",
    description: "O aluno entra e explora cursos, técnicas e formações",
  },
  {
    icon: Sparkles,
    title: "Escolha",
    description: "Quiz, comparador e IA pra encontrar o curso ideal",
  },
  {
    icon: ShoppingBag,
    title: "Conversão",
    description: "Hotmart pra compra. WhatsApp pra atendimento humano",
  },
  {
    icon: MessageCircleHeart,
    title: "Suporte",
    description: "IA tira dúvida 24h. Equipe assume quando precisa de humano",
  },
];

export function SceneVirou() {
  return (
    <SceneFrame id="virou" eyebrow="O que ele virou" bg="gradient">
      <SceneTitle highlight="microsite educacional de vendas">
        Agora é um
      </SceneTitle>
      <SceneSubtitle>
        Mais que landing page. É uma jornada: home, páginas de curso, quiz, IA,
        WhatsApp e Hotmart — tudo conectado como uma plataforma.
      </SceneSubtitle>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-14 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      >
        {PILARES.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
              className="bg-[#0d0d0d]/80 backdrop-blur border border-[#1f1f1f] rounded-2xl p-5 md:p-6"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 shadow-lg shadow-pink-500/30 mb-4">
                <Icon size={16} strokeWidth={2.2} className="text-white" />
              </span>
              <h3 className="text-base md:text-lg font-semibold text-white tracking-tight">
                {p.title}
              </h3>
              <p className="mt-2 text-xs md:text-sm text-neutral-400 leading-relaxed">
                {p.description}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </SceneFrame>
  );
}
