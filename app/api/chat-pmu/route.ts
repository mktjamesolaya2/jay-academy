import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APP_URL = process.env.APP_URL || "https://jay-academy.vercel.app";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const MODEL_CHAIN = [
  "deepseek/deepseek-v4-flash:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-31b-it:free",
  "openrouter/free",
];

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatBody = {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
};

export async function POST(req: Request) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Servidor não configurado. Adicione OPENROUTER_API_KEY nas variáveis de ambiente do Vercel.",
        },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Partial<ChatBody>;
    const { messages, temperature = 0.7, max_tokens = 500 } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Campo `messages` é obrigatório e deve ser uma lista não vazia." },
        { status: 400 }
      );
    }

    const totalChars = messages.reduce(
      (acc, m) => acc + (m.content?.length || 0),
      0
    );
    if (totalChars > 50_000) {
      return NextResponse.json(
        { error: "Conversa muito longa. Reinicie o chat e tente de novo." },
        { status: 400 }
      );
    }

    const errors: Array<{ model: string; status: number; message: string }> = [];
    for (const model of MODEL_CHAIN) {
      try {
        const r = await fetch(OPENROUTER_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": APP_URL,
            "X-Title": "PMU CLASS",
          },
          body: JSON.stringify({ model, messages, temperature, max_tokens }),
        });

        if (!r.ok) {
          const errBody = (await r.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          const message = errBody?.error?.message || `Status ${r.status}`;
          errors.push({ model, status: r.status, message });
          console.warn(`[OpenRouter] ${model} falhou: ${r.status} ${message}`);
          continue;
        }

        const data = (await r.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = data?.choices?.[0]?.message?.content;
        if (!reply) {
          errors.push({ model, status: 502, message: "Resposta vazia" });
          continue;
        }

        return NextResponse.json({ reply, model });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro de rede";
        errors.push({ model, status: 0, message });
        console.warn(`[OpenRouter] ${model} erro de rede: ${message}`);
        continue;
      }
    }

    console.error("[/api/chat-pmu] Todos os modelos falharam:", errors);
    return NextResponse.json(
      {
        error:
          "Todos os modelos estão indisponíveis no momento. Tente novamente em alguns minutos ou fale via WhatsApp.",
        details: errors,
      },
      { status: 503 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno.";
    console.error("[/api/chat-pmu] Erro:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
