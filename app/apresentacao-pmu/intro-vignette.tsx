"use client";

import { useEffect, useState } from "react";

/**
 * Vinheta de abertura — replica a do site /pmuclass.
 * Usa apenas <img> + CSS keyframes pra evitar qualquer problema
 * com motion/AnimatePresence ou gates de "ready".
 */
const LOGO_SRC = "/apresentacao-pmu/logo.jpg";

export function IntroVignette({ onDone }: { onDone?: () => void }) {
  const [logoSrc, setLogoSrc] = useState(LOGO_SRC);
  const [fading, setFading] = useState(false);

  // Tenta refinar o logo (remover fundo preto) em paralelo.
  // Se quebrar, fica com o JPG bruto.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = LOGO_SRC;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        const THRESHOLD = 45;
        for (let i = 0; i < px.length; i += 4) {
          const max = Math.max(px[i], px[i + 1], px[i + 2]);
          if (max < THRESHOLD) {
            px[i + 3] = 0;
          } else if (max < THRESHOLD + 40) {
            px[i + 3] = Math.round(((max - THRESHOLD) / 40) * 255);
          }
        }
        ctx.putImageData(data, 0, 0);
        setLogoSrc(canvas.toDataURL("image/png"));
      } catch {
        // tainted canvas — fica com a JPG mesmo
      }
    };
  }, []);

  // Fade-out + onDone depois de 2.6s
  useEffect(() => {
    const fadeStart = setTimeout(() => setFading(true), 2600);
    const done = setTimeout(() => onDone?.(), 3200);
    return () => {
      clearTimeout(fadeStart);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      style={{
        transition: "opacity 600ms ease-out",
        opacity: fading ? 0 : 1,
      }}
    >
      <style>{`
        @keyframes vignette-halo {
          0% { opacity: 0; transform: scale(0.6); }
          55% { opacity: 0.9; transform: scale(1.4); }
          100% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes vignette-logo-in {
          0% { opacity: 0; transform: scale(0.85); filter: brightness(0.3); }
          55% { opacity: 1; transform: scale(1); filter: brightness(1.2); }
          100% { opacity: 1; transform: scale(1); filter: brightness(1); }
        }
      `}</style>

      <div className="relative flex items-center justify-center">
        {/* Halo pink/orange */}
        <div
          aria-hidden
          className="absolute -inset-32 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(236,72,153,0.55) 0%, rgba(249,115,22,0.35) 40%, transparent 70%)",
            opacity: 0,
            transform: "scale(0.6)",
            animation: "vignette-halo 2200ms ease-out forwards",
          }}
        />

        {/* Logo */}
        <img
          src={logoSrc}
          alt="PMU CLASS"
          className="relative h-52 sm:h-72 lg:h-[22rem] w-auto object-contain drop-shadow-[0_0_60px_rgba(236,72,153,0.7)]"
          style={{
            opacity: 0,
            transform: "scale(0.85)",
            filter: "brightness(0.3)",
            animation: "vignette-logo-in 2000ms ease-out forwards",
          }}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setFading(true);
          setTimeout(() => onDone?.(), 600);
        }}
        className="absolute bottom-8 right-8 z-20 text-[10px] uppercase tracking-[0.3em] text-white/40 hover:text-white/80 transition"
      >
        Pular intro →
      </button>
    </div>
  );
}
