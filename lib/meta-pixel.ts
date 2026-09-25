// Quem é o Pixel do Meta e em que páginas ele entra.
//
// ⚠️ Módulo FOLHA de propósito: não importa nada. O id precisava ser
// verificável por teste, e lib/meta-tracking.ts usa os aliases `@/lib/...`,
// que o runner de teste do node não resolve — é por isso que aquele arquivo
// nunca teve teste. Tirando a constante de lá, ela passa a ter.
//
// E resolve o problema que motivou este arquivo: o id vivia em DUAS constantes
// independentes (aqui e na lib/meta-capi.ts), iguais por coincidência. Trocar
// o pixel e esquecer uma mandava o navegador pra um pixel e o servidor pra
// outro: a deduplicação por event_id morre e o mesmo evento é contado duas
// vezes, ou nenhuma — sem nenhum sintoma em tela.

/**
 * O Pixel do Meta. FONTE ÚNICA: o navegador (buildPixelInitScript, em
 * lib/meta-tracking.ts) e a API de Conversões (lib/meta-capi.ts) leem daqui.
 */
export const META_PIXEL_ID = "1841776429524244";

/**
 * O endpoint da API de Conversões — do MESMO pixel, por construção.
 *
 * Fica aqui, e não na lib/meta-capi.ts, justamente pra não haver dois lugares
 * onde o id aparece. Assim "o servidor manda pro mesmo pixel do navegador" não
 * é uma coincidência que precisa ser verificada: é a única forma possível.
 */
export const META_CAPI_URL = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;

/** LPs de venda e de captação de evento — as únicas páginas que levam o Pixel. */
export const PIXEL_SLUGS = [
  "basic-magic-shadow",
  "basic-nanofios",
  "curso-online-profissao-remove",
  "fio-a-fio-realista-by-james-olaya",
  // As prévias v2 e v3 da oficial (23/09): recebem tráfego pago para comparar
  // as versões, então medem no mesmo pixel.
  "fio-a-fio-realista-v2",
  "fio-a-fio-realista-v3",
  "metodo-shadow-pro",
  "pdv-lips-sense-technique",
  "pmuclass",
  // Evento pago Protocolo Labial (24/09): ingresso de R$ 27 na Hotmart; o
  // clique no checkout (CliqueCheckout) e o InitiateCheckout da Hotmart medem a ida.
  "protocolo-labial",
  // Inmersión Pelo a Pelo v2 (25/09): evento ao vivo de U$ 47 na Hotmart; mede
  // o CliqueCheckout do clique. A v1 (data vencida) segue sem pixel.
  "inmersion-pelo-a-pelo-v2",
  // JAY TRANSFORMA (10/09): não é curso, é a captação do evento gratuito — o
  // Lead do formulário de inscrição é a conversão que a campanha otimiza.
  "transforma",
  // As ofertas de fechamento do Transforma. Páginas de venda de verdade: o Lead
  // do formulário e o clique no checkout (CliqueCheckout) são o que interessa.
  "jaytransforma-beauty",
  "jaytransforma-remove",
  "jaytransforma-start",
];

/** O Pixel vale nesta página? */
export function slugHasPixel(slug: string): boolean {
  return PIXEL_SLUGS.includes(slug);
}
