"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

/**
 * A LP de verdade rodando dentro de um iPhone 13 (390×844).
 *
 * ⚠️ A tela por dentro é SEMPRE 390×844 — o que muda é só o zoom com que se
 * olha. Numa janela de notebook o aparelho de 866px não cabe inteiro, e ver a
 * dobra cortada engana mais do que ajuda; então a moldura encolhe, o layout não.
 */

const LARG = 390;
const ALT = 844;
const ALT_APARELHO = ALT + 22; // moldura

type Props = { url: string; nome: string };

type Dobra = { id: string; nome: string; topo: number };

/** Nome bonito pras dobras conhecidas; o resto usa o próprio id. */
const APELIDOS: Record<string, string> = {
  abertura: "Abertura",
  hero: "Hero",
  sobre: "Manifesto",
  experiencia: "Experiência",
  metodo: "Método",
  formacoes: "Formações",
  professor: "Professor",
  academy: "A casa",
  alunos: "Depoimentos",
  resultados: "Resultados",
  comecar: "Fechamento",
};

export function PreviewCelular({ url, nome }: Props) {
  const tela = useRef<HTMLIFrameElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [tamanhoReal, setTamanhoReal] = useState(false);
  const [dobras, setDobras] = useState<Dobra[]>([]);
  const [ativa, setAtiva] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  const ajustarZoom = useCallback(() => {
    if (tamanhoReal) { setZoom(1); return; }
    const topo = palco.current?.getBoundingClientRect().top ?? 0;
    const disponivel = window.innerHeight - topo - 24;
    setZoom(Math.min(1, Math.max(0.5, disponivel / ALT_APARELHO)));
  }, [tamanhoReal]);

  useEffect(() => {
    ajustarZoom();
    window.addEventListener("resize", ajustarZoom);
    return () => window.removeEventListener("resize", ajustarZoom);
  }, [ajustarZoom, dobras.length]);

  /** Lê as dobras de dentro do iframe. Mesma origem, então dá pra ler direto. */
  const lerDobras = useCallback(() => {
    try {
      const doc = tela.current?.contentDocument;
      if (!doc) return;
      const achadas: Dobra[] = [];
      for (const [id, sel] of [["abertura", ".abertura"], ["hero", ".hero"]] as const) {
        const el = doc.querySelector<HTMLElement>(sel);
        if (el) achadas.push({ id, nome: APELIDOS[id] ?? id, topo: el.offsetTop });
      }
      doc.querySelectorAll<HTMLElement>("section[id]").forEach((el) => {
        achadas.push({ id: el.id, nome: APELIDOS[el.id] ?? el.id, topo: el.offsetTop });
      });
      setDobras(achadas.sort((a, b) => a.topo - b.topo));
      setBloqueado(false);
    } catch {
      // página de outro domínio: o navegador barra a leitura. O preview
      // continua funcionando, só sem os atalhos.
      setBloqueado(true);
    }
  }, []);

  const rolarPara = (d: Dobra) => {
    try {
      tela.current?.contentWindow?.scrollTo({ top: d.topo, behavior: "smooth" });
      setAtiva(d.id);
    } catch { /* sem acesso ao conteúdo */ }
  };

  const recarregar = () => {
    if (tela.current) tela.current.src = tela.current.src;
    setAtiva(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip estatico>390 × 844</Chip>
        <Chip onClick={() => setTamanhoReal((v) => !v)} ativo={tamanhoReal}>
          {tamanhoReal ? "Caber na tela" : "Tamanho real"}
        </Chip>
        <Chip onClick={() => { tela.current?.contentWindow?.scrollTo({ top: 0, behavior: "smooth" }); setAtiva(null); }}>
          Voltar ao topo
        </Chip>
        <Chip onClick={recarregar}>Recarregar</Chip>
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="px-3 py-1.5 rounded-full border border-[#262626] text-[11px] font-medium text-neutral-400 hover:text-white hover:border-neutral-600 transition"
        >
          Abrir em aba
        </a>
      </div>

      {dobras.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dobras.map((d) => (
            <Chip key={d.id} onClick={() => rolarPara(d)} ativo={ativa === d.id} pequeno>
              {d.nome}
            </Chip>
          ))}
        </div>
      )}

      {bloqueado && (
        <p className="text-[11px] text-neutral-500">
          Os atalhos por dobra não funcionam em página de outro domínio — o navegador
          bloqueia a leitura. O preview continua valendo.
        </p>
      )}

      <div ref={palco} className="flex justify-center">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            marginBottom: Math.round(-ALT_APARELHO * (1 - zoom)),
          }}
          className="relative flex-none rounded-[58px] p-[11px] shadow-[0_0_0_1px_rgba(255,255,255,.08),0_40px_90px_rgba(0,0,0,.7)]"
        >
          <div className="absolute inset-0 rounded-[58px] bg-gradient-to-br from-[#3a3a3d] via-[#1c1c1e] to-[#48484a]" />
          <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[47px] bg-black">
            {/* notch do 13 — o 14 Pro pra cima é Dynamic Island, outro desenho */}
            <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-[30px] w-[162px] -translate-x-1/2 rounded-b-[18px] bg-black" />
            <iframe
              ref={tela}
              src={url}
              title={`${nome} no iPhone 13`}
              onLoad={lerDobras}
              className="h-full w-full border-0"
            />
            <div className="pointer-events-none absolute bottom-[7px] left-1/2 z-10 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/55" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({
  children, onClick, ativo, pequeno, estatico,
}: {
  children: React.ReactNode; onClick?: () => void; ativo?: boolean; pequeno?: boolean; estatico?: boolean;
}) {
  const classe = clsx(
    "rounded-full border transition",
    pequeno ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px] font-medium",
    ativo
      ? "border-neutral-500 bg-white/10 text-white"
      : "border-[#262626] text-neutral-400 hover:text-white hover:border-neutral-600",
    estatico && "cursor-default text-neutral-500 hover:text-neutral-500 hover:border-[#262626]",
  );
  if (estatico) return <span className={classe}>{children}</span>;
  return <button type="button" onClick={onClick} className={classe}>{children}</button>;
}
