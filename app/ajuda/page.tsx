import type { Metadata } from "next";
import { AjudaChat } from "@/components/ajuda-chat";
import { saudacao } from "@/lib/suporte-acesso";

/**
 * A página de atendimento da aluna — **pública, sem login**.
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
    <main className="flex min-h-[100dvh] flex-col bg-[#0a0a0a] px-4 py-6 sm:px-6 sm:py-10">
      <header className="mx-auto mb-6 w-full max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#AC9751]">
          Jay Academy
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold tracking-[-0.01em] text-white sm:text-[26px]">
          Suporte dos cursos
        </h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-neutral-500">
          Segunda a sexta. Se precisar, uma pessoa do time entra na conversa.
        </p>
      </header>

      {/* ⚠️ A saudação vem do servidor, no fuso de Brasília. Calculada no
          navegador, sairia "Bom dia" pra quem está com o relógio do celular em
          outro fuso — e ninguém escreve "bom dia" às 22h. */}
      <AjudaChat saudacao={saudacao()} />
    </main>
  );
}
