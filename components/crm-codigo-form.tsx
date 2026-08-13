"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Code2, Trash2 } from "lucide-react";
import { salvarCodigoCrmAction } from "@/app/lps/actions";
import { extrairChave } from "@/lib/webhook-codigo";

/**
 * Onde se cola o código que o CRM gera pra página.
 *
 * ⚠️ É um BLOCO DE CÓDIGO, não uma URL. O CRM entrega formulário + script (ou
 * só o script, quando a página já tem formulário próprio), e a gente guarda do
 * jeito que veio. Remontar o script na mão só criaria uma segunda versão pra
 * quebrar toda vez que o CRM mudasse alguma coisa.
 *
 * Antes isso morava numa lista solta em /leads, longe da página a que pertence.
 * James: *"ficar colocando em muito lugar assim não vai dar certo"*. Agora fica
 * na tela da própria página, junto dos outros atalhos dela.
 */
export function CrmCodigoForm({
  slug,
  codigo,
  tag,
}: {
  slug: string;
  codigo?: string;
  tag?: string;
}) {
  const [aberto, setAberto] = useState(!codigo);
  const [valor, setValor] = useState(codigo ?? "");
  const [tagValor, setTagValor] = useState(tag ?? "");
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  function salvar(fd: FormData) {
    setErro(null);
    const removeu = fd.get("acao")?.toString() === "remover";
    startTransition(async () => {
      const r = await salvarCodigoCrmAction(fd);
      if (!r.ok) return setErro(r.error ?? "Erro ao salvar");
      if (removeu) {
        // Deixa a caixa vazia e ABERTA: quem tirou o webhook quase sempre quer
        // colar outro em seguida. Fechar mostrando "instalado" seria mentira.
        setValor("");
        setAberto(true);
        return;
      }
      setSalvo(true);
      setAberto(false);
      setTimeout(() => setSalvo(false), 2500);
    });
  }

  if (!aberto) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5">
          <Check size={14} strokeWidth={2.6} className="shrink-0 text-emerald-300" />
          <p className="text-[12.5px] font-semibold text-emerald-200">
            {salvo ? "Webhook salvo" : "Webhook instalado nesta página"}
            {tagValor && (
              <span className="ml-1 font-mono text-[11.5px] font-normal text-emerald-300/80">
                · {tagValor}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setAberto(true)}
          className="text-[12.5px] font-semibold text-neutral-400 transition hover:text-white"
        >
          Ver ou trocar o webhook
        </button>
      </div>
    );
  }

  return (
    <form action={salvar} className="space-y-2.5">
      <input type="hidden" name="slug" value={slug} />
      {/* ⚠️ A TAG vira etiqueta no CRM e é criada na hora, se ainda não
          existir. É ela que diz de qual formulário o lead veio — a tag fixa da
          integração diz o funil. Grafia diferente cria etiqueta diferente, e um
          typo aqui vira tag permanente no catálogo: por isso o aviso. */}
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Etiqueta desta página
        </span>
        <input
          name="tag"
          value={tagValor}
          onChange={(e) => setTagValor(e.target.value)}
          spellCheck={false}
          placeholder="Ex: INSTA CIAFOL LUZ"
          className="w-full rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2 text-[12.5px] text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
        />
        <span className="mt-1.5 block text-[11.5px] leading-relaxed text-neutral-500">
          Vira etiqueta no CRM, criada na hora.{" "}
          <strong className="text-neutral-400">Escreva sempre igual</strong> —
          uma letra diferente cria outra etiqueta, e ela não sai mais do
          catálogo.
        </span>
      </label>
      <textarea
        name="codigo"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        rows={7}
        spellCheck={false}
        placeholder={'Cole aqui o código que o CRM gerou\n\n<form id="form-jayo">…'}
        className="w-full resize-y rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2.5 font-mono text-[11.5px] leading-relaxed text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
      />
      {/* ⚠️ Avisa ANTES de salvar. O James colou a variante "formulário pronto"
          e viu o formulário aparecer solto no rodapé da página: "NÃO QUERO ISSO
          APARECENDO". A parte visível é descartada de qualquer jeito — o aviso
          existe pra ele não achar que o formulário do CRM vai aparecer. */}
      {valor.trim() && extrairChave(valor) && (
        <p className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-[12px] leading-relaxed text-emerald-200">
          Chave encontrada: <code className="font-semibold">{extrairChave(valor)}</code>.
          O envio é montado pelo portal e se liga no formulário que a página já
          tem — nada novo aparece na página.
        </p>
      )}
      {valor.trim() && !extrairChave(valor) && (
        <p className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-[12px] leading-relaxed text-rose-200">
          Não achei a chave (<code>pk_…</code>) nesse texto. Cole o código que o
          CRM gerou — ou só a chave, se preferir.
        </p>
      )}
      <p className="text-[11.5px] leading-relaxed text-neutral-500">
        Pode colar o código inteiro do CRM. O portal usa só a chave e escreve o
        envio, então formulário nenhum é desenhado na página.
      </p>
      {erro && (
        <p className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] font-medium text-rose-300">
          {erro}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pendente}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold disabled:opacity-60"
        >
          {pendente ? (
            <Loader2 size={13} strokeWidth={2.4} className="animate-spin" />
          ) : (
            <Code2 size={13} strokeWidth={2.4} />
          )}
          Salvar webhook
        </button>
        {codigo && (
          <button
            type="submit"
            name="acao"
            value="remover"
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12.5px] font-semibold text-rose-300 transition hover:bg-rose-500/20"
          >
            <Trash2 size={12} strokeWidth={2.2} /> Tirar
          </button>
        )}
      </div>
    </form>
  );
}
