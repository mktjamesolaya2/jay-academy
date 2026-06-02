"use client";

import { motion } from "motion/react";
import { MessageCircle, ArrowDown } from "lucide-react";
import { SceneFrame, SceneSubtitle, SceneTitle } from "./scene-frame";

export function SceneAntes() {
  return (
    <SceneFrame id="antes" eyebrow="O ponto de partida" bg="subtle">
      <SceneTitle>
        Antes,{" "}
        <em className="italic bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent inline-block pr-2 lg:pr-3">
          o link da bio
        </em>{" "}
        era só um atalho.
      </SceneTitle>
      <SceneSubtitle>
        O usuário clicava e caía direto no WhatsApp — sem entender os cursos,
        sem comparar opções, sem saber por onde começar.
      </SceneSubtitle>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-14 md:mt-16 max-w-md mx-auto"
      >
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/30 to-orange-500/30 ring-1 ring-white/10" />
            <div>
              <p className="text-sm font-semibold text-white">@jamesolaya</p>
              <p className="text-[11px] text-neutral-500">Link da bio</p>
            </div>
          </div>
          <div className="flex justify-center py-3">
            <ArrowDown
              size={20}
              strokeWidth={2}
              className="text-neutral-600 animate-bounce"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/25">
            <MessageCircle
              size={18}
              strokeWidth={2}
              className="text-emerald-300 shrink-0"
            />
            <p className="text-sm text-emerald-200 font-medium">
              WhatsApp direto
            </p>
          </div>
          <p className="text-xs text-neutral-500 text-center pt-2 leading-relaxed">
            Sem jornada. Sem prova social. Sem comparar cursos.
            <br />
            <span className="text-neutral-400">Compra ou nada.</span>
          </p>
        </div>
      </motion.div>
    </SceneFrame>
  );
}
