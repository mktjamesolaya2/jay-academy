import "server-only";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APP_URL = process.env.APP_URL || "https://jay-academy.vercel.app";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Mesma cadeia de fallback do chat-pmu (modelos grátis do OpenRouter).
const MODEL_CHAIN = [
  "deepseek/deepseek-v4-flash:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-31b-it:free",
  "openrouter/free",
];

/** Tira tags/entidades HTML e colapsa espaços pra mandar texto limpo pro modelo. */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const KIND_LABEL: Record<string, string> = {
  form: "um formulário",
  website: "uma página de um site",
  lp: "uma landing page",
};

/**
 * Lê o conteúdo de uma página e devolve um resumo curto (1-2 frases) em pt-BR.
 * Usa OpenRouter com fallback de modelos. Lança erro se a chave não estiver
 * configurada ou se todos os modelos falharem.
 */
export async function generatePageSummary(opts: {
  title: string;
  body: string;
  kind?: string;
}): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY não configurada. Funciona em produção (Vercel); pra testar local, adicione a chave no .env.local."
    );
  }

  const text = stripHtml(opts.body).slice(0, 6000);
  const kindLabel = (opts.kind && KIND_LABEL[opts.kind]) || "uma página";

  const messages = [
    {
      role: "system",
      content:
        "Você lê o conteúdo de páginas web e escreve um resumo curto, claro e objetivo em português do Brasil. Sem markdown, sem links, sem inventar nada. No máximo 3 linhas (2 a 3 frases curtas).",
    },
    {
      role: "user",
      content: `Resuma ${kindLabel} chamada "${opts.title}". Em no máximo 3 linhas, diga do que se trata e qual o objetivo dela. Conteúdo:\n\n${text}`,
    },
  ];

  const errors: string[] = [];
  for (const model of MODEL_CHAIN) {
    try {
      const r = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": APP_URL,
          "X-Title": "Jay Academy Portal",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.4,
          max_tokens: 220,
        }),
      });

      if (!r.ok) {
        errors.push(`${model}: ${r.status}`);
        continue;
      }
      const data = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const reply = data?.choices?.[0]?.message?.content?.trim();
      if (reply) return reply;
      errors.push(`${model}: resposta vazia`);
    } catch (e) {
      errors.push(`${model}: ${e instanceof Error ? e.message : "erro de rede"}`);
    }
  }

  throw new Error(
    "Não consegui gerar o resumo agora (modelos indisponíveis). " +
      errors.join("; ")
  );
}
