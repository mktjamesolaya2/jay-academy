"use client";

import { useEffect, useState } from "react";
import {
  CalendarHeart,
  GraduationCap,
  Menu,
  MonitorPlay,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Meandro } from "@/components/marca-jayo";

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

type Atalho = {
  titulo: string;
  descricao: string;
  href: string;
  /** Abre em outra aba: é site/conversa que não é esta página. */
  externo?: boolean;
  Icone: typeof GraduationCap;
};

/**
 * Dois grupos, porque são duas intenções diferentes: **ir a um lugar** e
 * **falar com alguém agora**. Numa lista só, o WhatsApp da clínica ficava com o
 * mesmo peso visual de um link de site — e ele é um compromisso, não um clique.
 */
const GRUPOS: Array<{ titulo: string; itens: Atalho[] }> = [
  {
    titulo: "Também por aqui",
    itens: [
      { titulo: "PMU CLASS", descricao: "Seus cursos online", href: "/pmuclass", Icone: MonitorPlay },
      { titulo: "Formações presenciais", descricao: "Jay Academy", href: "/academy", Icone: GraduationCap },
      { titulo: "James Olaya", descricao: "O site do James", href: "/jamesolaya", Icone: UserRound },
    ],
  },
  {
    titulo: "Falar agora",
    itens: [
      {
        titulo: "Clínica James Olaya",
        descricao: "Agendar procedimento",
        href: "https://api.whatsapp.com/send/?phone=5519971450311&text=Ol%C3%A1%21+Vim+do+Instagram.+Gostaria+de+agendar+procedimentos+na+Cl%C3%ADnica+James+Olaya.&type=phone_number&app_absent=0",
        externo: true,
        Icone: CalendarHeart,
      },
      {
        titulo: "Conhecer os cursos",
        descricao: "Falar no WhatsApp",
        href: "https://wa.me/5519971634567?text=Oi%21%20Quero%20conhecer%20os%20cursos%20online%20da%20JayAcademy",
        externo: true,
        Icone: Sparkles,
      },
    ],
  },
];

function Item({ a, aoEscolher }: { a: Atalho; aoEscolher?: () => void }) {
  return (
    <a
      href={a.href}
      onClick={aoEscolher}
      {...(a.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition hover:border-[#AC9751]/30 hover:bg-[#AC9751]/[0.07]"
    >
      <a.Icone
        size={16}
        strokeWidth={1.8}
        className="shrink-0 text-[#AC9751]/70 transition group-hover:text-[#AC9751]"
      />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-[#F4F1EA]/90">
          {a.titulo}
        </span>
        <span className="block truncate text-[11px] text-[#F4F1EA]/40">
          {a.descricao}
        </span>
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
 * Os blocos do computador.
 *
 * ⚠️ Somem abaixo de `lg`. No celular virariam uma pilha empurrando a conversa
 * pra baixo da dobra — e a conversa é o motivo da página existir.
 */
export function AtalhosDesktop() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-4 lg:flex">
      {GRUPOS.map((g, i) => (
        <div
          key={g.titulo}
          // A mesma borda, o mesmo canto e a mesma sombra do painel da conversa:
          // é o que faz parecerem peças da mesma família, e não um pedaço solto.
          className="rounded-3xl border border-[#AC9751]/20 bg-[#0d141b] p-3.5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
        >
          <Titulo>{g.titulo}</Titulo>
          <Meandro id={`meandro-atalhos-${i}`} className="my-2.5 text-[#AC9751]/20" altura={7} />
          <div className="space-y-0.5">
            {g.itens.map((a) => (
              <Item key={a.titulo} a={a} />
            ))}
          </div>
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
