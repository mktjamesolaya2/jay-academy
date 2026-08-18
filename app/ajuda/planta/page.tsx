import type { Metadata } from "next";

/**
 * A planta 5 e a página ao vivo, lado a lado.
 *
 * ⚠️ James: *"ainda não se parece, me manda ele novamente para eu ir fazendo e
 * ajustando com você"*. Comparar de memória não funciona — ele olha a planta,
 * olha a página, e a diferença escapa. Aqui as duas ficam na mesma tela, no
 * mesmo tamanho, e dá pra apontar o que está diferente.
 *
 * ⚠️ A página ao vivo entra num quadro de **1600×1000 reduzido**, não numa
 * moldura pequena. Num quadro estreito ela cairia no layout de celular (a barra
 * some abaixo de `lg`) e a comparação seria com a tela errada.
 *
 * **Some quando ele disser que bateu.**
 */

export const metadata: Metadata = {
  title: "Planta · Ajuda",
  robots: { index: false, follow: false },
};

const ZEUS = "/laser/assets/zeus-BWpgiY3L.jpg";
const MASCARA =
  "linear-gradient(to right, black 0%, black 18%, rgba(0,0,0,0.5) 45%, transparent 75%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)";

/* ── as peças da maquete ────────────────────────────────────────────────── */

function Balao({ larg, dela = false }: { larg: string; dela?: boolean }) {
  return (
    <div className={`flex ${dela ? "justify-end" : "justify-start"}`}>
      <div
        style={{ width: larg }}
        className={`h-3.5 rounded-md ${dela ? "bg-[#AC9751]" : "bg-[#F4F1EA]"}`}
      />
    </div>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-5 shrink-0 rounded-full border border-[#AC9751]/60" />
      <div className="space-y-1">
        <div className="h-1 w-10 rounded bg-[#AC9751]/70" />
        <div className="h-1.5 w-12 rounded bg-[#F4F1EA]/70" />
      </div>
    </div>
  );
}

function Pilula() {
  return (
    <div className="flex h-6 w-full items-center gap-1.5 rounded-full border border-[#AC9751]/30 px-2">
      <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-[#AC9751]/80" />
      <span className="h-1 w-8 rounded bg-[#F4F1EA]/45" />
    </div>
  );
}

/** A planta 5, do jeito que ele escolheu. */
function Planta5() {
  return (
    <div className="relative h-[400px] w-[640px] overflow-hidden rounded-2xl border border-[#F4F1EA]/10 bg-[#101820]">
      <div className="relative flex h-full">
        {/* A barra: Zeus + marca + atalhos em lista */}
        <div className="relative w-[26%] overflow-hidden border-r border-[#AC9751]/20 bg-[#0b1117]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ZEUS}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-[-6%] top-0 h-full w-auto"
            style={{
              maxWidth: "120%",
              objectFit: "contain",
              objectPosition: "left center",
              opacity: 0.45,
              maskImage: MASCARA,
              WebkitMaskImage: MASCARA,
            }}
          />
          <div className="relative space-y-2.5 p-3">
            <Marca />
            <div className="space-y-1.5 pt-2">
              <Pilula />
              <Pilula />
              <Pilula />
              <Pilula />
            </div>
          </div>
        </div>

        {/* A conversa, num painel com respiro em volta */}
        <div className="flex-1 p-4">
          <div className="h-full overflow-hidden rounded-xl border border-[#AC9751]/25 bg-[#0d141b]">
            <div className="flex h-full flex-col justify-between p-3">
              <div className="space-y-2">
                <Balao larg="72%" />
                <Balao larg="46%" dela />
                <Balao larg="64%" />
              </div>
              <div className="mt-2 h-6 rounded-full border border-[#AC9751]/30 bg-[#16202a]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A página de verdade, num quadro grande e reduzido. */
function AoVivo() {
  return (
    <div className="relative h-[400px] w-[640px] overflow-hidden rounded-2xl border border-[#F4F1EA]/10 bg-[#101820]">
      <iframe
        src="/ajuda"
        title="A página ao vivo"
        // ⚠️ 1600×1000 reduzido a 40%. Num quadro estreito a página cairia no
        // layout de celular e a comparação seria com a tela errada.
        style={{
          width: 1600,
          height: 1000,
          border: 0,
          transform: "scale(0.4)",
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

export default function PlantaPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0a0f14] px-6 py-10 font-[family-name:var(--font-corpo)]">
      <header className="mx-auto mb-8 max-w-[1400px]">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#AC9751]">
          Jay Academy
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-marca)] text-[26px] text-[#F4F1EA]">
          A planta 5 e a página ao vivo
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[#F4F1EA]/45">
          Mesmo tamanho, lado a lado. Me diz o que está diferente — largura da
          barra, tamanho dos balões, o respiro em volta do painel, o quanto o
          Zeus aparece.
        </p>
      </header>

      <div className="mx-auto flex max-w-[1400px] flex-wrap gap-10">
        <section>
          <p className="mb-2.5 text-[13px] font-medium text-[#F4F1EA]">
            <span className="mr-2 font-[family-name:var(--font-marca)] text-[16px] text-[#AC9751]">
              A
            </span>
            A planta que você escolheu
          </p>
          <Planta5 />
        </section>

        <section>
          <p className="mb-2.5 text-[13px] font-medium text-[#F4F1EA]">
            <span className="mr-2 font-[family-name:var(--font-marca)] text-[16px] text-[#AC9751]">
              B
            </span>
            Como está agora, ao vivo
          </p>
          <AoVivo />
        </section>
      </div>
    </main>
  );
}
