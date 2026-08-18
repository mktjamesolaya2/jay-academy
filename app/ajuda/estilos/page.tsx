import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { GRUPOS, type Atalho } from "@/components/ajuda-atalhos-dados";
import { Meandro } from "@/components/marca-jayo";

/**
 * Vitrine dos estilos de widget — **página de trabalho, não de aluna**.
 *
 * ⚠️ James pediu 10 layouts pra escolher. Descrever não resolve: ele decide
 * olhando. E mockup solto engana — o mesmo cartão muda completamente sobre o
 * preto da marca, com o ouro do lado e o Zeus atrás. Por isso a comparação
 * acontece aqui, no contexto de verdade.
 *
 * ⚠️ Mora sob `/ajuda` de propósito: é esse layout que carrega as fontes da
 * marca (`app/ajuda/layout.tsx`). Em outra rota, os 10 apareceriam em Inter e a
 * escolha seria feita em cima de uma tipografia que não é a da página.
 *
 * Fora do índice de busca. **Some assim que ele escolher um** — página de
 * comparação que sobrevive à decisão vira código morto que ninguém apaga.
 */

export const metadata: Metadata = {
  title: "Estilos · Ajuda",
  robots: { index: false, follow: false },
};

const ITENS: Atalho[] = [...GRUPOS[0].itens, ...GRUPOS[1].itens];
const TITULO = "Também por aqui";

/* ── 1. Atual ───────────────────────────────────────────────────────────── */
function E1() {
  return (
    <div className="rounded-3xl border border-[#AC9751]/20 bg-[#0d141b] p-3.5">
      <p className="px-2.5 text-[10px] font-medium uppercase tracking-[0.26em] text-[#AC9751]/75">
        {TITULO}
      </p>
      <Meandro id="e1" className="my-2.5 text-[#AC9751]/20" altura={7} />
      <div className="space-y-0.5">
        {ITENS.map((a) => (
          <span key={a.titulo} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
            <a.Icone size={16} strokeWidth={1.8} className="shrink-0 text-[#AC9751]/70" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-[#F4F1EA]/90">
                {a.titulo}
              </span>
              <span className="block truncate text-[11px] text-[#F4F1EA]/40">{a.descricao}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 2. Sem caixa, filetes entre os itens ───────────────────────────────── */
function E2() {
  return (
    <div className="px-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#AC9751]/75">
        {TITULO}
      </p>
      <div className="mt-3 divide-y divide-[#AC9751]/12">
        {ITENS.map((a) => (
          <span key={a.titulo} className="flex items-center gap-3 py-3">
            <a.Icone size={15} strokeWidth={1.6} className="shrink-0 text-[#AC9751]/60" />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] text-[#F4F1EA]/90">{a.titulo}</span>
              <span className="block truncate text-[11px] text-[#F4F1EA]/35">{a.descricao}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 3. Medalhões ───────────────────────────────────────────────────────── */
function E3() {
  return (
    <div className="rounded-3xl border border-[#AC9751]/20 bg-[#0d141b] p-4">
      <p className="text-center text-[10px] font-medium uppercase tracking-[0.26em] text-[#AC9751]/75">
        {TITULO}
      </p>
      <div className="mt-4 space-y-3">
        {ITENS.map((a) => (
          <span key={a.titulo} className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#AC9751]/45">
              <span className="absolute inset-[3px] rounded-full border border-[#AC9751]/20" />
              <a.Icone size={14} strokeWidth={1.8} className="text-[#AC9751]" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-[#F4F1EA]/90">
                {a.titulo}
              </span>
              <span className="block truncate text-[11px] text-[#F4F1EA]/40">{a.descricao}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 4. Vidro (deixa o Zeus atravessar) ─────────────────────────────────── */
function E4() {
  return (
    <div className="rounded-3xl border border-[#F4F1EA]/12 bg-[#F4F1EA]/[0.04] p-3.5 backdrop-blur-md">
      <p className="px-2.5 text-[10px] font-medium uppercase tracking-[0.26em] text-[#F4F1EA]/60">
        {TITULO}
      </p>
      <div className="mt-3 space-y-0.5">
        {ITENS.map((a) => (
          <span key={a.titulo} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
            <a.Icone size={16} strokeWidth={1.6} className="shrink-0 text-[#F4F1EA]/70" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-[#F4F1EA]">{a.titulo}</span>
              <span className="block truncate text-[11px] text-[#F4F1EA]/40">{a.descricao}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 5. Filete lateral + título serifado ────────────────────────────────── */
function E5() {
  return (
    <div className="border-l border-[#AC9751]/35 pl-4">
      <p className="font-[family-name:var(--font-marca)] text-[15px] text-[#F4F1EA]">{TITULO}</p>
      <div className="mt-3 space-y-3">
        {ITENS.map((a) => (
          <span key={a.titulo} className="block">
            <span className="block text-[13.5px] text-[#F4F1EA]/90">{a.titulo}</span>
            <span className="block text-[11px] text-[#AC9751]/60">{a.descricao}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 6. Numerado em serifada (Olimpo) ───────────────────────────────────── */
function E6() {
  return (
    <div className="rounded-3xl border border-[#AC9751]/20 bg-[#0d141b] p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#AC9751]/75">
        {TITULO}
      </p>
      <div className="mt-3.5 space-y-3.5">
        {ITENS.map((a, i) => (
          <span key={a.titulo} className="flex items-baseline gap-3">
            <span className="w-5 shrink-0 font-[family-name:var(--font-marca)] text-[15px] text-[#AC9751]/70">
              {["I", "II", "III", "IV", "V"][i]}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-[#F4F1EA]/90">{a.titulo}</span>
              <span className="block truncate text-[11px] text-[#F4F1EA]/40">{a.descricao}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 7. Botões cheios com seta ──────────────────────────────────────────── */
function E7() {
  return (
    <div>
      <p className="px-1 text-[10px] font-medium uppercase tracking-[0.26em] text-[#AC9751]/75">
        {TITULO}
      </p>
      <div className="mt-3 space-y-2">
        {ITENS.map((a) => (
          <span
            key={a.titulo}
            className="flex items-center gap-3 rounded-2xl border border-[#AC9751]/18 bg-[#AC9751]/[0.06] px-3.5 py-3"
          >
            <a.Icone size={16} strokeWidth={1.8} className="shrink-0 text-[#AC9751]" />
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#F4F1EA]">
              {a.titulo}
            </span>
            <ArrowUpRight size={14} strokeWidth={2} className="shrink-0 text-[#AC9751]/50" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 8. Grade de dois ───────────────────────────────────────────────────── */
function E8() {
  return (
    <div>
      <p className="px-1 text-[10px] font-medium uppercase tracking-[0.26em] text-[#AC9751]/75">
        {TITULO}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {ITENS.map((a) => (
          <span
            key={a.titulo}
            className="flex flex-col gap-2 rounded-2xl border border-[#AC9751]/18 bg-[#0d141b] px-3 py-3.5"
          >
            <a.Icone size={18} strokeWidth={1.6} className="text-[#AC9751]/80" />
            <span className="text-[12px] leading-snug text-[#F4F1EA]/90">{a.titulo}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 9. Tipográfico, sem ícone ──────────────────────────────────────────── */
function E9() {
  return (
    <div className="rounded-3xl border border-[#AC9751]/15 bg-[#0d141b]/70 p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-[#AC9751]/75">
        {TITULO}
      </p>
      <Meandro id="e9" className="my-3 text-[#AC9751]/20" altura={7} />
      <div className="space-y-3">
        {ITENS.map((a) => (
          <span
            key={a.titulo}
            className="block font-[family-name:var(--font-marca)] text-[15px] leading-snug text-[#F4F1EA]/85"
          >
            {a.titulo}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 10. Faixa dourada no topo ──────────────────────────────────────────── */
function E10() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#AC9751]/25 bg-[#0d141b]">
      <p className="bg-[#AC9751] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#101820]">
        {TITULO}
      </p>
      <div className="space-y-0.5 p-3">
        {ITENS.map((a) => (
          <span key={a.titulo} className="flex items-center gap-3 rounded-xl px-2.5 py-2">
            <a.Icone size={16} strokeWidth={1.8} className="shrink-0 text-[#AC9751]/70" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-[#F4F1EA]/90">
                {a.titulo}
              </span>
              <span className="block truncate text-[11px] text-[#F4F1EA]/40">{a.descricao}</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const ESTILOS = [
  { n: 1, nome: "Atual", nota: "Caixa + meandro + ícone", C: E1 },
  { n: 2, nome: "Sem caixa", nota: "Filetes entre os itens; mais leve", C: E2 },
  { n: 3, nome: "Medalhões", nota: "Ícone dentro do anel da marca", C: E3 },
  { n: 4, nome: "Vidro", nota: "Translúcido — o Zeus atravessa", C: E4 },
  { n: 5, nome: "Filete lateral", nota: "Título serifado, sem moldura", C: E5 },
  { n: 6, nome: "Numerado", nota: "Algarismo romano no lugar do ícone", C: E6 },
  { n: 7, nome: "Botões", nota: "Cada item é um botão com seta", C: E7 },
  { n: 8, nome: "Grade", nota: "Duas colunas; ocupa menos altura", C: E8 },
  { n: 9, nome: "Tipográfico", nota: "Só o nome, em serifada", C: E9 },
  { n: 10, nome: "Faixa dourada", nota: "Título invertido sobre ouro", C: E10 },
];

export default function EstilosPage() {
  return (
    <main className="relative min-h-[100dvh] bg-[#101820] px-6 py-10 font-[family-name:var(--font-corpo)]">
      {/* O mesmo Zeus da página de verdade: sem ele, o estilo "Vidro" seria
          julgado sobre um fundo que não existe. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/laser/assets/zeus-BWpgiY3L.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-0 top-0 z-0 hidden h-full w-auto lg:block"
        style={{
          objectFit: "contain",
          objectPosition: "left center",
          opacity: 0.45,
          maskImage:
            "linear-gradient(to right, black 0%, black 18%, rgba(0,0,0,0.5) 45%, transparent 75%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black 18%, rgba(0,0,0,0.5) 45%, transparent 75%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)",
        }}
      />

      <header className="relative z-10 mx-auto mb-9 max-w-6xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#AC9751]">
          Jay Academy
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-marca)] text-[26px] text-[#F4F1EA]">
          10 estilos pros widgets
        </h1>
        <p className="mt-1.5 text-[13.5px] text-[#F4F1EA]/45">
          Mesma paleta, mesmas fontes e o mesmo fundo da página de verdade. Me diz o número.
        </p>
      </header>

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ESTILOS.map(({ n, nome, nota, C }) => (
          <section key={n}>
            <div className="mb-2.5 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-marca)] text-[18px] text-[#AC9751]">
                {n}
              </span>
              <span className="text-[13px] font-medium text-[#F4F1EA]">{nome}</span>
            </div>
            <p className="mb-3 text-[11.5px] leading-relaxed text-[#F4F1EA]/35">{nota}</p>
            <C />
          </section>
        ))}
      </div>
    </main>
  );
}
