import type { Metadata } from "next";
import { AjudaChat } from "@/components/ajuda-chat";
import { Meandro, Medalhao } from "@/components/marca-jayo";
import { AtalhosDesktop, AtalhosMobile } from "@/components/ajuda-atalhos";
import { saudacao } from "@/lib/suporte-acesso";

/**
 * A página de atendimento da aluna — **pública, sem login**.
 *
 * Visual: sistema oficial da marca JAY.O (ouro #AC9751, preto #101820,
 * off-white, serifada + Poppins, meandro e medalhão). Direção "Concierge",
 * escolhida pelo James entre três.
 *
 * ⚠️ **Tudo mora dentro de UM painel**, com altura definida. A primeira versão
 * deixava conversa, cabeçalho e campo de escrever soltos na página: num monitor
 * de 1900px isso virava uma faixa listrada atravessando a tela, um balão no
 * topo e o campo boiando lá embaixo. James: *"ainda me incomoda esse tanto de
 * espaço sobrando"*.
 *
 * Fechando num objeto só, o espaço que sobra deixa de ser buraco e vira respiro
 * em volta de uma peça. É a diferença entre uma página com pedaços e um
 * produto.
 *
 * ⚠️ Não está em `ADMIN_PREFIXES` no `middleware.ts`, e é isso que a mantém
 * aberta. Se alguém acrescentar `/ajuda` naquela lista, a aluna cai no login e
 * o suporte morre em silêncio.
 *
 * ⚠️ Fora do índice de busca de propósito: é canal de quem já comprou, não
 * página de entrada. Aparecer no Google traria gente pedindo preço — e essa é
 * justamente a conversa que a IA não faz.
 */

/**
 * A máscara que faz o Zeus sumir na borda em vez de recortar.
 *
 * ⚠️ Copiada do tratamento da LP do Jay.O Laser, não inventada: são dois
 * degradês somados — some pra direita (pra não brigar com a conversa) e some em
 * cima e embaixo (pra não encostar nas bordas da tela). Sem eles a imagem
 * termina numa linha reta e denuncia que é uma foto colada.
 */
const MASCARA_ZEUS =
  "linear-gradient(to right, black 0%, black 18%, rgba(0,0,0,0.5) 45%, transparent 75%), linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)";

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
    <main className="relative flex min-h-[100dvh] flex-col bg-[#101820] font-[family-name:var(--font-corpo)] lg:items-center lg:justify-center lg:p-8">
      {/* Brilho dourado de fundo, quase imperceptível. Sem ele o preto atrás do
          painel fica chapado e o painel parece colado numa parede. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "radial-gradient(60rem 40rem at 50% 0%, rgba(172,151,81,0.07), transparent 70%)",
        }}
      />

      {/* ⚠️ O Zeus da LP do Jay.O Laser, no MESMO tratamento de lá — James
          pediu esse efeito. Encostado na esquerda, sangrando pra fora da tela e
          desaparecendo na máscara. É ele que dá fundo ao vazio dos lados sem
          disputar atenção com a conversa: opacidade baixa, atrás de tudo e
          sem capturar clique.

          Só no computador. No celular o painel ocupa a tela inteira e não
          sobraria nada dele pra ver — seria peso de imagem por nada, no
          aparelho de quem tem menos banda. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/laser/assets/zeus-BWpgiY3L.jpg"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute -left-16 bottom-0 top-0 z-0 hidden h-full w-auto lg:block"
        style={{
          objectFit: "contain",
          objectPosition: "left center",
          opacity: 0.45,
          maskImage: MASCARA_ZEUS,
          WebkitMaskImage: MASCARA_ZEUS,
        }}
      />

      {/* ⚠️ Painel e widgets são peças IRMÃS, lado a lado — não uma coluna
          grudada dentro do chat. James: *"vamos separar ele do chat, e
          posicionar ele à direita como se fosse widgets"*. `items-stretch` faz
          os widgets terminarem na mesma altura do painel, senão os dois blocos
          flutuam desencontrados e a composição desmonta. */}
      <div className="relative z-10 flex w-full flex-1 flex-col lg:h-[min(80dvh,46rem)] lg:w-auto lg:flex-none lg:flex-row lg:items-stretch lg:gap-5">
      <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden lg:h-full lg:w-[44rem] lg:flex-none lg:rounded-3xl lg:border lg:border-[#AC9751]/20 lg:bg-[#0d141b] lg:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
        <header className="sticky top-0 z-30 shrink-0 bg-[#101820]/95 backdrop-blur lg:static lg:bg-transparent lg:backdrop-blur-none">
          <div className="flex items-center gap-3.5 px-4 py-3.5 sm:px-6">
            <Medalhao tamanho={42} />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#AC9751]">
                Jay Academy
              </p>
              <h1 className="font-[family-name:var(--font-marca)] text-[17px] leading-tight text-[#F4F1EA] sm:text-[19px]">
                Suporte
              </h1>
            </div>
            {/* As três barrinhas — só no celular, onde não cabe a coluna. */}
            <AtalhosMobile />
          </div>
          {/* ⚠️ A grega agora vive DENTRO do painel. Atravessando a tela toda
              ela virava uma faixa listrada de 1900px — assinatura demais, e a
              assinatura só funciona pequena. */}
          <Meandro id="meandro-topo" className="text-[#AC9751]/30" altura={8} />
        </header>

        <AjudaChat saudacao={saudacao()} />
      </section>

      <AtalhosDesktop />
      </div>
    </main>
  );
}
