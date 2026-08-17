"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Send, X } from "lucide-react";
import { Medalhao } from "@/components/marca-jayo";

type Msg = { de: "aluno" | "atendente"; texto: string; em?: string; anexo?: string };
type Anexo = { tipo: "imagem" | "audio"; dataUrl: string; nome: string };

/** A hora do jeito que se lê num chat: 14:32. */
function hora(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";
}

/**
 * "digitando…" — três pontos, como em qualquer conversa.
 *
 * ⚠️ Trocou uma rodinha de carregamento. Rodinha é vocabulário de sistema
 * processando; três pontos é vocabulário de gente escrevendo. A espera é a
 * mesma, a sensação não.
 */
function Digitando() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="digitando">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 180}ms` }}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#101820]/45"
        />
      ))}
    </span>
  );
}

/**
 * O atendimento pela visão da aluna.
 *
 * ⚠️ **Não tem formulário de entrada.** A conversa já abre com a saudação
 * perguntando o nome, e a pessoa começa respondendo em vez de preenchendo.
 * James: *"o email a gente pergunta so dps pq a gente não sabe c é a duvida da
 * pessoa"*.
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

  // ⚠️ A hora da abertura só é calculada DEPOIS de montar. Calculada no
  // primeiro render, o servidor escreveria um horário e o navegador outro, e o
  // React reclamaria de conteúdo diferente entre os dois.
  const [horaAbertura, setHoraAbertura] = useState("");
  useEffect(() => setHoraAbertura(hora(new Date().toISOString())), []);

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
        em: new Date().toISOString(),
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
        setMsgs((m) => [
          ...m,
          { de: "atendente", texto: d.reply, em: new Date().toISOString() },
        ]);
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
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 sm:px-6">
      <div className="flex-1 space-y-4 py-6">
        {/* ── a abertura: balão fixo, nosso, sem custo de IA ─────────────── */}
        <div className="flex items-end gap-2.5">
          <Medalhao tamanho={30} />
          <div>
            <div className="max-w-[min(84vw,30rem)] rounded-2xl rounded-bl-md bg-[#F4F1EA] px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-[#101820]">
              {saudacao}! Aqui é o suporte da Jay Academy.
              {"\n"}Como você se chama?
            </div>
            <p className="mt-1 pl-1 text-[11px] text-[#F4F1EA]/35">{horaAbertura}</p>
          </div>
        </div>

        {msgs.map((m, i) => {
          const daAluna = m.de === "aluno";
          // O medalhão só na PRIMEIRA de uma sequência do atendimento: repetir
          // a cada balão vira enfeite e polui a coluna.
          const abreSequencia = !daAluna && msgs[i - 1]?.de !== "atendente";
          return (
            <div
              key={i}
              className={`flex items-end gap-2.5 ${daAluna ? "justify-end" : ""}`}
            >
              {!daAluna &&
                (abreSequencia ? (
                  <Medalhao tamanho={30} />
                ) : (
                  <span aria-hidden className="w-[30px] shrink-0" />
                ))}
              <div className={daAluna ? "flex flex-col items-end" : ""}>
                <div
                  className={`max-w-[min(84vw,30rem)] px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                    daAluna
                      ? "rounded-2xl rounded-br-md bg-[#AC9751] text-[#101820]"
                      : "rounded-2xl rounded-bl-md bg-[#F4F1EA] text-[#101820]"
                  }`}
                >
                  {m.anexo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.anexo}
                      alt="print enviado"
                      className="mb-2 max-h-52 rounded-lg border border-[#101820]/15"
                    />
                  )}
                  {m.texto}
                </div>
                <p
                  className={`mt-1 text-[11px] text-[#F4F1EA]/35 ${daAluna ? "pr-1" : "pl-1"}`}
                >
                  {hora(m.em)}
                </p>
              </div>
            </div>
          );
        })}

        {pensando && (
          <div className="flex items-end gap-2.5">
            <Medalhao tamanho={30} />
            <div className="rounded-2xl rounded-bl-md bg-[#F4F1EA] px-4 py-3">
              <Digitando />
            </div>
          </div>
        )}

        {/* ⚠️ Espera sem aviso é o que faz a pessoa desistir e mandar
            "alguém aí???". Dizer que já chamamos alguém compra paciência. */}
        {comPessoa && !pensando && (
          <p className="px-2 pt-1 text-center text-[12.5px] leading-relaxed text-[#F4F1EA]/45">
            Já chamei uma pessoa do time pra te responder. Pode deixar esta
            página aberta — a resposta aparece aqui.
          </p>
        )}

        <div ref={fim} />
      </div>

      {/* ── o campo de escrever, colado embaixo ────────────────────────── */}
      <div className="sticky bottom-0 -mx-4 bg-[#101820] px-4 pb-4 pt-2 sm:-mx-6 sm:px-6">
        {erro && (
          <p className="mb-2.5 rounded-xl border border-[#AC9751]/30 bg-[#AC9751]/10 px-4 py-2.5 text-[13px] leading-relaxed text-[#F4F1EA]/85">
            {erro}
          </p>
        )}

        {anexo && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#AC9751]/20 bg-[#16202a] px-3 py-2">
            <Paperclip size={13} strokeWidth={2} className="shrink-0 text-[#AC9751]" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#F4F1EA]/75">
              {anexo.nome}
            </span>
            <button
              type="button"
              onClick={() => setAnexo(null)}
              aria-label="Tirar anexo"
              className="shrink-0 text-[#F4F1EA]/40 transition hover:text-[#F4F1EA]"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
        )}

        <form
          onSubmit={enviar}
          className="flex items-center gap-2 rounded-full border border-[#AC9751]/25 bg-[#16202a] py-1.5 pl-2 pr-1.5 transition focus-within:border-[#AC9751]/60"
        >
          <label
            title="Mandar print ou áudio"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#F4F1EA]/45 transition hover:text-[#AC9751]"
          >
            <Paperclip size={16} strokeWidth={2} />
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
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[#F4F1EA] placeholder:text-[#F4F1EA]/30 focus:outline-none"
          />

          <button
            type="submit"
            disabled={pensando || (!texto.trim() && !anexo)}
            aria-label="Enviar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#AC9751] text-[#101820] transition hover:brightness-110 disabled:opacity-30"
          >
            <Send size={15} strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </div>
  );
}
