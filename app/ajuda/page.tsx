import type { Metadata } from "next";
import { AjudaChat } from "@/components/ajuda-chat";
import { Meandro, Medalhao } from "@/components/marca-jayo";
import { saudacao } from "@/lib/suporte-acesso";

/**
 * A página de atendimento da aluna — **pública, sem login**.
 *
 * Visual: sistema oficial da marca JAY.O (ouro #AC9751, preto #101820,
 * off-white, serifada + Poppins, meandro e medalhão). James escolheu esta
 * direção entre três: *"Concierge"* — atendimento de marca, não widget de
 * suporte.
 *
 * ⚠️ Não está em `ADMIN_PREFIXES` no `middleware.ts`, e é isso que a mantém
 * aberta. Se alguém acrescentar `/ajuda` naquela lista, a aluna cai no login e
 * o suporte morre em silêncio.
 *
 * ⚠️ Fora do índice de busca de propósito: é canal de quem já comprou, não
 * página de entrada. Aparecer no Google traria gente pedindo preço — e essa é
 * justamente a conversa que a IA não faz.
 */

export const metadata: Metadata = {
  title: "Ajuda · Jay Academy",
  description: "Fale com o suporte da Jay Academy.",
  robots: { index: false, follow: false },
};

export default function AjudaPage() {
  return (
    // ⚠️ `100dvh` e não `100vh`: no celular a barra do navegador entra e sai, e
    // com `vh` o campo de escrever fica escondido atrás dela bem na hora de
    // digitar.
    <main className="flex min-h-[100dvh] flex-col bg-[#101820] font-[family-name:var(--font-corpo)]">
      {/* ⚠️ Cabeçalho grudado no topo: numa conversa longa no celular, sem isto
          a pessoa rola e perde a referência de onde está. */}
      <header className="sticky top-0 z-10 border-b border-[#AC9751]/15 bg-[#101820]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3.5 px-4 py-3.5 sm:px-6">
          <Medalhao tamanho={42} />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#AC9751]">
              Jay Academy
            </p>
            <h1 className="font-[family-name:var(--font-marca)] text-[17px] leading-tight text-[#F4F1EA] sm:text-[19px]">
              Suporte
            </h1>
          </div>
          <p className="ml-auto shrink-0 text-right text-[11px] leading-tight text-[#F4F1EA]/40">
            Segunda a sexta
          </p>
        </div>
        {/* A grega fecha o cabeçalho — é a assinatura da marca. */}
        <Meandro id="meandro-topo" className="text-[#AC9751]/35" altura={9} />
      </header>

      <AjudaChat saudacao={saudacao()} />
    </main>
  );
}
