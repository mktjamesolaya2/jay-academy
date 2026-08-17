/**
 * De quem a IA do suporte pede resposta.
 *
 * ⚠️ Existe porque a conta grátis da OpenRouter dá **~50 mensagens por dia** —
 * acabou num dia de testes, e acabaria numa manhã de suporte de verdade. O
 * Gemini tem camada gratuita muito maior, lê imagem e ouve áudio no mesmo
 * modelo.
 *
 * O truque que evita reescrever o suporte inteiro: o Google publica um endereço
 * **compatível com o formato da OpenAI** — o mesmo `chat/completions` que a
 * OpenRouter usa. Então trocar de fornecedor é trocar endereço, chave e a lista
 * de modelos. O corpo da mensagem, os anexos e as regras continuam iguais.
 *
 * A escolha é por variável de ambiente, e é automática: **se existir
 * `GEMINI_API_KEY`, usa Gemini**; senão volta pra OpenRouter. Assim o James
 * cola a chave e pronto, sem mexer em código. `IA_PROVEDOR=openrouter` força o
 * antigo, se um dia precisar comparar os dois.
 */

export type NomeProvedor = "gemini" | "openrouter";

/**
 * ⚠️ **O áudio de WhatsApp é `.ogg` (opus), e o endereço compatível do Google
 * recusa `.ogg` com 400 "Invalid audio format".** Medido, não suposto:
 *
 * | formato | endereço compatível | endereço nativo do Gemini |
 * |---------|--------------------|---------------------------|
 * | mp3     | ✅ 200             | ✅ 200                     |
 * | wav     | ✅ 200             | ✅ 200                     |
 * | ogg     | ❌ 400             | ✅ 200                     |
 *
 * Ou seja: o Gemini OUVE ogg — quem não aceita é a camada de compatibilidade.
 * Pra atender áudio de WhatsApp é preciso falar o formato nativo dele
 * (`:generateContent`, chave no cabeçalho `x-goog-api-key`, anexo em
 * `inline_data`), que é um pedido de outro formato.
 *
 * Enquanto isso não existe, áudio ogg falha e a conversa vai pra uma pessoa —
 * que é o comportamento certo pra hoje, porque a tela do suporte ainda é teste
 * com upload de arquivo. Vira problema de verdade na fase do WhatsApp.
 */
export const AUDIO_OGG_NAO_PASSA = true;

export type Provedor = {
  nome: NomeProvedor;
  endpoint: string;
  chave: string;
  /** Cabeçalhos que só aquele fornecedor entende. */
  cabecalhos: Record<string, string>;
  /**
   * Campos extras no corpo do pedido.
   *
   * ⚠️ Não dá pra mandar os mesmos pros dois: `reasoning` é invenção da
   * OpenRouter e o Gemini recusa o pedido inteiro com campo desconhecido.
   */
  extras: Record<string, unknown>;
  filas: {
    texto: readonly string[];
    imagem: readonly string[];
    audio: readonly string[];
  };
};

/**
 * Cadeia do Gemini — **cada um testado com chamada real**, não escolhido pela
 * lista de modelos.
 *
 * ⚠️ Aparecer em `GET /models` NÃO quer dizer que funciona. O `gemini-2.5-flash`
 * estava listado na conta e mesmo assim respondeu 404: *"no longer available to
 * new users"*. Se a lista tivesse sido usada como verdade, o suporte entraria no
 * ar quebrado.
 *
 * ⚠️ E o mais novo não vai primeiro: `gemini-3.7-flash` devolveu 503 *"high
 * demand"* no teste. Modelo congestionado na frente da fila faz TODA mensagem
 * pagar uma ida-e-volta perdida antes de ser respondida — foi exatamente o bug
 * que deixou o chat do PMU CLASS lento (`lib/chat-models.ts`).
 *
 * Aqui **o mesmo modelo lê texto e imagem**, então as duas filas são iguais.
 * Áudio tem uma ressalva — ver `AUDIO_OGG_NAO_PASSA` abaixo.
 */
const GEMINI = [
  // Recomendado pelo próprio Google na mensagem de erro do 2.5. Testado: 200.
  "gemini-3.6-flash",
  // Mais leve e com cota maior: é quem atende quando o primeiro satura.
  "gemini-3.5-flash-lite",
  // Apelido que o Google reaponta sozinho — a rede que impede esta lista de
  // envelhecer sem ninguém perceber.
  "gemini-flash-latest",
] as const;

/**
 * Monta o fornecedor a partir do ambiente. Devolve `null` quando não há chave
 * nenhuma — quem chama transforma isso em erro claro na tela.
 */
export function escolherProvedor(
  env: Record<string, string | undefined>,
  filasOpenRouter: {
    texto: readonly string[];
    imagem: readonly string[];
    audio: readonly string[];
  }
): Provedor | null {
  const forcado = (env.IA_PROVEDOR ?? "").trim().toLowerCase();
  const gemini = (env.GEMINI_API_KEY ?? "").trim();
  const openrouter = (env.OPENROUTER_API_KEY ?? "").trim();

  const querGemini = forcado === "gemini" || (!forcado && !!gemini);

  if (querGemini && gemini) {
    return {
      nome: "gemini",
      endpoint:
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      chave: gemini,
      cabecalhos: {},
      extras: {},
      filas: { texto: GEMINI, imagem: GEMINI, audio: GEMINI },
    };
  }

  if (openrouter) {
    return {
      nome: "openrouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      chave: openrouter,
      // ⚠️ Só ASCII. Cabeçalho HTTP não aceita acento nem traço longo: com
      // "Jay Academy — Suporte" o fetch estourava ANTES de sair da máquina, nos
      // 4 modelos, e o erro chegava como "todos os modelos indisponíveis".
      cabecalhos: { "X-Title": "Jay Academy Suporte" },
      // Pede pra não devolver os tokens de raciocínio.
      extras: { reasoning: { exclude: true } },
      filas: filasOpenRouter,
    };
  }

  return null;
}

/**
 * A frase que aparece quando acabou a cota do dia.
 *
 * ⚠️ Sem isso o erro sai como "todos os modelos indisponíveis", que manda
 * procurar problema onde não tem — foi exatamente o que aconteceu na OpenRouter.
 */
export function recadoDeLimite(p: NomeProvedor): string {
  return p === "gemini"
    ? "Limite diário gratuito do Gemini atingido. Volta amanhã, ou ative o faturamento no Google AI Studio pra subir a cota."
    : "Limite diário de mensagens gratuitas da OpenRouter atingido (são ~50 por dia na conta grátis). Volta amanhã, ou adicione créditos pra subir o limite.";
}
