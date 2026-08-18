"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CheckCheck, MessageCircle, Mic, Paperclip, Send, X } from "lucide-react";
import { Medalhao } from "@/components/marca-jayo";
import { faltaEsperar } from "@/lib/ritmo-resposta";

type Msg = {
  de: "aluno" | "atendente";
  texto: string;
  em?: string;
  /** O que ela mandou junto — a imagem pra ver, o áudio pra ouvir. */
  anexo?: { tipo: "imagem" | "audio"; dataUrl: string };
};
type Anexo = { tipo: "imagem" | "audio"; dataUrl: string; nome: string };

/**
 * Os assuntos que mais chegam, prontos pra tocar.
 *
 * ⚠️ São os três casos que a base de conhecimento resolve sem chamar ninguém —
 * de propósito. Sugerir algo que sempre cai pra atendente seria criar fila com
 * a nossa própria mão.
 */
const SUGESTOES = [
  "Não consigo acessar meu curso",
  "Onde fica a apostila?",
  "Meu acesso venceu?",
];

/**
 * O bico do balão — o triângulo que aponta pra quem falou.
 *
 * ⚠️ É o detalhe que o James pediu ("mais parecido com o próprio WhatsApp, os
 * detalhes, as linhas, o contorno"). Sem ele o balão é um retângulo
 * arredondado qualquer; com ele, a mensagem parece dita por alguém.
 *
 * Desenhado com recorte, não com borda: borda em triângulo precisa de dois
 * elementos sobrepostos e desalinha em zoom.
 */
function Bico({ dela }: { dela: boolean }) {
  return (
    <span
      aria-hidden
      className={`absolute top-0 h-2.5 w-2.5 ${dela ? "-right-1.5 bg-[#AC9751]" : "-left-1.5 bg-[#F4F1EA]"}`}
      style={{
        clipPath: dela ? "polygon(0 0, 100% 0, 0 100%)" : "polygon(0 0, 100% 0, 100% 100%)",
      }}
    />
  );
}

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
  // ⚠️ Vem do servidor: só existe se o número do WhatsApp estiver configurado.
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pensando, setPensando] = useState(false);
  /** A imagem aberta em tela cheia. */
  const [lupa, setLupa] = useState<string | null>(null);
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  /**
   * ⚠️ O id vive também num ref porque o envio roda dentro de um laço. Lendo do
   * estado, a segunda mensagem da fila usaria o valor velho (null) e ABRIRIA
   * UMA CONVERSA NOVA — a aluna mandaria duas mensagens e o time veria duas
   * conversas separadas, cada uma pela metade.
   */
  const idRef = useRef<string | null>(null);
  /** As mensagens esperando a vez. */
  const fila = useRef<Array<{ texto: string; anexo: Anexo | null }>>([]);
  const processando = useRef(false);
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<BlobPart[]>([]);
  const fim = useRef<HTMLDivElement>(null);

  // ⚠️ A hora da abertura só é calculada DEPOIS de montar. Calculada no
  // primeiro render, o servidor escreveria um horário e o navegador outro, e o
  // React reclamaria de conteúdo diferente entre os dois.
  const [horaAbertura, setHoraAbertura] = useState("");
  useEffect(() => setHoraAbertura(hora(new Date().toISOString())), []);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, pensando]);

  // Esc fecha a imagem aberta — quem abriu em tela cheia espera poder fechar
  // sem procurar botão.
  useEffect(() => {
    if (!lupa) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setLupa(null);
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [lupa]);

  // O cronômetro da gravação.
  useEffect(() => {
    if (!gravando) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [gravando]);

  /**
   * Gravar áudio, como no WhatsApp.
   *
   * ⚠️ O navegador grava em `webm/opus` (Chrome) ou `ogg/opus` (Firefox).
   * Testei os dois no Gemini pelo caminho nativo: **os dois são entendidos**.
   * Pela camada de compatibilidade o ogg seria recusado — por isso o áudio já
   * usa o endereço nativo (ver `lib/gemini-nativo.ts`).
   */
  async function comecarAGravar() {
    setErro(null);
    try {
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"].find(
        (t) => MediaRecorder.isTypeSupported(t)
      );
      const rec = new MediaRecorder(fluxo, tipo ? { mimeType: tipo } : undefined);
      pedacos.current = [];
      rec.ondataavailable = (e) => e.data.size && pedacos.current.push(e.data);
      rec.onstop = () => {
        // ⚠️ Desligar as trilhas apaga a bolinha de "gravando" do navegador. Sem
        // isso a aluna fica com o aviso de microfone ligado depois de mandar, e
        // acha que a gente está ouvindo ela.
        fluxo.getTracks().forEach((t) => t.stop());
        const blob = new Blob(pedacos.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 1200) return; // toque sem querer: não vira anexo
        const leitor = new FileReader();
        leitor.onload = () =>
          setAnexo({ tipo: "audio", dataUrl: String(leitor.result), nome: "Áudio gravado" });
        leitor.readAsDataURL(blob);
      };
      gravador.current = rec;
      setSegundos(0);
      setGravando(true);
      rec.start();
    } catch {
      setErro("Não consegui usar o microfone. Libera o acesso no navegador e tenta de novo?");
    }
  }

  function pararDeGravar(guardar: boolean) {
    const rec = gravador.current;
    if (!rec) return;
    if (!guardar) pedacos.current = [];
    rec.stop();
    gravador.current = null;
    setGravando(false);
  }

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

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    enfileirar(texto.trim());
  }

  /**
   * Põe a mensagem na fila e mostra na hora.
   *
   * ⚠️ Antes daqui, mandar uma segunda mensagem antes da resposta era
   * BLOQUEADO. Mas ninguém conversa assim: a pessoa manda "bom dia" e já
   * emenda o problema. Deixar em paralelo também não serve — duas gravações ao
   * mesmo tempo na mesma conversa se sobrescrevem, e uma das mensagens SOME.
   * Fila resolve os dois: aparece na hora, chega em ordem, não perde nada.
   */
  function enfileirar(t: string) {
    if (!t && !anexo) return;
    setErro(null);
    setTexto("");
    const enviado = anexo;
    setAnexo(null);

    setMsgs((m) => [
      ...m,
      {
        de: "aluno",
        // ⚠️ Sem rótulo "(imagem)" embaixo da foto: no WhatsApp a imagem fala
        // por si. O rótulo continua indo pro SERVIDOR, onde a caixa do time
        // precisa saber que veio um anexo — mas ele não é pra ela ver.
        texto: t,
        em: new Date().toISOString(),
        anexo: enviado ? { tipo: enviado.tipo, dataUrl: enviado.dataUrl } : undefined,
      },
    ]);

    fila.current.push({ texto: t, anexo: enviado });
    void bombear();
  }

  /**
   * Transforma um arquivo em anexo pronto pra mandar.
   *
   * ⚠️ Usado pelo clipe E pelo Ctrl+V. Um só caminho: se fossem dois, o limite
   * de tamanho valeria num e no outro não — e o print colado é justamente o
   * que costuma ser grande.
   */
  function pegarArquivo(f: File | null | undefined) {
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setErro("Essa imagem é grande demais (máximo 4 MB).");
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () =>
      setAnexo({
        tipo: f.type.startsWith("audio") ? "audio" : "imagem",
        dataUrl: String(leitor.result),
        nome: f.name || "Print colado",
      });
    leitor.readAsDataURL(f);
  }

  /** Manda uma de cada vez, até a fila esvaziar. */
  async function bombear() {
    if (processando.current) return;
    processando.current = true;
    setPensando(true);
    try {
      while (fila.current.length) {
        const item = fila.current.shift()!;
        await mandarUma(item);
      }
    } finally {
      processando.current = false;
      setPensando(false);
    }
  }

  async function mandarUma({ texto: t, anexo: enviado }: { texto: string; anexo: Anexo | null }) {
    const comecou = Date.now();
    try {
      const r = await fetch("/api/ajuda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversaId: idRef.current,
          texto: t,
          anexos: enviado ? [{ tipo: enviado.tipo, dataUrl: enviado.dataUrl }] : [],
        }),
      });
      const d = await r.json();
      if (d.conversaId) {
        idRef.current = d.conversaId;
        setConversaId(d.conversaId);
      }
      if (d.comPessoa) setComPessoa(true);
      if (d.whatsapp) setWhatsapp(d.whatsapp);

      // ⚠️ O ritmo humano. Resposta em 400ms entrega que é robô — e quem acabou
      // de contar um problema estranha ser respondida antes de terminar de ler
      // o que escreveu. É PISO: se já demorou, aparece na hora.
      const falta = faltaEsperar(Date.now() - comecou);
      if (falta > 0) await new Promise((ok) => setTimeout(ok, falta));

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
    }
  }

  return (
    // ⚠️ Rola por DENTRO do painel (`min-h-0` + `overflow-y-auto`). Sem isso a
    // conversa empurraria o painel e o campo de escrever sairia da tela.
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        // ⚠️ `overflow-x-hidden`: o bico do balão fica um pouco pra fora e
        // criava uma barra de rolagem horizontal na tela inteira. E a barra
        // vertical vira um fio dourado — a do sistema é larga e cinza, e
        // aparecia como um risco no meio do visual da marca.
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#AC9751]/30 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(172,151,81,0.3) transparent" }}
      >
        <div className="w-full space-y-4">
        {/* ── a abertura: balão fixo, nosso, sem custo de IA ─────────────── */}
        {/* ⚠️ `items-start`: o medalhão acompanha a PRIMEIRA linha do balão.
            Alinhado embaixo ele descia junto com o horário e parecia solto. */}
        <div className="flex items-start gap-2.5">
          <Medalhao tamanho={30} />
          {/* ⚠️ `min-w-0 flex-1` é o que faz o balão CRESCER. Antes o `72%`
              media contra um contêiner de largura automática — que por sua vez
              se ajustava ao conteúdo. A conta era circular, e o texto quebrava
              cedo com meia tela sobrando do lado. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="relative w-fit max-w-[86%] rounded-2xl rounded-tl-md bg-[#F4F1EA] px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[#101820] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.7)]">
              <Bico dela={false} />
              {saudacao}! Aqui é o suporte da Jay Academy. Como você se chama?
            </div>
            <p className="mt-1 pl-1 text-[11px] text-[#F4F1EA]/35">{horaAbertura}</p>
          </div>
        </div>

        {/* ⚠️ Os assuntos mais comuns, prontos pra tocar. Preenchem o topo da
            conversa — que era o vazio que mais incomodava — mas ganham lugar
            por outro motivo: pouparam a pessoa de descrever o problema, e ela
            chega com pressa. Somem assim que a conversa começa. */}
        {msgs.length === 0 && !pensando && (
          <div className="flex flex-wrap gap-2 pl-[38px]">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                onClick={() => enfileirar(s)}
                className="rounded-full border border-[#AC9751]/35 px-3.5 py-1.5 text-[12.5px] text-[#F4F1EA]/75 transition hover:border-[#AC9751] hover:bg-[#AC9751]/10 hover:text-[#F4F1EA]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {msgs.map((m, i) => {
          const daAluna = m.de === "aluno";
          // O medalhão só na PRIMEIRA de uma sequência do atendimento: repetir
          // a cada balão vira enfeite e polui a coluna.
          const abreSequencia = !daAluna && msgs[i - 1]?.de !== "atendente";
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${daAluna ? "justify-end" : ""}`}
            >
              {!daAluna &&
                (abreSequencia ? (
                  <Medalhao tamanho={30} />
                ) : (
                  <span aria-hidden className="w-[30px] shrink-0" />
                ))}
              <div
                className={`flex min-w-0 flex-1 flex-col ${daAluna ? "items-end" : ""}`}
              >
                <div
                  className={`relative w-fit max-w-[86%] overflow-hidden text-[15px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.7)] ${
                    // ⚠️ Com imagem, o balão perde o recheio: a foto encosta na
                    // borda, como no WhatsApp. Com texto, volta o respiro.
                    m.anexo?.tipo === "imagem" ? "p-1" : "px-4 py-3"
                  } ${
                    daAluna
                      ? "rounded-2xl rounded-tr-md bg-[#AC9751] text-[#101820]"
                      : "rounded-2xl rounded-tl-md bg-[#F4F1EA] text-[#101820]"
                  }`}
                >
                  <Bico dela={daAluna} />

                  {m.anexo?.tipo === "imagem" && (
                    <button
                      type="button"
                      onClick={() => setLupa(m.anexo!.dataUrl)}
                      title="Abrir imagem"
                      className="block w-full cursor-zoom-in"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.anexo.dataUrl}
                        alt="imagem enviada"
                        className="max-h-72 w-full rounded-xl object-cover"
                      />
                    </button>
                  )}

                  {m.anexo?.tipo === "audio" && (
                    // O próprio tocador do navegador: tem play, barra e tempo,
                    // e funciona igual no celular e no computador.
                    <audio
                      controls
                      src={m.anexo.dataUrl}
                      className="w-[16rem] max-w-full"
                    />
                  )}

                  {m.texto && (
                    <span className={m.anexo?.tipo === "imagem" ? "block px-3 pb-2 pt-2" : ""}>
                      {m.texto}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 flex items-center gap-1 text-[11px] text-[#F4F1EA]/35 ${daAluna ? "justify-end pr-1" : "pl-1"}`}
                >
                  {hora(m.em)}
                  {/* ⚠️ O tique só aparece nas mensagens DELA, e só quando o
                      servidor já confirmou (a conversa tem id). É informação de
                      verdade — "chegou aqui" — não enfeite copiado do
                      WhatsApp. */}
                  {daAluna && conversaId && (
                    <CheckCheck size={13} strokeWidth={2.4} className="text-[#F4F1EA]/45" />
                  )}
                </p>
              </div>
            </div>
          );
        })}

        {pensando && (
          <div className="flex items-start gap-2.5">
            <Medalhao tamanho={30} />
            <div className="rounded-2xl rounded-tl-md bg-[#F4F1EA] px-4 py-3">
              <Digitando />
            </div>
          </div>
        )}

        {/* ⚠️ Aqui a conversa MUDA DE LUGAR. O chat é primeiro contato e
            triagem; quem assume é uma pessoa no WhatsApp. Sem número
            configurado o botão não existe e a tela volta a pedir que ela espere
            aqui — nunca um botão que não leva a lugar nenhum. */}
        {comPessoa && !pensando && (
          <div className="pt-2">
            {whatsapp ? (
              <div className="rounded-2xl border border-[#AC9751]/30 bg-[#AC9751]/[0.07] px-4 py-4 text-center">
                <p className="text-[13.5px] leading-relaxed text-[#F4F1EA]/80">
                  Pra continuar, é melhor a gente falar no WhatsApp — assim
                  ninguém precisa ficar de olho nesta página.
                </p>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#AC9751] px-5 py-2.5 text-[14px] font-semibold text-[#101820] transition hover:brightness-110"
                >
                  <MessageCircle size={15} strokeWidth={2.4} />
                  Continuar no WhatsApp
                </a>
                <p className="mt-2.5 text-[11.5px] text-[#F4F1EA]/35">
                  Sua conversa vai junto — não precisa contar tudo de novo.
                </p>
              </div>
            ) : (
              <p className="px-2 text-center text-[12.5px] leading-relaxed text-[#F4F1EA]/45">
                Já chamei uma pessoa do time pra te responder. Pode deixar esta
                página aberta — a resposta aparece aqui.
              </p>
            )}
          </div>
        )}

          <div ref={fim} />
        </div>
      </div>

      {/* A imagem em tela cheia. Clicar em qualquer lugar fecha — é o gesto
          que a pessoa já tenta primeiro. */}
      {lupa && (
        <div
          role="dialog"
          aria-label="Imagem enviada"
          onClick={() => setLupa(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lupa} alt="imagem enviada" className="max-h-full max-w-full rounded-xl" />
          <button
            type="button"
            aria-label="Fechar"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>
      )}

      {/* ── o campo de escrever, no rodapé do painel ───────────────────── */}
      <div className="shrink-0 border-t border-[#AC9751]/12 px-4 pb-4 pt-3 sm:px-6">
        <div className="w-full">
        {erro && (
          <p className="mb-2.5 rounded-xl border border-[#AC9751]/30 bg-[#AC9751]/10 px-4 py-2.5 text-[13px] leading-relaxed text-[#F4F1EA]/85">
            {erro}
          </p>
        )}

        {anexo && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-[#AC9751]/20 bg-[#16202a] px-3 py-2">
            <Paperclip size={13} strokeWidth={2} className="shrink-0 text-[#AC9751]" />
            {anexo.tipo === "audio" ? (
              // Ouvir antes de mandar: ninguém manda áudio sem conferir.
              <audio controls src={anexo.dataUrl} className="h-8 min-w-0 flex-1" />
            ) : (
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#F4F1EA]/75">
                {anexo.nome}
              </span>
            )}
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

        {gravando ? (
          // ⚠️ Enquanto grava, o campo de escrever SOME. Um microfone ligado
          // com a tela igual à de sempre é o jeito mais fácil de alguém gravar
          // sem perceber — e aqui do outro lado tem uma pessoa falando de um
          // problema dela.
          <div className="flex items-center gap-3 rounded-full border border-rose-500/40 bg-rose-500/10 py-2 pl-4 pr-2">
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-400" />
            <span className="flex-1 text-[14px] font-medium text-[#F4F1EA]">
              Gravando {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => pararDeGravar(false)}
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#F4F1EA]/60 transition hover:text-[#F4F1EA]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => pararDeGravar(true)}
              aria-label="Concluir gravação"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#AC9751] text-[#101820] transition hover:brightness-110"
            >
              <Check size={16} strokeWidth={2.6} />
            </button>
          </div>
        ) : (
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
                pegarArquivo(f);
              }}
            />
          </label>

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            // ⚠️ Ctrl+V com print na área de transferência. É o caminho mais
            // natural de quem tira print no computador — sem isso a pessoa
            // precisa salvar em arquivo antes, e muita gente desiste no meio.
            onPaste={(e) => {
              const arq = Array.from(e.clipboardData.files).find((f) =>
                f.type.startsWith("image/")
              );
              if (!arq) return; // texto colado segue o caminho normal
              e.preventDefault();
              pegarArquivo(arq);
            }}
            placeholder="Escreve aqui…"
            // ⚠️ 16px de fonte no celular. Abaixo disso o iPhone dá zoom sozinho
            // ao focar o campo e a tela "pula" — parece bug.
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[#F4F1EA] placeholder:text-[#F4F1EA]/30 focus:outline-none"
          />

          {/* ⚠️ Microfone OU enviar, nunca os dois. Com o campo vazio o botão
              de enviar não faz nada, então o lugar é do microfone; assim que há
              o que mandar, ele vira o enviar. É como o WhatsApp faz, e evita
              dois botões redondos disputando o mesmo canto. */}
          {texto.trim() || anexo ? (
            <button
              type="submit"
              // ⚠️ SEM `disabled={pensando}`: era isso que impedia mandar a
              // segunda mensagem antes da resposta. Agora a fila cuida da
              // ordem, e a pessoa escreve no ritmo dela.
              aria-label="Enviar"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#AC9751] text-[#101820] transition hover:brightness-110 disabled:opacity-30"
            >
              <Send size={15} strokeWidth={2.4} />
            </button>
          ) : (
            <button
              type="button"
              onClick={comecarAGravar}
              aria-label="Gravar áudio"
              title="Gravar um áudio"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#AC9751]/15 text-[#AC9751] transition hover:bg-[#AC9751] hover:text-[#101820] disabled:opacity-30"
            >
              <Mic size={16} strokeWidth={2.2} />
            </button>
          )}
        </form>
        )}
      </div>
      </div>
    </div>
  );
}
