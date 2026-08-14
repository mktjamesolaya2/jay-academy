"use client";

import { useState, useTransition } from "react";
import { Check, Link2, Loader2 } from "lucide-react";
import { changePublicSlugAction } from "@/app/wp-pages/manage-actions";

/**
 * Trocar o endereço público da página, na tela da própria página.
 *
 * ⚠️ Isto existia só **escondido dentro do SEO** — um campo "Slug / Permalink"
 * no meio de título, descrição e imagem de compartilhamento. Trocar a URL não é
 * SEO: é a identidade da página, a coisa que se copia e manda pro ManyChat.
 * James: *"senti falta de poder trocar a URL por aqui — vê aonde tem e unifica
 * apenas aqui"*.
 *
 * A ação (`changePublicSlugAction`) já existia e **ninguém chamava**. Ela cuida
 * do índice de publicadas e recusa URL já usada por outra página.
 */
export function TrocarUrl({
  domain,
  slug,
  urlAtual,
  publicada,
}: {
  domain: string;
  slug: string;
  urlAtual: string;
  publicada: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(urlAtual);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pendente, startTransition] = useTransition();

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-neutral-500 transition hover:text-white"
      >
        <Link2 size={12} strokeWidth={2.2} />
        {salvo ? "Endereço trocado" : "Trocar endereço"}
      </button>
    );
  }

  function trocar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await changePublicSlugAction(undefined, fd);
      if (r?.error) return setErro(r.error);
      setSalvo(true);
      setAberto(false);
      setTimeout(() => setSalvo(false), 3000);
    });
  }

  return (
    <form action={trocar} className="mt-2 space-y-2">
      <input type="hidden" name="domain" value={domain} />
      <input type="hidden" name="slug" value={slug} />
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 font-mono text-xs text-neutral-600">
          jayacademy.com.br/
        </span>
        <input
          name="publicSlug"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-2.5 py-1.5 font-mono text-[12.5px] text-neutral-200 focus:border-neutral-600 focus:outline-none"
        />
      </div>
      {/* ⚠️ Aviso obrigatório: link antigo em anúncio, ManyChat e bio do
          Instagram para de funcionar na hora. Trocar a URL de uma página no ar
          é quebrar link que já está circulando. */}
      {publicada && valor !== urlAtual && (
        <p className="rounded-md border border-amber-500/25 bg-amber-500/5 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-100/80">
          O endereço antigo <code className="font-mono">/{urlAtual}</code> deixa
          de funcionar. Link que já esteja em anúncio, ManyChat ou bio precisa
          ser atualizado.
        </p>
      )}
      {erro && (
        <p className="rounded-md border border-rose-500/25 bg-rose-500/10 px-2.5 py-2 text-[11.5px] font-medium text-rose-300">
          {erro}
        </p>
      )}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pendente || !valor.trim() || valor === urlAtual}
          className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold disabled:opacity-50"
        >
          {pendente ? (
            <Loader2 size={12} strokeWidth={2.4} className="animate-spin" />
          ) : (
            <Check size={12} strokeWidth={2.6} />
          )}
          Trocar
        </button>
        <button
          type="button"
          onClick={() => {
            setValor(urlAtual);
            setErro(null);
            setAberto(false);
          }}
          className="text-[12.5px] font-semibold text-neutral-500 transition hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
