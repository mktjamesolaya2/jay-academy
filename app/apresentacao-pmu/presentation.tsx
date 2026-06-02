"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, Menu, X } from "lucide-react";
import { IntroVignette } from "./intro-vignette";
import { SceneFrame, SceneSubtitle, SceneTitle } from "./scene-frame";
import { SceneAntes } from "./scene-antes";
import { SceneVirou } from "./scene-virou";
import { SceneConceito } from "./scene-conceito";
import { SceneVitrine } from "./scene-vitrine";
import { SCENES, type SceneId } from "./scenes-data";

export function Presentation() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollToScene(idx: number) {
    const next = Math.max(0, Math.min(SCENES.length - 1, idx));
    const el = document.getElementById(SCENES[next].id);
    if (el && containerRef.current) {
      containerRef.current.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    }
  }

  // Detecta cena visível
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id as SceneId;
            const idx = SCENES.findIndex((s) => s.id === id);
            if (idx >= 0) setCurrentIdx(idx);
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      }
    );
    SCENES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Atalhos de teclado: setas, espaço, números
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA"
      )
        return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        scrollToScene(currentIdx + 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToScene(currentIdx - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToScene(0);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToScene(SCENES.length - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIdx]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white">
      {/* Container scrollável com snap */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Cena 0 — Vinheta */}
        <section
          id="intro"
          className="relative min-h-screen w-full snap-start bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
        >
          <IntroVignette onDone={() => scrollToScene(1)} />
        </section>

        {/* Cenas 1-4 */}
        <SceneAntes />
        <SceneVirou />
        <SceneConceito />
        <SceneVitrine />

        {/* Placeholder pras próximas (5-9) — vou adicionar em outro batch */}
        <SceneFrame id="cursos" eyebrow="Próximas cenas" bg="subtle">
          <SceneTitle>
            Cenas 5 a 9 chegam{" "}
            <em className="italic bg-gradient-to-r from-pink-400 to-orange-500 bg-clip-text text-transparent">
              em seguida
            </em>
            .
          </SceneTitle>
          <SceneSubtitle>
            Páginas de curso · Caminhos do aluno · Quiz/IA/WhatsApp ·
            Diferenciais · Conclusão. Quer ajustar algo antes de eu seguir?
          </SceneSubtitle>
        </SceneFrame>
        <section id="caminhos" className="min-h-screen w-full snap-start" />
        <section id="ferramentas" className="min-h-screen w-full snap-start" />
        <section id="diferenciais" className="min-h-screen w-full snap-start" />
        <section id="fim" className="min-h-screen w-full snap-start" />
      </div>

      {/* Barra fixa lateral: progresso */}
      <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-2 hidden md:flex">
        {SCENES.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollToScene(idx)}
            title={s.label}
            className={`w-1.5 rounded-full transition-all ${
              idx === currentIdx
                ? "h-8 bg-gradient-to-b from-pink-500 to-orange-500"
                : "h-1.5 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={s.label}
          />
        ))}
      </div>

      {/* Botões navegação */}
      <div className="fixed bottom-4 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => scrollToScene(currentIdx - 1)}
          disabled={currentIdx === 0}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur border border-white/15 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
          aria-label="Cena anterior"
        >
          <ChevronUp size={18} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => scrollToScene(currentIdx + 1)}
          disabled={currentIdx === SCENES.length - 1}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur border border-white/15 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
          aria-label="Próxima cena"
        >
          <ChevronDown size={18} strokeWidth={2.2} />
        </button>
      </div>

      {/* Menu */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="fixed top-4 md:top-6 left-4 md:left-6 z-50 w-11 h-11 rounded-full bg-white/10 backdrop-blur border border-white/15 text-white hover:bg-white/20 transition flex items-center justify-center"
        aria-label="Menu"
      >
        <Menu size={16} strokeWidth={2.2} />
      </button>

      {/* Indicador top-right: cena atual */}
      <div className="fixed top-4 md:top-6 right-4 md:right-6 z-40 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur border border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/70 font-medium">
        {String(currentIdx + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/60 font-semibold">
                Cenas
              </p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
                aria-label="Fechar"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>
            <div className="space-y-1">
              {SCENES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    scrollToScene(idx);
                    setMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-4 transition ${
                    idx === currentIdx
                      ? "bg-gradient-to-r from-pink-500/15 to-orange-500/15 border border-pink-500/30"
                      : "border border-white/5 hover:bg-white/[0.04] hover:border-white/15"
                  }`}
                >
                  <span
                    className={`text-xs font-mono ${
                      idx === currentIdx ? "text-pink-400" : "text-white/40"
                    }`}
                  >
                    {String(idx).padStart(2, "0")}
                  </span>
                  <span
                    className={`text-base font-medium ${
                      idx === currentIdx ? "text-white" : "text-white/80"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-white/30 text-center">
              ↑ ↓ ← → · Espaço · clique nos pontinhos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
