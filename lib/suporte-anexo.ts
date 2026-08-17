/**
 * Print e áudio que o aluno manda junto da mensagem.
 *
 * ⚠️ Pura e testada de propósito: monta o corpo que vai pro modelo. Já perdi
 * meia hora com um erro que só aparecia na chamada real (traço longo num
 * cabeçalho) — o que dá pra conferir sem gastar IA, se confere aqui.
 */

export type Anexo = {
  tipo: "imagem" | "audio";
  /** `data:image/png;base64,...` ou `data:audio/ogg;base64,...` */
  dataUrl: string;
};

/** Teto por anexo: o WhatsApp não manda print gigante, e isso vira token. */
export const MAX_BYTES_ANEXO = 4 * 1024 * 1024;

/** O formato que a OpenRouter espera no `input_audio` (mp3, wav, ogg…). */
export function formatoDoAudio(dataUrl: string): string {
  const m = dataUrl.match(/^data:audio\/([a-z0-9.+-]+);/i);
  if (!m) return "mp3";
  const bruto = m[1].toLowerCase();
  // `audio/x-m4a` → `m4a`; `audio/mpeg` → `mp3`.
  if (bruto === "mpeg") return "mp3";
  return bruto.replace(/^x-/, "");
}

/** Só a parte base64, sem o prefixo `data:...;base64,`. */
export function soBase64(dataUrl: string): string {
  const i = dataUrl.indexOf("base64,");
  return i === -1 ? dataUrl : dataUrl.slice(i + 7);
}

/** Tamanho aproximado do anexo, a partir do base64. */
export function tamanhoAproximado(dataUrl: string): number {
  const b64 = soBase64(dataUrl);
  return Math.floor((b64.length * 3) / 4);
}

export function anexoValido(a: Anexo): { ok: boolean; erro?: string } {
  if (!/^data:(image|audio)\//i.test(a.dataUrl)) {
    return { ok: false, erro: "Formato não reconhecido." };
  }
  if (tamanhoAproximado(a.dataUrl) > MAX_BYTES_ANEXO) {
    return { ok: false, erro: "Arquivo muito grande (máximo 4 MB)." };
  }
  return { ok: true };
}

/**
 * Monta o `content` da mensagem do aluno no formato da OpenRouter.
 *
 * Texto sozinho continua sendo string — só vira lista quando há anexo, pra não
 * mudar o formato de toda conversa por causa de um caso.
 */
export function montarConteudo(
  texto: string,
  anexos: Anexo[]
): string | Array<Record<string, unknown>> {
  if (!anexos.length) return texto;

  const partes: Array<Record<string, unknown>> = [];
  // O texto vem primeiro: é o que diz o que olhar na imagem.
  if (texto.trim()) partes.push({ type: "text", text: texto });

  for (const a of anexos) {
    if (a.tipo === "imagem") {
      partes.push({ type: "image_url", image_url: { url: a.dataUrl } });
    } else {
      partes.push({
        type: "input_audio",
        input_audio: {
          data: soBase64(a.dataUrl),
          format: formatoDoAudio(a.dataUrl),
        },
      });
    }
  }
  return partes;
}

/** Qual fila de modelos usar, pelo que veio junto. */
export function tipoDeConversa(
  anexos: Anexo[]
): "texto" | "imagem" | "audio" {
  if (anexos.some((a) => a.tipo === "audio")) return "audio";
  if (anexos.some((a) => a.tipo === "imagem")) return "imagem";
  return "texto";
}
