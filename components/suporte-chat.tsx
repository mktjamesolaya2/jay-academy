"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Paperclip, RotateCcw, Send, UserRound, X } from "lucide-react";
import { reativarIaAction } from "@/app/suporte/actions";

type Msg = { de: "aluno" | "ia" | "pessoa"; texto: string; anexo?: string };
type Anexo = { tipo: "imagem" | "audio"; dataUrl: string; nome: string };

/**
 * A tela onde o James treina o suporte.
 *
 * ⚠️ Fase 1 do projeto: **nenhum WhatsApp conectado**. Ele conversa aqui como
 * se fosse um aluno, vê o que a IA responde e vai corrigindo a base ao lado.
 * Só quando as respostas estiverem boas é que vale conectar um número — e aí
 * pela API oficial, porque biblioteca não oficial arrisca banir o número dele.
 *
 * O balão fica do lado do aluno pra ele bater o olho e sentir se a resposta
 * "soa" como WhatsApp: curta, sem markdown, sem cara de robô.
 */
export function SuporteChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [anexo, setAnexo] = useState<Anexo | null>(null);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [aguardandoPessoa, setAguardandoPessoa] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pensando, setPensando] = useState(false);
  const [, startTransition] = useTransition();
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, pensando]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    // Print sem legenda é comum — o aluno manda só a imagem.
    if ((!t && !anexo) || pensando) return;
    setErro(null);
    setTexto("");
    const enviado = anexo;
    setAnexo(null);
    setMsgs((m) => [
      ...m,
      {
        de: "aluno",
        texto: t || (enviado?.tipo === "audio" ? "(áudio)" : "(imagem)"),
        anexo: enviado?.tipo === "imagem" ? enviado.dataUrl : undefined,
      },
    ]);
    setPensando(true);
    try {
      const r = await fetch("/api/suporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversaId,
          texto: t,
          anexos: enviado ? [{ tipo: enviado.tipo, dataUrl: enviado.dataUrl }] : [],
        }),
      });
      const d = await r.json();
      if (d.conversaId) setConversaId(d.conversaId);
      if (d.calada) {
        setAguardandoPessoa(true);
      } else if (d.reply) {
        setMsgs((m) => [...m, { de: "ia", texto: d.reply }]);
        if (d.precisaHumano) setAguardandoPessoa(true);
      } else {
        setErro(d.error ?? "Não consegui responder agora.");
      }
    } catch {
      setErro("Erro de rede.");
    } finally {
      setPensando(false);
    }
  }

  function recomeçar() {
    setMsgs([]);
    setConversaId(null);
    setAguardandoPessoa(false);
    setErro(null);
  }

  return (
    <div className="flex h-[560px] flex-col rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d]">
      <div className="flex items-center justify-between border-b border-[#1f1f1f] px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-white">Conversa de teste</p>
          <p className="text-[11.5px] text-neutral-500">
            Fale como se fosse um aluno
          </p>
        </div>
        <button
          onClick={recomeçar}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-neutral-500 transition hover:text-white"
        >
          <RotateCcw size={12} strokeWidth={2.2} /> Recomeçar
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && (
          <p className="mt-16 text-center text-[13px] leading-relaxed text-neutral-600">
            Pergunta alguma coisa que um aluno perguntaria.
            <br />
            Ex: “quanto custa o Lips Sense?”
          </p>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.de === "aluno" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${
                m.de === "aluno"
                  ? "bg-emerald-600/25 text-emerald-50"
                  : m.de === "pessoa"
                    ? "bg-amber-500/15 text-amber-100"
                    : "bg-[#1a1a1a] text-neutral-200"
              }`}
            >
              {m.anexo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.anexo}
                  alt="print enviado"
                  className="mb-2 max-h-40 rounded-lg border border-white/10"
                />
              )}
              {m.texto}
            </div>
          </div>
        ))}
        {pensando && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[#1a1a1a] px-3.5 py-2.5">
              <Loader2 size={14} className="animate-spin text-neutral-500" />
            </div>
          </div>
        )}
        <div ref={fim} />
      </div>

      {/* ⚠️ Quando a conversa vira "humano", a IA para de responder. É a regra
          que o James pediu: ela não volta sozinha, ele reativa. */}
      {aguardandoPessoa && (
        <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
          <p className="text-[12px] leading-relaxed text-amber-100/85">
            <UserRound size={12} className="mr-1 inline" strokeWidth={2.2} />
            Passou pra atendimento humano — a IA parou de responder.
          </p>
          {conversaId && (
            <button
              onClick={() =>
                startTransition(async () => {
                  await reativarIaAction(conversaId);
                  setAguardandoPessoa(false);
                })
              }
              className="shrink-0 text-[12px] font-semibold text-amber-200 transition hover:text-white"
            >
              Devolver pra IA
            </button>
          )}
        </div>
      )}

      {erro && (
        <p className="mx-4 mb-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] font-medium text-rose-300">
          {erro}
        </p>
      )}

      {anexo && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2">
          <Paperclip size={12} strokeWidth={2.2} className="shrink-0 text-neutral-500" />
          <span className="min-w-0 flex-1 truncate text-[12px] text-neutral-300">
            {anexo.nome}
          </span>
          <button
            type="button"
            onClick={() => setAnexo(null)}
            className="shrink-0 text-neutral-600 transition hover:text-rose-300"
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        </div>
      )}

      <form
        onSubmit={enviar}
        className="flex items-center gap-2 border-t border-[#1f1f1f] px-3 py-3"
      >
        {/* ⚠️ Print e áudio são o jeito mais comum de mostrar "não consigo
            acessar". Aqui dá pra testar isso antes de existir WhatsApp. */}
        <label
          title="Anexar print ou áudio"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#1f1f1f] text-neutral-500 transition hover:text-white"
        >
          <Paperclip size={15} strokeWidth={2.2} />
          <input
            type="file"
            accept="image/*,audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 4 * 1024 * 1024) {
                setErro("Arquivo muito grande (máximo 4 MB).");
                return;
              }
              const leitor = new FileReader();
              leitor.onload = () =>
                setAnexo({
                  tipo: f.type.startsWith("audio") ? "audio" : "imagem",
                  dataUrl: String(leitor.result),
                  nome: f.name,
                });
              leitor.readAsDataURL(f);
            }}
          />
        </label>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva como um aluno escreveria…"
          className="min-w-0 flex-1 rounded-full border border-[#1f1f1f] bg-[#0f0f0f] px-4 py-2.5 text-[13.5px] text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pensando || (!texto.trim() && !anexo)}
          className="btn-primary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
        >
          <Send size={15} strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}
