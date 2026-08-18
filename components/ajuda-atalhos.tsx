"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Meandro, Medalhao } from "@/components/marca-jayo";
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
      {...(a.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-[#AC9751]/10"
    >
      <a.Icone
        size={16}
        strokeWidth={1.7}
        className="shrink-0 text-[#AC9751]/70 transition group-hover:text-[#AC9751]"
      />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-[#F4F1EA]/90">
          {a.titulo}
        </span>
        <span className="block truncate text-[11px] text-[#F4F1EA]/40">{a.descricao}</span>
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
    <aside className="relative hidden w-[17rem] shrink-0 overflow-hidden border-r border-[#AC9751]/15 bg-[#0b1117] lg:flex lg:flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/laser/assets/zeus-BWpgiY3L.jpg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ objectFit: "cover", objectPosition: "60% 38%", opacity: 0.72 }}
      />
      {/* ⚠️ O véu. Sem ele, a lista fica sobre o rosto e não se lê — bonito na
          maquete, ilegível na tela. Escuro no topo (onde estão a marca e os
          atalhos) e mais aberto embaixo, deixando o Zeus respirar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(11,17,23,0.96) 0%, rgba(11,17,23,0.88) 30%, rgba(11,17,23,0.42) 62%, rgba(11,17,23,0.62) 100%)",
        }}
      />

      <div className="relative flex flex-col gap-5 overflow-y-auto px-5 py-6">
        {/* ⚠️ A marca vive AQUI no computador — o cabeçalho da direita só
            existe no celular. Sem este bloco a tela grande ficaria sem
            medalhão e sem nome: foi o furo que quase passou quando o
            cabeçalho saiu. */}
        <div className="flex items-center gap-3">
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

        {GRUPOS.map((g, i) => (
          <div key={g.titulo}>
            <Titulo>{g.titulo}</Titulo>
            <Meandro id={`meandro-barra-${i}`} className="my-2.5 text-[#AC9751]/25" altura={7} />
            <div className="space-y-0.5">
              {g.itens.map((a) => (
                <Item key={a.titulo} a={a} />
              ))}
            </div>
          </div>
        ))}
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
