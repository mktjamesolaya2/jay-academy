import type { Metadata } from "next";

/**
 * Vitrine de LAYOUTS da página inteira — **página de trabalho, não de aluna**.
 *
 * ⚠️ James: *"eles estarem dentro desse 2 está me incomodando"* (o ladrilho é um
 * cartão dentro de outro cartão — dois contornos disputando) e *"me manda 10
 * layouts diferentes da página inteira, mantendo o Zeus"*.
 *
 * São **maquetes**, não as páginas funcionando. O que se decide aqui é planta
 * baixa: onde fica a conversa, onde ficam os atalhos, quanto o Zeus ocupa. Um
 * chat de verdade em cada uma custaria dez vezes mais e não mudaria a escolha —
 * e nove delas iam pro lixo.
 *
 * Cada maquete usa a paleta e o Zeus de verdade, porque composição sobre preto
 * com ouro é outra coisa de composição no branco.
 *
 * **Some assim que ele escolher.**
 */

export const metadata: Metadata = {
  title: "Layouts · Ajuda",
  robots: { index: false, follow: false },
};

const ZEUS = "/laser/assets/zeus-BWpgiY3L.jpg";
const MASCARA =
  "linear-gradient(to right, black 0%, black 18%, rgba(0,0,0,0.5) 45%, transparent 75%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)";

/* ── peças da maquete ───────────────────────────────────────────────────── */

/** O Zeus dentro da maquete. `lado` diz de que borda ele encosta. */
function Zeus({ lado = "left", largura = "42%" }: { lado?: "left" | "right"; largura?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ZEUS}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 top-0 h-full w-auto"
      style={{
        [lado]: "-6%",
        maxWidth: largura,
        objectFit: "contain",
        objectPosition: `${lado} center`,
        opacity: 0.45,
        transform: lado === "right" ? "scaleX(-1)" : undefined,
        maskImage: MASCARA,
        WebkitMaskImage: MASCARA,
      }}
    />
  );
}

/** Um balão de conversa. */
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

/** O miolo da conversa: alguns balões + o campo de escrever. */
function Conversa({ compacto = false }: { compacto?: boolean }) {
  return (
    <div className="flex h-full flex-col justify-between p-3">
      <div className="space-y-2">
        <Balao larg="72%" />
        <Balao larg="46%" dela />
        {!compacto && <Balao larg="64%" />}
      </div>
      <div className="mt-2 h-6 rounded-full border border-[#AC9751]/30 bg-[#16202a]" />
    </div>
  );
}

/** A marca: medalhão + duas linhas. */
function Marca({ grande = false }: { grande?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{ width: grande ? 30 : 20, height: grande ? 30 : 20 }}
        className="shrink-0 rounded-full border border-[#AC9751]/60"
      />
      <div className="space-y-1">
        <div className="h-1 w-10 rounded bg-[#AC9751]/70" />
        <div className={`h-1.5 rounded bg-[#F4F1EA]/70 ${grande ? "w-20" : "w-12"}`} />
      </div>
    </div>
  );
}

/** Um ladrilho de atalho. */
function Tile({ alto = false }: { alto?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-[#AC9751]/25 bg-[#0d141b] p-1.5 ${alto ? "h-11" : "h-9"}`}
    >
      <div className="h-1.5 w-1.5 rounded-sm bg-[#AC9751]/80" />
      <div className="mt-1.5 h-1 w-3/4 rounded bg-[#F4F1EA]/45" />
    </div>
  );
}

/** Um atalho em pílula (sem cartão em volta). */
function Pilula({ larg = "auto" }: { larg?: string }) {
  return (
    <div
      style={{ width: larg }}
      className="flex h-6 items-center gap-1.5 rounded-full border border-[#AC9751]/30 px-2"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-[#AC9751]/80" />
      <span className="h-1 w-8 rounded bg-[#F4F1EA]/45" />
    </div>
  );
}

/** A moldura do painel da conversa. */
function Painel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#AC9751]/25 bg-[#0d141b] ${className}`}
    >
      {children}
    </div>
  );
}

/** A tela onde cada maquete acontece. */
function Tela({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[#F4F1EA]/10 bg-[#101820]">
      {children}
    </div>
  );
}

/* ── 1 · Atual ──────────────────────────────────────────────────────────── */
function L1() {
  return (
    <Tela>
      <Zeus />
      <div className="relative flex h-full items-center gap-3 p-5">
        <Painel className="h-[78%] flex-1">
          <div className="border-b border-[#AC9751]/20 p-2">
            <Marca />
          </div>
          <Conversa />
        </Painel>
        <div className="w-[26%] space-y-2">
          <div className="rounded-xl border border-[#AC9751]/25 bg-[#0d141b] p-2">
            <div className="mb-1.5 h-1 w-10 rounded bg-[#AC9751]/70" />
            <div className="grid grid-cols-2 gap-1.5">
              <Tile />
              <Tile />
            </div>
          </div>
          <div className="rounded-xl border border-[#AC9751]/25 bg-[#0d141b] p-2">
            <div className="mb-1.5 h-1 w-8 rounded bg-[#AC9751]/70" />
            <div className="grid grid-cols-2 gap-1.5">
              <Tile />
              <Tile />
            </div>
          </div>
        </div>
      </div>
    </Tela>
  );
}

/* ── 2 · Ladrilhos soltos (sem cartão em volta) ─────────────────────────── */
function L2() {
  return (
    <Tela>
      <Zeus />
      <div className="relative flex h-full items-center gap-3 p-5">
        <Painel className="h-[78%] flex-1">
          <div className="border-b border-[#AC9751]/20 p-2">
            <Marca />
          </div>
          <Conversa />
        </Painel>
        <div className="w-[26%] space-y-2">
          <div className="h-1 w-10 rounded bg-[#AC9751]/70" />
          <div className="grid grid-cols-2 gap-1.5">
            <Tile />
            <Tile />
            <Tile />
            <Tile />
          </div>
        </div>
      </div>
    </Tela>
  );
}

/* ── 3 · Barra de pílulas embaixo do chat ───────────────────────────────── */
function L3() {
  return (
    <Tela>
      <Zeus />
      <div className="relative flex h-full flex-col items-center justify-center gap-3 p-5">
        <Painel className="h-[66%] w-[72%]">
          <div className="border-b border-[#AC9751]/20 p-2">
            <Marca />
          </div>
          <Conversa compacto />
        </Painel>
        <div className="flex w-[72%] flex-wrap justify-center gap-1.5">
          <Pilula />
          <Pilula />
          <Pilula />
          <Pilula />
        </div>
      </div>
    </Tela>
  );
}

/* ── 4 · Marca à esquerda, conversa à direita (50/50) ───────────────────── */
function L4() {
  return (
    <Tela>
      <Zeus largura="52%" />
      <div className="relative grid h-full grid-cols-2">
        <div className="flex flex-col justify-center gap-3 p-6">
          <Marca grande />
          <div className="h-1 w-24 rounded bg-[#F4F1EA]/25" />
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <Tile />
            <Tile />
            <Tile />
            <Tile />
          </div>
        </div>
        <div className="flex items-stretch p-4 pl-0">
          <Painel className="flex-1">
            <Conversa />
          </Painel>
        </div>
      </div>
    </Tela>
  );
}

/* ── 5 · Barra lateral fixa à esquerda ──────────────────────────────────── */
function L5() {
  return (
    <Tela>
      <div className="relative flex h-full">
        <div className="relative w-[26%] overflow-hidden border-r border-[#AC9751]/20 bg-[#0b1117]">
          <Zeus largura="120%" />
          <div className="relative space-y-2.5 p-3">
            <Marca />
            <div className="space-y-1.5 pt-2">
              <Pilula larg="100%" />
              <Pilula larg="100%" />
              <Pilula larg="100%" />
              <Pilula larg="100%" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <Painel className="h-full">
            <Conversa />
          </Painel>
        </div>
      </div>
    </Tela>
  );
}

/* ── 6 · Tela cheia, atalhos como ícones numa trilha ────────────────────── */
function L6() {
  return (
    <Tela>
      <Zeus />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[#AC9751]/20 px-4 py-2.5">
          <Marca />
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-[#AC9751]/35"
              >
                <span className="h-1.5 w-1.5 rounded-sm bg-[#AC9751]/80" />
              </span>
            ))}
          </div>
        </div>
        <div className="mx-auto w-[62%] flex-1">
          <Conversa />
        </div>
      </div>
    </Tela>
  );
}

/* ── 7 · Zeus à direita, conversa à esquerda ────────────────────────────── */
function L7() {
  return (
    <Tela>
      <Zeus lado="right" />
      <div className="relative flex h-full items-center gap-4 p-5">
        <Painel className="h-[80%] w-[56%]">
          <div className="border-b border-[#AC9751]/20 p-2">
            <Marca />
          </div>
          <Conversa />
        </Painel>
        <div className="w-[22%] space-y-1.5">
          <div className="h-1 w-10 rounded bg-[#AC9751]/70" />
          <Tile alto />
          <Tile alto />
          <Tile alto />
        </div>
      </div>
    </Tela>
  );
}

/* ── 8 · Cabeçalho da marca em cima, tudo abaixo ────────────────────────── */
function L8() {
  return (
    <Tela>
      <Zeus />
      <div className="relative flex h-full flex-col items-center gap-3 p-5">
        <div className="flex flex-col items-center gap-1.5">
          <span className="h-7 w-7 rounded-full border border-[#AC9751]/60" />
          <div className="h-1.5 w-16 rounded bg-[#F4F1EA]/70" />
          <div className="h-1 w-24 rounded bg-[#AC9751]/40" />
        </div>
        <div className="flex w-full flex-1 justify-center gap-3">
          <Painel className="w-[52%]">
            <Conversa />
          </Painel>
          <div className="grid w-[24%] grid-cols-2 content-start gap-1.5">
            <Tile />
            <Tile />
            <Tile />
            <Tile />
          </div>
        </div>
      </div>
    </Tela>
  );
}

/* ── 9 · Conversa sem moldura, atalhos flutuando ────────────────────────── */
function L9() {
  return (
    <Tela>
      <Zeus />
      <div className="relative h-full p-5">
        <div className="absolute right-5 top-5 grid w-[24%] grid-cols-2 gap-1.5">
          <Tile />
          <Tile />
          <Tile />
          <Tile />
        </div>
        <div className="flex h-full w-[58%] flex-col">
          <Marca />
          <div className="mt-2 flex-1">
            <Conversa />
          </div>
        </div>
      </div>
    </Tela>
  );
}

/* ── 10 · Zeus grande atrás, conversa flutuando por cima ────────────────── */
function L10() {
  return (
    <Tela>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ZEUS}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{
          objectFit: "cover",
          objectPosition: "center 20%",
          opacity: 0.3,
          maskImage: "radial-gradient(70% 70% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(70% 70% at 50% 40%, black 40%, transparent 100%)",
        }}
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-2.5 p-5">
        <Marca />
        <Painel className="h-[58%] w-[56%] shadow-2xl">
          <Conversa compacto />
        </Painel>
        <div className="flex gap-1.5">
          <Pilula />
          <Pilula />
          <Pilula />
          <Pilula />
        </div>
      </div>
    </Tela>
  );
}

const LAYOUTS = [
  { n: 1, nome: "Atual", nota: "Painel + dois cartões de atalho à direita. É o que te incomoda: ladrilho dentro de cartão.", C: L1 },
  { n: 2, nome: "Ladrilhos soltos", nota: "Tira o cartão de fora. Só o título e os ladrilhos, sem contorno disputando.", C: L2 },
  { n: 3, nome: "Pílulas embaixo", nota: "Atalhos viram uma linha discreta sob a conversa. O topo fica só da conversa.", C: L3 },
  { n: 4, nome: "Metade e metade", nota: "Marca e atalhos à esquerda sobre o Zeus; conversa ocupa a direita inteira.", C: L4 },
  { n: 5, nome: "Barra lateral", nota: "Coluna fixa com a marca e os atalhos em lista; conversa grande ao lado.", C: L5 },
  { n: 6, nome: "Tela cheia", nota: "Sem painel. Atalhos viram ícones no cabeçalho; a conversa ocupa tudo.", C: L6 },
  { n: 7, nome: "Zeus à direita", nota: "Inverte o lado. A conversa encosta à esquerda, atalhos empilhados no meio.", C: L7 },
  { n: 8, nome: "Marca no topo", nota: "Medalhão e nome centralizados em cima, conversa e atalhos abaixo.", C: L8 },
  { n: 9, nome: "Sem moldura", nota: "A conversa não tem caixa; os atalhos flutuam no canto superior direito.", C: L9 },
  { n: 10, nome: "Zeus por trás", nota: "Zeus grande e centralizado ao fundo; conversa flutua por cima, atalhos em pílulas.", C: L10 },
];

export default function LayoutsPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0a0f14] px-6 py-10 font-[family-name:var(--font-corpo)]">
      <header className="mx-auto mb-9 max-w-6xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#AC9751]">
          Jay Academy
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-marca)] text-[26px] text-[#F4F1EA]">
          10 layouts da página
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[#F4F1EA]/45">
          Maquetes: o que se decide aqui é onde fica cada coisa. Todas mantêm o
          Zeus. Me diz o número — e dá pra misturar (&ldquo;o 5, mas com as
          pílulas do 3&rdquo;).
        </p>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
        {LAYOUTS.map(({ n, nome, nota, C }) => (
          <section key={n}>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-marca)] text-[18px] text-[#AC9751]">
                {n}
              </span>
              <span className="text-[13.5px] font-medium text-[#F4F1EA]">{nome}</span>
            </div>
            <p className="mb-3 text-[12px] leading-relaxed text-[#F4F1EA]/40">{nota}</p>
            <C />
          </section>
        ))}
      </div>
    </main>
  );
}
