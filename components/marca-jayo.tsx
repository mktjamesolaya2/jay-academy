/**
 * Os dois sinais da marca JAY.O: o **meandro** grego e o **medalhão**.
 *
 * ⚠️ Vivem num arquivo próprio porque são identidade, não decoração de uma
 * tela. Desenhados em SVG, não em imagem: ficam nítidos em qualquer tela,
 * pesam alguns bytes e acompanham a cor do texto ao redor — então servem tanto
 * sobre o preto quanto sobre o off-white sem precisar de segundo arquivo.
 */

/**
 * A grega (meandro) como um filete que se repete.
 *
 * ⚠️ O `id` é obrigatório e precisa ser único NA PÁGINA. Dois `<pattern>` com o
 * mesmo id fazem o navegador usar só o primeiro, e o segundo filete some sem
 * dar erro nenhum — some calado, que é o pior tipo de bug visual.
 */
export function Meandro({
  id,
  className,
  altura = 10,
}: {
  id: string;
  className?: string;
  altura?: number;
}) {
  const largura = altura * 1.4;
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="100%"
      height={altura}
      preserveAspectRatio="none"
      focusable="false"
    >
      <defs>
        <pattern
          id={id}
          width={largura}
          height={altura}
          patternUnits="userSpaceOnUse"
        >
          {/* A volta da grega: desce, corre, sobe, volta pra dentro. */}
          <path
            d={`M0 ${altura - 1} V1 H${largura * 0.72} V${altura * 0.68} H${largura * 0.3} V${altura * 0.38} H${largura * 0.52}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </pattern>
      </defs>
      <rect width="100%" height={altura} fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * O medalhão — o anel com o monograma.
 *
 * É quem dá rosto ao atendimento sem usar foto de pessoa. ⚠️ E sem rosto
 * gerado por IA: o James rejeita isso, e com razão — numa tela de suporte, um
 * rosto falso é exatamente o que faz a pessoa desconfiar de quem está falando.
 */
export function Medalhao({ tamanho = 44 }: { tamanho?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: tamanho, height: tamanho }}
      className="relative inline-flex shrink-0 items-center justify-center rounded-full border border-[#AC9751]/45"
    >
      {/* Anel interno: o detalhe que faz parecer cunhado, não desenhado. */}
      <span className="absolute inset-[3px] rounded-full border border-[#AC9751]/25" />
      <span
        style={{ fontSize: tamanho * 0.34 }}
        className="font-[family-name:var(--font-marca)] leading-none text-[#AC9751]"
      >
        J
      </span>
    </span>
  );
}
