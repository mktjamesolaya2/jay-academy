"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Meandro } from "@/components/marca-jayo";
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

function Item({ a, aoEscolher }: { a: Atalho; aoEscolher?: () => void }) {
  return (
    <a
      href={a.href}
      onClick={aoEscolher}
      title={a.descricao}
      {...(a.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex flex-col gap-2 rounded-2xl border border-[#AC9751]/18 bg-[#0d141b] px-3 py-3.5 transition hover:border-[#AC9751]/45 hover:bg-[#AC9751]/[0.07]"
    >
      <a.Icone size={18} strokeWidth={1.6} className="text-[#AC9751]/80" />
      <span className="text-[12px] leading-snug text-[#F4F1EA]/90">
        {a.curto ?? a.titulo}
      </span>
    </a>
  );
}

/**
 * A grade de ladrilhos — o estilo 8, escolhido pelo James entre os 10.
 *
 * ⚠️ Quando o grupo tem número ÍMPAR de itens, o último ocupa as duas colunas.
 * Sem isso sobra um buraco do tamanho de um ladrilho no canto, e buraco em
 * grade parece defeito, não espaço.
 */
function Grade({ itens, aoEscolher }: { itens: Atalho[]; aoEscolher?: () => void }) {
  const impar = itens.length % 2 === 1;
  return (
    <div className="grid grid-cols-2 gap-2">
      {itens.map((a, i) => (
        <div key={a.titulo} className={impar && i === itens.length - 1 ? "col-span-2" : ""}>
          <Item a={a} aoEscolher={aoEscolher} />
        </div>
      ))}
    </div>
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
 * Os blocos do computador.
 *
 * ⚠️ Somem abaixo de `lg`. No celular virariam uma pilha empurrando a conversa
 * pra baixo da dobra — e a conversa é o motivo da página existir.
 */
export function AtalhosDesktop() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 lg:flex">
      {GRUPOS.map((g, i) => (
        <div
          key={g.titulo}
          // A mesma borda, o mesmo canto e a mesma sombra do painel da conversa:
          // é o que faz parecerem peças da mesma família, e não um pedaço solto.
          className="rounded-3xl border border-[#AC9751]/20 bg-[#0d141b] p-3.5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
        >
          <Titulo>{g.titulo}</Titulo>
          <Meandro id={`meandro-atalhos-${i}`} className="my-2.5 text-[#AC9751]/20" altura={7} />
          <Grade itens={g.itens} />
        </div>
      ))}
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
                <Grade itens={g.itens} aoEscolher={() => setAberto(false)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
