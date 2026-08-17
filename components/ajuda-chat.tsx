"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";

type Msg = { de: "aluno" | "atendente"; texto: string; anexo?: string };
type Anexo = { tipo: "imagem" | "audio"; dataUrl: string; nome: string };

/**
 * O atendimento pela visão da aluna.
 *
 * ⚠️ **Não tem formulário de entrada.** A conversa já abre com a saudação
 * perguntando o nome, e a pessoa começa respondendo em vez de preenchendo.
 * James: *"o email a gente pergunta so dps pq a gente não sabe c é a duvida da
 * pessoa"* — pedir e-mail de compra pra quem só quer saber onde está a apostila
 * é atrito à toa, e formulário antes de falar é onde a pessoa desiste.
 *
 * ⚠️ Ela **não vê** quem respondeu — se foi a IA ou uma pessoa do time. É de
 * propósito: marcar "isto foi um robô" faz a pessoa desconfiar da resposta
 * certa e pedir humano por reflexo, mesmo quando a resposta já resolvia.
 *
 * ⚠️ E a tela **nunca fica muda**. Quando a conversa passa pra uma pessoa, ela
 * continua buscando a resposta sozinha (o time responde pelo portal, e pode
 * demorar). Sem isso a aluna escreveria, veria a mensagem parada e ia embora
 * achando que ninguém leu.
 */
export function AjudaChat({ saudacao }: { saudacao: string }) {
  // ⚠️ A saudação é um balão FIXO, fora desta lista. Se entrasse aqui, ela
  // contaria como mensagem e desalinharia a comparação com o servidor — que
  // não tem essa mensagem — fazendo a resposta do time não aparecer.
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [anexo, setAnexo] = useState<Anexo | null>(null);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [comPessoa, setComPessoa] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pensando, setPensando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, pensando]);

  /**
   * Busca a conversa no servidor.
   *
   * ⚠️ Só troca a lista quando o servidor tem MAIS mensagens que a tela. Assim
   * o que a aluna acabou de escrever não pisca nem some enquanto a resposta não
   * chegou — e o print que ela mandou continua aparecendo, porque o anexo é
   * preservado pela posição.
   */
  const buscar = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/ajuda?id=${encodeURIComponent(id)}`);
      if (!r.ok) return;
      const d = (await r.json()) as { mensagens: Msg[]; comPessoa: boolean };
      setComPessoa(d.comPessoa);
      setMsgs((prev) =>
        d.mensagens.length > prev.length
          ? d.mensagens.map((m, i) => ({ ...m, anexo: prev[i]?.anexo }))
          : prev
      );
    } catch {
      // Rede oscilou. A próxima volta tenta de novo — não vale assustar a aluna
      // com erro de conexão por causa de uma busca que se repete sozinha.
    }
  }, []);

  // ⚠️ Só busca quando está esperando uma pessoa. Enquanto a IA responde, a
  // resposta já vem na hora do envio — ficar buscando à toa só gastaria bateria
  // do celular dela.
  useEffect(() => {
    if (!conversaId || !comPessoa) return;
    const t = setInterval(() => buscar(conversaId), 5000);
    return () => clearInterval(t);
  }, [conversaId, comPessoa, buscar]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    // Print sem legenda é comum: a pessoa manda só a imagem.
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
      const r = await fetch("/api/ajuda", {
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
      if (d.comPessoa) setComPessoa(true);
      if (d.reply) {
        setMsgs((m) => [...m, { de: "atendente", texto: d.reply }]);
      } else if (d.error) {
        // ⚠️ Erro nosso não vira texto técnico na cara dela. O cérebro já
        // passou a conversa pra uma pessoa; aqui ela só precisa saber que
        // alguém vai responder.
        setErro(
          d.conversaId
            ? "Deu um problema aqui do nosso lado, mas sua mensagem chegou. Já pedi pra uma pessoa do time te responder."
            : d.error
        );
      }
    } catch {
      setErro("Sua internet oscilou. Tenta mandar de novo?");
    } finally {
      setPensando(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010]">
      <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-5 sm:px-5">
        {/* ⚠️ Balão fixo: é a nossa abertura, não vem do servidor. Aparece na
            hora, sem gastar chamada de IA, e já pergunta o nome — a pessoa
            começa respondendo em vez de preenchendo formulário. */}
        <div className="flex justify-start">
          <div className="max-w-[82%] rounded-2xl bg-[#1c1c1c] px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap text-neutral-100">
            {saudacao}! Aqui é o suporte da Jay Academy 🙂
            {"\n"}Como você se chama?
          </div>
        </div>

        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.de === "aluno" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-wrap ${
                m.de === "aluno"
                  ? "bg-[#AC9751] text-[#101820]"
                  : "bg-[#1c1c1c] text-neutral-100"
              }`}
            >
              {m.anexo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.anexo}
                  alt="print enviado"
                  className="mb-2 max-h-48 rounded-lg border border-black/20"
                />
              )}
              {m.texto}
            </div>
          </div>
        ))}

        {pensando && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[#1c1c1c] px-4 py-3">
              <Loader2 size={15} className="animate-spin text-neutral-500" />
            </div>
          </div>
        )}

        {/* ⚠️ Espera sem aviso é o que faz a pessoa desistir e mandar
            "alguém aí???". Dizer que já chamamos alguém compra paciência. */}
        {comPessoa && !pensando && (
          <p className="pt-2 text-center text-[12.5px] leading-relaxed text-neutral-500">
            Já chamei uma pessoa do time pra te responder. Pode deixar esta
            página aberta — a resposta aparece aqui.
          </p>
        )}

        <div ref={fim} />
      </div>

      {erro && (
        <p className="mx-4 mb-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-[13px] leading-relaxed text-amber-100">
          {erro}
        </p>
      )}

      {anexo && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d0d0d] px-3 py-2">
          <Paperclip size={13} strokeWidth={2.2} className="shrink-0 text-neutral-500" />
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-neutral-300">
            {anexo.nome}
          </span>
          <button
            type="button"
            onClick={() => setAnexo(null)}
            aria-label="Tirar anexo"
            className="shrink-0 text-neutral-600 transition hover:text-rose-300"
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
      )}

      <form
        onSubmit={enviar}
        className="flex items-center gap-2 border-t border-white/10 px-3 py-3"
      >
        <label
          title="Mandar print ou áudio"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 text-neutral-500 transition hover:text-white"
        >
          <Paperclip size={16} strokeWidth={2.2} />
          <input
            type="file"
            accept="image/*,audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              if (f.size > 4 * 1024 * 1024) {
                setErro("Esse arquivo é grande demais (máximo 4 MB).");
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
          placeholder="Escreve aqui…"
          // ⚠️ 16px de fonte no celular. Abaixo disso o iPhone dá zoom sozinho
          // ao focar o campo e a tela "pula" — parece bug.
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#0a0a0a] px-4 py-3 text-[16px] text-white placeholder:text-neutral-600 focus:border-[#AC9751] focus:outline-none"
        />
        <button
          type="submit"
          disabled={pensando || (!texto.trim() && !anexo)}
          aria-label="Enviar"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#AC9751] text-[#101820] transition hover:brightness-110 disabled:opacity-35"
        >
          <Send size={16} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}
