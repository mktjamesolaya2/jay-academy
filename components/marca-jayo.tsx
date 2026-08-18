/**
 * O **medalhão** da marca JAY.O.
 *
 * ⚠️ Aqui morava também o meandro (a grega). Ele saiu quando o James pediu
 * "sem esses meandros": num filete fino atravessando a tela ele virava um
 * tracejado sujo em vez de assinatura — funcionava na maquete, não na tela.
 * Está no histórico do git se um dia voltar a fazer sentido, em tamanho maior.
 *
 * ⚠️ Vive num arquivo próprio porque é identidade, não decoração de uma
 * tela. Desenhado em SVG, não em imagem: fica nítido em qualquer tela,
 * pesa alguns bytes e acompanha a cor do texto ao redor — então serve tanto
 * sobre o preto quanto sobre o off-white sem precisar de segundo arquivo.
 */

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
