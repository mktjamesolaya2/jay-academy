"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * Vinheta de abertura — exatamente a mesma do site /pmuclass.
 *
 * - 2.6s de animação (halo + scale-in + brightness-in)
 * - Logo é processado em <canvas> pra remover o fundo preto
 *   (mesma técnica do App.tsx do PMU CLASS)
 * - Auto-fade no final, depois chama onDone pra rolar pra cena 1
 */
const LOGO_SRC = "/apresentacao-pmu/logo.jpg";

export function IntroVignette({ onDone }: { onDone?: () => void }) {
  const [logoSrc, setLogoSrc] = useState(LOGO_SRC);
  const [logoReady, setLogoReady] = useState(false);
  const [show, setShow] = useState(true);

  // Mesma técnica do site PMU CLASS: tira pixels pretos do logo PNG
  // pra ele "flutuar" sobre o fundo preto sem retângulo visível.
  // Se algo falhar (CORS, ctx, etc), usa o logo original direto — não
  // bloqueia a apresentação.
  useEffect(() => {
    // Timeout defensivo: se nada acontecer em 1.5s, libera mesmo assim
    const fallback = setTimeout(() => setLogoReady(true), 1500);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = LOGO_SRC;
    img.onerror = () => {
      clearTimeout(fallback);
      setLogoReady(true);
    };
    img.onload = () => {
      clearTimeout(fallback);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setLogoReady(true);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        const THRESHOLD = 45;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i];
          const g = px[i + 1];
          const b = px[i + 2];
          const max = Math.max(r, g, b);
          if (max < THRESHOLD) {
            px[i + 3] = 0;
          } else if (max < THRESHOLD + 40) {
            px[i + 3] = Math.round(((max - THRESHOLD) / 40) * 255);
          }
        }
        ctx.putImageData(data, 0, 0);
        setLogoSrc(canvas.toDataURL("image/png"));
      } catch {
        // getImageData/toDataURL pode tainted-canvas se CORS falhar.
        // Não tem problema: logo já tem fundo preto, mistura natural com a tela.
      }
      setLogoReady(true);
    };

    return () => clearTimeout(fallback);
  }, []);

  // Auto-fade depois de 2.6s (mesma duração do site)
  useEffect(() => {
    if (!logoReady) return;
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [logoReady]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <AnimatePresence
        onExitComplete={() => {
          // Após o fade-out terminar, vai pra próxima cena
          onDone?.();
        }}
      >
        {show && logoReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: [0, 0.9, 0.6], scale: [0.6, 1.4, 1.2] }}
                transition={{ duration: 2.2, times: [0, 0.55, 1], ease: "easeOut" }}
                className="absolute inset-0 -m-32 rounded-full blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(236,72,153,0.55) 0%, rgba(249,115,22,0.35) 40%, transparent 70%)",
                }}
              />
              <motion.img
                src={logoSrc}
                alt="PMU CLASS"
                initial={{ filter: "brightness(0.3)" }}
                animate={{
                  filter: ["brightness(0.3)", "brightness(1.2)", "brightness(1)"],
                }}
                transition={{ duration: 2, times: [0, 0.55, 1] }}
                className="relative h-52 sm:h-72 lg:h-[22rem] w-auto object-contain drop-shadow-[0_0_60px_rgba(236,72,153,0.7)]"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão pra pular se já viu */}
      {show && (
        <button
          type="button"
          onClick={() => setShow(false)}
          className="absolute bottom-8 right-8 z-20 text-[10px] uppercase tracking-[0.3em] text-white/40 hover:text-white/80 transition"
        >
          Pular intro →
        </button>
      )}
    </div>
  );
}
