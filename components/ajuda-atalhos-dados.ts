import {
  CalendarHeart,
  GraduationCap,
  MonitorPlay,
  Sparkles,
  UserRound,
} from "lucide-react";

/**
 * Os dados dos atalhos, num módulo **sem "use client"**.
 *
 * ⚠️ Moram aqui por uma fronteira do Next, não por organização: quando um
 * componente de SERVIDOR importa um valor de um módulo marcado "use client", o
 * Next entrega uma referência de cliente no lugar do valor. `GRUPOS[1]` virava
 * `undefined` e o build quebrava com "Cannot read properties of undefined".
 *
 * Neutro aqui, os dois lados leem o mesmo array de verdade — e continua
 * existindo UMA lista de atalhos, não duas pra manter em dia.
 */

export type Atalho = {
  titulo: string;
  descricao: string;
  /**
   * O rótulo dentro do ladrilho.
   *
   * ⚠️ No formato de grade o ladrilho tem ~135px e NÃO cabe a descrição. Sem um
   * rótulo próprio, "James Olaya" ficaria sozinho e ninguém saberia que é o
   * site dele — a descrição era o que explicava.
   */
  curto?: string;
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
export const GRUPOS: Array<{ titulo: string; itens: Atalho[] }> = [
  {
    titulo: "Também por aqui",
    itens: [
      { titulo: "PMU CLASS", descricao: "Seus cursos online", href: "/pmuclass", Icone: MonitorPlay },
      { titulo: "Formações presenciais", descricao: "Jay Academy", href: "/academy", Icone: GraduationCap },
      { titulo: "James Olaya", descricao: "O site do James", curto: "Site do James", href: "/jamesolaya", Icone: UserRound },
    ],
  },
  {
    titulo: "Falar agora",
    itens: [
      {
        titulo: "Clínica James Olaya",
        descricao: "Agendar procedimento",
        curto: "Agendar na clínica",
        href: "https://api.whatsapp.com/send/?phone=5519971450311&text=Ol%C3%A1%21+Vim+do+Instagram.+Gostaria+de+agendar+procedimentos+na+Cl%C3%ADnica+James+Olaya.&type=phone_number&app_absent=0",
        externo: true,
        Icone: CalendarHeart,
      },
      {
        titulo: "Conhecer os cursos",
        descricao: "Falar no WhatsApp",
        curto: "Conhecer cursos",
        href: "https://wa.me/5519971634567?text=Oi%21%20Quero%20conhecer%20os%20cursos%20online%20da%20JayAcademy",
        externo: true,
        Icone: Sparkles,
      },
    ],
  },
];
