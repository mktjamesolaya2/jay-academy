/**
 * Falar com o Gemini no formato **nativo** dele — só pra áudio.
 *
 * ⚠️ Por que existe: **áudio de WhatsApp é `.ogg` (opus)**, e a camada de
 * compatibilidade do Google recusa ogg. Medido nos dois endereços:
 *
 * | formato | compatível (`/openai/chat/completions`) | nativo (`:generateContent`) |
 * |---------|------------------------------------------|-----------------------------|
 * | mp3     | ✅ 200                                   | ✅ 200                       |
 * | wav     | ✅ 200                                   | ✅ 200                       |
 * | ogg     | ❌ 400 "Invalid audio format"            | ✅ 200                       |
 *
 * O Gemini **ouve** ogg. Quem não aceita é o tradutor no meio. Sem isto, na fase
 * do WhatsApp toda mensagem de voz de aluna falharia e cairia pra atendente —
 * e mensagem de voz é justamente como a pessoa explica o problema quando está
 * com pressa ou sem jeito de escrever.
 *
 * ⚠️ Usado **só para áudio**. Texto e print continuam no endereço compatível,
 * que funciona e é o mesmo código da OpenRouter — trocar o que funciona só
 * dobraria a superfície de erro.
 *
 * Tudo aqui é função pura de propósito: o formato do pedido dá pra conferir sem
 * gastar chamada de IA, e um erro de tradução só apareceria com a aluna do outro
 * lado esperando.
 */

export type MensagemOpenAI = {
  role: string;
  content: string | Array<Record<string, unknown>>;
};

type Parte = Record<string, unknown>;

export type PedidoNativo = {
  contents: Array<{ role: "user" | "model"; parts: Parte[] }>;
  systemInstruction?: { parts: Parte[] };
  generationConfig: { temperature: number; maxOutputTokens: number };
};

/**
 * O tipo MIME que o Gemini espera, a partir do formato curto que a gente já usa
 * (`formatoDoAudio`, em `suporte-anexo.ts`).
 *
 * ⚠️ `mp3` → `audio/mpeg`, não `audio/mp3`: o segundo não é tipo MIME de
 * verdade e o Gemini recusa.
 */
export function mimeDeAudio(formato: string): string {
  const f = formato.toLowerCase().replace(/^x-/, "");
  const mapa: Record<string, string> = {
    mp3: "audio/mpeg",
    mpeg: "audio/mpeg",
    mpga: "audio/mpeg",
    wav: "audio/wav",
    wave: "audio/wav",
    // WhatsApp: `.ogg` com opus dentro. O Gemini reconhece pelo container.
    ogg: "audio/ogg",
    opus: "audio/ogg",
    oga: "audio/ogg",
    flac: "audio/flac",
    aac: "audio/aac",
    aiff: "audio/aiff",
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    webm: "audio/webm",
  };
  return mapa[f] ?? `audio/${f}`;
}

/** Quebra `data:image/png;base64,AAA` em tipo e conteúdo. */
function partirDataUrl(url: string): Parte | null {
  const m = url.match(/^data:([a-z0-9.+/-]+);base64,(.*)$/is);
  if (!m) return null;
  return { inline_data: { mime_type: m[1].toLowerCase(), data: m[2] } };
}

/** Traduz UMA parte do formato OpenAI pro formato do Gemini. */
function traduzirParte(p: Record<string, unknown>): Parte | null {
  const tipo = p.type;

  if (tipo === "text") {
    const t = typeof p.text === "string" ? p.text : "";
    return t ? { text: t } : null;
  }

  if (tipo === "image_url") {
    const url = (p.image_url as { url?: string } | undefined)?.url ?? "";
    // Só `data:` — o Gemini não busca URL externa por conta própria, e mandar
    // um link faria ele responder sobre uma imagem que nunca viu.
    return partirDataUrl(url);
  }

  if (tipo === "input_audio") {
    const a = p.input_audio as { data?: string; format?: string } | undefined;
    if (!a?.data) return null;
    return {
      inline_data: {
        mime_type: mimeDeAudio(a.format ?? "mp3"),
        data: a.data,
      },
    };
  }

  return null;
}

/**
 * Converte a conversa inteira (formato OpenAI, que é o que o resto do suporte
 * já monta) pro pedido nativo do Gemini.
 *
 * ⚠️ No Gemini o papel do assistente chama `model`, não `assistant` — e a
 * instrução do sistema **sai de dentro da conversa** e vira campo próprio. Errar
 * isso não dá erro: o modelo passa a tratar as regras como se fossem fala da
 * aluna, e aí ele inventa preço, promete coisa e ignora o "chame uma pessoa".
 */
export function paraGeminiNativo(
  mensagens: MensagemOpenAI[],
  opcoes: { temperature: number; maxOutputTokens: number }
): PedidoNativo {
  const sistema: Parte[] = [];
  const contents: PedidoNativo["contents"] = [];

  for (const m of mensagens) {
    const partes: Parte[] =
      typeof m.content === "string"
        ? m.content.trim()
          ? [{ text: m.content }]
          : []
        : m.content.map(traduzirParte).filter((p): p is Parte => p !== null);

    if (!partes.length) continue;

    if (m.role === "system") {
      sistema.push(...partes);
      continue;
    }
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: partes,
    });
  }

  return {
    contents,
    ...(sistema.length ? { systemInstruction: { parts: sistema } } : {}),
    generationConfig: {
      temperature: opcoes.temperature,
      maxOutputTokens: opcoes.maxOutputTokens,
    },
  };
}

/** O endereço nativo daquele modelo. */
export function urlNativa(modelo: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    modelo
  )}:generateContent`;
}

/**
 * A resposta em texto.
 *
 * ⚠️ O nativo devolve **uma lista de partes**, e modelo que pensa pode mandar
 * parte de raciocínio junto (`thought: true`). Pegar só `parts[0].text` traria
 * o rascunho pra aluna; juntar tudo traria também. Aqui as partes de pensamento
 * são descartadas e o resto é juntado.
 */
export function lerRespostaNativa(json: unknown): string | null {
  const c = (json as { candidates?: Array<{ content?: { parts?: unknown[] } }> })
    ?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(c)) return null;

  const texto = c
    .filter((p): p is { text: string; thought?: boolean } => {
      const o = p as { text?: unknown; thought?: unknown };
      return typeof o?.text === "string" && o.thought !== true;
    })
    .map((p) => p.text)
    .join("")
    .trim();

  return texto || null;
}

/** A mensagem de erro que o Google devolve, pro log dizer o que houve. */
export function erroNativo(corpo: string): string {
  const m = corpo.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  return m ? m[1] : corpo.slice(0, 160);
}
