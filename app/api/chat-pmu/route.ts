import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests, payloadTooLarge } from "@/lib/rate-limit";
import { MODEL_CHAIN } from "@/lib/chat-models";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APP_URL = process.env.APP_URL || "https://jay-academy.vercel.app";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

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
    // Anti-abuso de custo (chave OpenRouter): cap de tamanho + rate-limit por IP.
    if (payloadTooLarge(req, 128 * 1024)) {
      return NextResponse.json({ error: "Payload muito grande." }, { status: 413 });
    }
    if (!(await rateLimit("chat-pmu", req, 20, 60)).ok) {
      return tooManyRequests() as NextResponse;
    }
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
          /**
           * ID de modelo que não existe mais era o bug de 17/07: falhava em
           * silêncio, o catch engolia e o visitante só sentia lentidão. Este
           * caso vai pro log como ERRO, não warn, e diz o que fazer.
           */
          if (r.status === 400 || r.status === 404) {
            console.error(
              `[OpenRouter] modelo "${model}" foi recusado (${r.status}: ${message}). ` +
                `Pode ter sido aposentado — rodar "npm run checar-modelos" e corrigir lib/chat-models.ts.`
            );
          } else {
            console.warn(`[OpenRouter] ${model} falhou: ${r.status} ${message}`);
          }
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
