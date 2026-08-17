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
 * ⚠️ James: *"no PC tem um espaço muito grande de tela e não tem nada em volta"*.
 * A conversa sozinha no meio do vazio também tem um custo prático: quem chega
 * aqui querendo **comprar** ou **agendar** ocupa o suporte com uma pergunta que
 * a IA não pode responder (ela não fala de preço). Estes botões dão a saída
 * certa antes de a pessoa entrar na fila errada.
 *
 * ⚠️ O WhatsApp **do suporte** NÃO entra nesta lista. Se ele ficasse sempre à
 * vista, a aluna pularia a triagem e iria direto — e aí o filtro que a IA existe
 * pra fazer deixa de existir. Ele aparece só quando a conversa é encaminhada.
 * Os dois WhatsApps daqui são outra coisa: vender curso e agendar clínica.
 */

type Atalho = {
  titulo: string;
  descricao: string;
  href: string;
  /** Abre em outra aba: é site/conversa que não é esta página. */
  externo?: boolean;
  Icone: typeof GraduationCap;
};

const ATALHOS: Atalho[] = [
  {
    titulo: "PMU CLASS",
    descricao: "Seus cursos online",
    href: "/pmuclass",
    Icone: MonitorPlay,
  },
  {
    titulo: "Formações presenciais",
    descricao: "Jay Academy",
    href: "/academy",
    Icone: GraduationCap,
  },
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
  {
    titulo: "James Olaya",
    descricao: "O site do James",
    href: "/jamesolaya",
    Icone: UserRound,
  },
];

function Lista({ aoEscolher }: { aoEscolher?: () => void }) {
  return (
    <nav className="space-y-1.5">
      {ATALHOS.map((a) => (
        <a
          key={a.titulo}
          href={a.href}
          onClick={aoEscolher}
          {...(a.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-[#AC9751]/30 hover:bg-[#AC9751]/[0.06]"
        >
          <a.Icone
            size={16}
            strokeWidth={1.8}
            className="shrink-0 text-[#AC9751]/70 transition group-hover:text-[#AC9751]"
          />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium text-[#F4F1EA]/90">
              {a.titulo}
            </span>
            <span className="block truncate text-[11.5px] text-[#F4F1EA]/40">
              {a.descricao}
            </span>
          </span>
        </a>
      ))}
    </nav>
  );
}

/**
 * A coluna do computador.
 *
 * ⚠️ Some abaixo de `lg`. No celular ela viraria uma pilha de botões empurrando
 * a conversa pra baixo da dobra — e a conversa é o motivo da página existir.
 */
export function AtalhosDesktop() {
  return (
    // ⚠️ Encostada no painel por uma linha, não solta na página. Antes ela
    // flutuava a 200px da conversa e as duas pareciam telas diferentes abertas
    // lado a lado.
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-l border-[#AC9751]/15 px-3 py-5 lg:block">
      <p className="px-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#AC9751]/70">
        Também por aqui
      </p>
      <Meandro id="meandro-atalhos" className="my-3 text-[#AC9751]/20" altura={7} />
      <Lista />
    </aside>
  );
}

/**
 * As três barrinhas do celular, e a gaveta que elas abrem.
 *
 * ⚠️ A gaveta fecha ao escolher e no Esc. Menu que não fecha sozinho no celular
 * cobre a conversa e a pessoa acha que travou.
 */
export function AtalhosMobile() {
  const [aberto, setAberto] = useState(false);

  // Esc fecha — e enquanto está aberta, a página atrás não rola junto.
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
          <div className="absolute right-0 top-0 flex h-full w-[80%] max-w-xs flex-col border-l border-[#AC9751]/20 bg-[#101820] px-4 pb-6 pt-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#AC9751]">
                Também por aqui
              </p>
              <button
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#F4F1EA]/50 transition hover:text-[#F4F1EA]"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <Meandro id="meandro-gaveta" className="mb-3 text-[#AC9751]/25" altura={8} />
            <Lista aoEscolher={() => setAberto(false)} />
          </div>
        </div>
      )}
    </>
  );
}
