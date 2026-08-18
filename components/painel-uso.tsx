"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { nivel, percentual, recado, type Nivel } from "@/lib/uso-ia";

/**
 * A coluna da esquerda do suporte: o que precisa de olho, sempre à vista.
 *
 * ⚠️ Ela se atualiza sozinha porque o motivo dela existir é *ficar aberta*.
 * Um número que só muda quando alguém aperta F5 não avisa nada — e o que ele
 * está esperando ver é justamente a hora em que a cota acaba.
 */

const CORES: Record<Nivel, { barra: string; texto: string; borda: string }> = {
  tranquilo: { barra: "bg-[#AC9751]", texto: "text-neutral-400", borda: "border-[#1f1f1f]" },
  chegando: { barra: "bg-amber-400", texto: "text-amber-300", borda: "border-amber-500/25" },
  estourou: { barra: "bg-rose-500", texto: "text-rose-300", borda: "border-rose-500/30" },
};

type Dados = { usadas: number; limite: number; estourou: boolean; emails: number };

export function PainelUso({ inicial }: { inicial: Dados }) {
  const [d, setD] = useState(inicial);

  useEffect(() => {
    // 30s: rápido o bastante pra ele ver acontecer, devagar o bastante pra não
    // virar uma chamada por segundo numa aba que fica aberta o dia todo.
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/suporte/uso");
        if (r.ok) setD(await r.json());
      } catch {
        // Rede oscilou. Fica com o último número em vez de zerar a tela.
      }
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const n = nivel(d.usadas, d.limite, d.estourou);
  const c = CORES[n];

  return (
    <aside className="w-full shrink-0 space-y-3 lg:w-[230px]">
      <div className={`rounded-xl border ${c.borda} bg-[#0d0d0d] px-4 py-3.5`}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
          Mensagens da IA
        </p>
        <p className="mt-1.5 text-[19px] font-semibold leading-none text-white">
          {d.usadas}
          <span className="text-[13px] font-normal text-neutral-600"> de {d.limite}</span>
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#1a1a1a]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${c.barra}`}
            style={{ width: `${percentual(d.usadas, d.limite)}%` }}
          />
        </div>
        <p className={`mt-2 text-[11.5px] leading-relaxed ${c.texto}`}>
          {recado(d.usadas, d.limite, d.estourou)}
        </p>
      </div>

      <Link
        href="/suporte/reenvios"
        className={`block rounded-xl border px-4 py-3.5 transition ${
          d.emails > 0
            ? "border-amber-500/25 bg-amber-500/[0.04] hover:border-amber-500/45"
            : "border-[#1f1f1f] bg-[#0d0d0d] hover:border-[#2e2e2e]"
        }`}
      >
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
          E-mails pra enviar
        </p>
        <p className="mt-1.5 text-[19px] font-semibold leading-none text-white">{d.emails}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-neutral-500">
          <KeyRound size={11} strokeWidth={2.2} />
          {d.emails === 0 ? "Nada pendente na Hotmart." : "Liberar acesso na Hotmart"}
        </p>
      </Link>
    </aside>
  );
}
