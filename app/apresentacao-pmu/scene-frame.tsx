"use client";

import { motion } from "motion/react";

/**
 * Wrapper de cena. Cada cena ocupa 100vh e tem fade-in suave
 * quando entra na viewport.
 */
export function SceneFrame({
  id,
  eyebrow,
  children,
  bg = "default",
}: {
  id: string;
  eyebrow?: string;
  children: React.ReactNode;
  bg?: "default" | "subtle" | "gradient";
}) {
  return (
    <section
      id={id}
      className={`relative min-h-screen w-full snap-start flex items-center justify-center px-6 py-20 md:py-24 overflow-hidden ${
        bg === "gradient"
          ? "bg-gradient-to-b from-[#0a0a0a] via-[#0d0a14] to-[#0a0a0a]"
          : bg === "subtle"
          ? "bg-[#0c0c0c]"
          : "bg-[#0a0a0a]"
      }`}
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 mb-10 md:mb-14"
          >
            <span className="block w-10 h-px bg-gradient-to-r from-pink-500 to-orange-500" />
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-white/70 font-medium">
              {eyebrow}
            </span>
            <span className="block w-10 h-px bg-gradient-to-l from-pink-500 to-orange-500" />
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}

export function SceneTitle({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: React.ReactNode;
}) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.7, delay: 0.1 }}
      className="font-serif font-light text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-white text-center"
      style={{ textWrap: "balance" }}
    >
      {children}
      {highlight && (
        <>
          {" "}
          <em className="italic inline-block bg-gradient-to-r from-pink-400 via-pink-500 to-orange-500 bg-clip-text text-transparent pr-2 lg:pr-3 not-italic-fix">
            {highlight}
          </em>
        </>
      )}
    </motion.h2>
  );
}

export function SceneSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.6, delay: 0.25 }}
      className="mt-8 md:mt-10 text-base md:text-xl text-neutral-300 leading-relaxed max-w-3xl mx-auto text-center"
      style={{ textWrap: "balance" }}
    >
      {children}
    </motion.p>
  );
}
