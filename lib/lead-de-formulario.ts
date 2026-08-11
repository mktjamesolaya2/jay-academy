import "server-only";
import type { Lead } from "./lead-campos";

/**
 * Transforma um envio de formulário num Lead completo.
 *
 * Os formulários do portal pedem três coisas — nome, WhatsApp e e-mail. Todo o
 * resto que dá pra saber (de que página veio, de que anúncio, qual campanha)
 * está no referer e nos campos escondidos, e HOJE é jogado fora: o payload que
 * sai pro Clint leva name/email/phone/form_slug e mais nada. É informação de
 * origem de venda indo pro lixo em todo lead.
 *
 * O que vier a mais no formulário entra em `campos` sem precisar de código
 * novo: se amanhã uma LP perguntar "já trabalha na área", o campo viaja.
 */

/** Campos que já viajam em cima, não em `campos`, e o anti-bot. */
const JA_TRATADOS = new Set([
  "name", "nome", "email", "e-mail",
  "whatsapp", "phone", "telefone", "celular",
  "website", "__slug", "slug", "form_id", "referer", "post_id", "queried_id",
]);

/** Guarda só o que é texto curto: campo gigante costuma ser lixo de plugin. */
function limpo(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, 2000);
}

export function leadDeFormulario(entrada: {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  /** slug da página/formulário de origem */
  origem: string;
  /** url completa de onde a pessoa estava (referer) */
  url?: string;
  /** todo o resto do formulário, cru */
  extras?: Record<string, unknown>;
  /** tags a aplicar neste lead (a origem entra sozinha) */
  tags?: string[];
}): Lead {
  const campos: Record<string, string> = {};

  // Origem: a página e a URL inteira.
  campos.pagina = entrada.origem;
  if (entrada.url) campos.url = entrada.url;

  // utm/anúncio saem da query string da URL de origem — é lá que o Meta e o
  // Google penduram tudo. Sem isto, não dá pra saber qual campanha trouxe.
  if (entrada.url) {
    try {
      const q = new URL(entrada.url).searchParams;
      for (const k of [
        "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
        "fbclid", "gclid",
      ]) {
        const v = q.get(k);
        if (v) campos[k] = v.slice(0, 300);
      }
    } catch {}
  }

  // DDI: o Elementor manda o país separado quando o campo de telefone tem
  // seletor de bandeira; se não vier, deduz do + no número.
  const ddi = limpo(entrada.extras?.country_code ?? entrada.extras?.ddi);
  if (ddi) campos.ddi = ddi;
  else if (entrada.telefone.startsWith("+")) {
    campos.ddi = entrada.telefone.slice(0, 3);
  }

  for (const [k, v] of Object.entries(entrada.extras ?? {})) {
    const chave = k.trim().toLowerCase();
    if (JA_TRATADOS.has(chave) || chave.startsWith("__")) continue;
    const valor = limpo(v);
    if (valor) campos[chave] = valor;
  }

  return {
    id: entrada.id,
    nome: entrada.nome,
    email: entrada.email,
    telefone: entrada.telefone,
    enviado_em: new Date().toISOString(),
    // a origem sempre vira tag: é como o CRM separa a campanha sem configuração
    tags: [...new Set([entrada.origem, ...(entrada.tags ?? [])])].filter(Boolean),
    campos,
  };
}
