"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Meandro, Medalhao } from "@/components/marca-jayo";

/** A máscara do Zeus — a mesma da planta e da LP do Jay.O Laser. */
const MASCARA_ZEUS =
  "linear-gradient(to right, black 0%, black 18%, rgba(0,0,0,0.5) 45%, transparent 75%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)";
import { GRUPOS, type Atalho } from "@/components/ajuda-atalhos-dados";

/**
 * Os atalhos pro resto do mundo Jay.
 *
 * ⚠️ James: *"vamos separar ele do chat, e posicionar ele à direita como se
 * fosse widgets"*. Então são blocos próprios ao lado do painel da conversa, não
 * uma coluna grudada dentro dele — cada um com a mesma borda e o mesmo canto do
 * painel, pra parecerem peças irmãs em vez de um recorte.
 *
 * ⚠️ Existem por um motivo prático, não decorativo: quem chega no suporte
 * querendo **comprar** ou **agendar** ocupa o atendimento com uma pergunta que a
 * IA não pode responder (ela não fala de preço). Estes botões dão a saída certa
 * antes de a pessoa entrar na fila errada.
 *
 * ⚠️ O WhatsApp **do suporte** NÃO entra aqui. Sempre à vista, a aluna pularia a
 * triagem e iria direto — e o filtro que a IA existe pra fazer deixaria de
 * existir. Ele aparece só quando a conversa é encaminhada. Os dois WhatsApps
 * daqui são outra coisa: vender curso e agendar clínica.
 */

/**
 * Um atalho — cápsula com contorno próprio, como na planta.
 *
 * ⚠️ O ícone mora dentro de uma **plaquinha**, não solto. James: *"o widget da
 * pessoinha, da TV, da estrela, tá muito fino"*. Traço fino sobre preto some, e
 * some ainda mais quando o ícone é pequeno e não tem nada em volta pra segurar
 * ele. A plaqueta dá peso e área; o traço mais grosso dá presença.
 *
 * ⚠️ E ela **reage**: no hover a plaqueta inverte (fundo ouro, ícone preto) e a
 * cápsula anda um fio pra direita. É o que ele chamou de *"mais animado"* — a
 * diferença entre um link que parece impresso e um que parece vivo.
 */
function Item({ a, aoEscolher }: { a: Atalho; aoEscolher?: () => void }) {
  return (
    <a
      href={a.href}
      onClick={aoEscolher}
      title={a.descricao}
      {...(a.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-3 rounded-2xl border border-[#AC9751]/30 px-3 py-2.5 transition-all duration-200 hover:translate-x-0.5 hover:border-[#AC9751]/70 hover:bg-[#AC9751]/10"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#AC9751]/35 bg-[#AC9751]/12 transition-colors duration-200 group-hover:border-[#AC9751] group-hover:bg-[#AC9751]">
        <a.Icone
          size={15}
          strokeWidth={2.2}
          className="text-[#AC9751] transition-colors duration-200 group-hover:text-[#101820]"
        />
      </span>
      <span className="min-w-0 truncate text-[13px] font-medium text-[#F4F1EA]/90 transition-colors group-hover:text-[#F4F1EA]">
        {a.curto ?? a.titulo}
      </span>
    </a>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 text-[10px] font-medium uppercase tracking-[0.26em] text-[#AC9751]/75">
      {children}
    </p>
  );
}

/**
 * A barra lateral do computador — o layout 5, escolhido pelo James entre os 10.
 *
 * ⚠️ Os atalhos são **linhas soltas**, sem cartão em volta. Era esse o incômodo
 * dele: *"eles estarem dentro desse 2 está me incomodando"* — o ladrilho já era
 * um cartão, dentro de outro cartão, dois contornos disputando. Aqui a própria
 * barra é o recipiente, então nada precisa de moldura própria.
 *
 * ⚠️ O Zeus mora AQUI, não solto na página. É a diferença entre imagem com
 * função e enfeite: ele vira a textura da coluna. Mas texto sobre foto não se
 * lê — por isso o véu escuro por cima dele, mais forte onde tem letra e mais
 * fraco embaixo, onde o rosto pode aparecer.
 */
export function AtalhosBarra() {
  return (
    <aside className="relative hidden w-[26%] min-w-[15rem] max-w-[24rem] shrink-0 overflow-hidden border-r border-[#AC9751]/20 bg-[#0b1117] lg:flex lg:flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/laser/assets/zeus-BWpgiY3L.jpg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        // ⚠️ Dimensionado pela ALTURA DA COLUNA (78%), ancorado embaixo — não
        // esticado na altura da tela. A imagem é retrato (736x1151): com
        // `h-full` numa coluna de ~950px ela renderizava a ~590x920 e a cara
        // engolia a barra inteira. Na planta ela sai a ~200x310, e é essa
        // proporção que o James aprovou.
        className="pointer-events-none absolute bottom-0 left-[-8%] h-[78%] w-auto"
        style={{
          objectFit: "contain",
          objectPosition: "bottom left",
          // Mais discreta que a planta de propósito: ampliada numa tela de
          // verdade, a mesma opacidade lê bem mais forte que na maquete.
          opacity: 0.38,
          // ⚠️ A MESMA máscara da planta: some pra direita e nas pontas de cima
          // e de baixo. É ela que faz o Zeus virar textura em vez de foto
          // colada — sem, a imagem termina numa linha reta.
          maskImage: MASCARA_ZEUS,
          WebkitMaskImage: MASCARA_ZEUS,
        }}
      />
      <div className="relative flex flex-col overflow-y-auto px-4 py-6">
        {/* ⚠️ A marca vive AQUI no computador — o cabeçalho da direita só
            existe no celular. Repetir os dois seria dizer duas vezes a mesma
            coisa na mesma tela. */}
        <div className="flex items-center gap-3 px-1">
          <Medalhao tamanho={40} />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#AC9751]">
              Jay Academy
            </p>
            <p className="font-[family-name:var(--font-marca)] text-[17px] leading-tight text-[#F4F1EA]">
              Suporte
            </p>
          </div>
        </div>

        {/* ⚠️ UMA lista, sem os títulos "Também por aqui" / "Falar agora". Eles
            cortavam a coluna em dois e mudavam o lugar de cada atalho — foi o
            que o James apontou comparando com a planta. Os grupos continuam
            existindo nos dados, pra gaveta do celular, onde há espaço pra eles. */}
        <div className="mt-6 space-y-2.5">
          {GRUPOS.flatMap((g) => g.itens).map((a) => (
            <Item key={a.titulo} a={a} />
          ))}
        </div>
      </div>
    </aside>
  );
}

/**
 * As três barrinhas do celular, e a gaveta que elas abrem.
 *
 * ⚠️ A gaveta fecha ao escolher, no Esc e no toque fora. Menu que não fecha
 * sozinho no celular cobre a conversa e a pessoa acha que travou.
 */
export function AtalhosMobile() {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = antes;
    };
  }, [aberto]);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        aria-label="Abrir atalhos"
        aria-expanded={aberto}
        className="-mr-1 ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#F4F1EA]/60 transition hover:text-[#AC9751] lg:hidden"
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Fechar atalhos"
            onClick={() => setAberto(false)}
            className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col gap-5 overflow-y-auto border-l border-[#AC9751]/20 bg-[#101820] px-4 pb-6 pt-4 shadow-2xl">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#F4F1EA]/50 transition hover:text-[#F4F1EA]"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            {GRUPOS.map((g, i) => (
              <div key={g.titulo}>
                <Titulo>{g.titulo}</Titulo>
                <Meandro
                  id={`meandro-gaveta-${i}`}
                  className="my-2.5 text-[#AC9751]/20"
                  altura={7}
                />
                <div className="space-y-0.5">
                  {g.itens.map((a) => (
                    <Item key={a.titulo} a={a} aoEscolher={() => setAberto(false)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
