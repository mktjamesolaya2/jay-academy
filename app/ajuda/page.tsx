import type { Metadata } from "next";
import { AjudaChat } from "@/components/ajuda-chat";
import { Meandro, Medalhao } from "@/components/marca-jayo";
import { AtalhosBarra, AtalhosMobile } from "@/components/ajuda-atalhos";
import { saudacao } from "@/lib/suporte-acesso";

/**
 * A pagina de atendimento da aluna — publica, sem login.
 *
 * Visual: sistema oficial da marca JAY.O (ouro #AC9751, preto #101820,
 * off-white, serifada + Poppins, meandro e medalhao).
 *
 * ATENCAO — layout "Barra lateral", escolhido pelo James entre 10 plantas. O
 * que ele resolve, e as versoes anteriores nao:
 *
 * - O Zeus ganha FUNCAO. Antes flutuava num vazio, como enfeite; agora e a
 *   textura da barra. Some o "espaco sobrando" que incomodava desde o comeco —
 *   nao existe sobra, a barra ocupa a esquerda inteira.
 * - Acaba a CAIXA DENTRO DE CAIXA. Os atalhos sao linhas soltas: a propria
 *   barra e o recipiente, entao nada precisa de moldura propria.
 * - A conversa fica com todo o resto da tela — a maior area das 10 plantas.
 *
 * ATENCAO — nao esta em ADMIN_PREFIXES no middleware.ts, e e isso que a mantem
 * aberta. Se alguem acrescentar /ajuda naquela lista, a aluna cai no login e o
 * suporte morre em silencio.
 *
 * ATENCAO — fora do indice de busca de proposito: e canal de quem ja comprou,
 * nao pagina de entrada. Aparecer no Google traria gente pedindo preco — e essa
 * e justamente a conversa que a IA nao faz.
 */

export const metadata: Metadata = {
  title: "Ajuda · Jay Academy",
  description: "Fale com o suporte da Jay Academy.",
  robots: { index: false, follow: false },
};

export default function AjudaPage() {
  return (
    // ATENCAO — 100dvh e nao 100vh: no celular a barra do navegador entra e sai,
    // e com vh o campo de escrever fica escondido atras dela na hora de digitar.
    <div className="flex h-[100dvh] bg-[#101820] font-[family-name:var(--font-corpo)]">
      {/* A barra: marca, atalhos e o Zeus. Some no celular — la a mesma lista
          vive na gaveta das tres barrinhas. */}
      <AtalhosBarra />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* ATENCAO — cabecalho SO no celular. No computador a marca ja esta na
            barra lateral, e repetir aqui seria dizer duas vezes a mesma coisa
            na mesma tela. */}
        <header className="shrink-0 border-b border-[#AC9751]/15 lg:hidden">
          <div className="flex items-center gap-3.5 px-4 py-3.5">
            <Medalhao tamanho={42} />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#AC9751]">
                Jay Academy
              </p>
              <h1 className="font-[family-name:var(--font-marca)] text-[17px] leading-tight text-[#F4F1EA]">
                Suporte
              </h1>
            </div>
            <AtalhosMobile />
          </div>
          <Meandro id="meandro-topo" className="text-[#AC9751]/30" altura={8} />
        </header>

        {/* ATENCAO — a conversa mora DENTRO de um painel, com respiro em volta.
            Foi assim na planta que o James escolheu, e eu tinha construido ela
            encostada nas bordas da tela: a mensagem nascia colada em cima, o
            campo de escrever colado embaixo, e voltou o mesmo vazio que a
            gente ja tinha resolvido. A moldura e o que da forma a conversa. */}
        <div className="flex min-h-0 flex-1 flex-col lg:p-5">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden lg:rounded-2xl lg:border lg:border-[#AC9751]/20 lg:bg-[#0d141b]">
            <AjudaChat saudacao={saudacao()} />
          </section>
        </div>
      </main>
    </div>
  );
}
