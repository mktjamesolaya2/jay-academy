"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import {
  responderComoPessoaAction,
  reativarIaAction,
} from "@/app/suporte/actions";

/**
 * Onde o time responde a aluna.
 *
 * ⚠️ Enquanto a conversa está com uma pessoa, **a IA fica calada**. Ela não
 * volta sozinha: se voltasse, responderia por cima de um atendimento delicado
 * e a aluna veria duas vozes se contradizendo. Quem devolve pra IA é o botão
 * aqui embaixo — e só depois que o assunto foi resolvido.
 */
export function SuporteResponder({
  id,
  comPessoa,
}: {
  id: string;
  comPessoa: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();
  const router = useRouter();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || pendente) return;
    setErro(null);
    startTransition(async () => {
      const r = await responderComoPessoaAction(id, t);
      if (r.ok) {
        setTexto("");
        // ⚠️ Recarrega do servidor em vez de acrescentar na tela: assim a
        // mensagem só aparece depois de gravada de verdade. Mostrar antes faria
        // o time achar que respondeu quando a gravação falhou.
        router.refresh();
      } else {
        setErro(r.error ?? "Não consegui enviar.");
      }
    });
  }

  return (
    <div className="border-t border-[#1f1f1f] px-4 py-3">
      {erro && (
        <p className="mb-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] font-medium text-rose-300">
          {erro}
        </p>
      )}

      <form onSubmit={enviar} className="flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // Enter envia, Shift+Enter quebra linha — é o que a mão do time já
            // espera de qualquer chat.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(e);
            }
          }}
          rows={2}
          placeholder="Escreva pra aluna…"
          className="min-h-[46px] min-w-0 flex-1 resize-y rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pendente || !texto.trim()}
          aria-label="Enviar resposta"
          className="btn-primary inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
        >
          {pendente ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} strokeWidth={2.2} />
          )}
        </button>
      </form>

      {comPessoa && (
        <button
          onClick={() =>
            startTransition(async () => {
              await reativarIaAction(id);
              router.refresh();
            })
          }
          disabled={pendente}
          title="A IA volta a responder esta aluna sozinha"
          className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-neutral-500 transition hover:text-white disabled:opacity-40"
        >
          <Bot size={12} strokeWidth={2.2} />
          Devolver pra I.A.
        </button>
      )}
    </div>
  );
}
