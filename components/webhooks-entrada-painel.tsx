"use client";

import { useState, useTransition } from "react";
import { Plus, Copy, Check, Trash2, Power, Inbox, Loader2 } from "lucide-react";
import {
  criarWebhookAction,
  alternarWebhookAction,
  excluirWebhookAction,
} from "@/app/settings/integracoes/actions";
import type { WebhookEntrada } from "@/lib/webhooks-entrada";

/**
 * O NOSSO webhook — o endereço que a gente gera e cola nas páginas.
 *
 * ⚠️ Fica ACIMA dos destinos de saída de propósito. É o começo do caminho: o
 * lead chega aqui primeiro, e só depois (se houver CRM cadastrado) é repassado.
 * A tela anterior só tinha a saída, e por isso dava a impressão errada de que
 * a gente dependia do Clint gerar link pra alguma coisa funcionar.
 */
export function WebhooksEntradaPainel({
  webhooks,
  base,
}: {
  webhooks: WebhookEntrada[];
  base: string;
}) {
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const linkDe = (id: string) => `${base}/api/receber/${id}`;

  function criar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await criarWebhookAction(fd);
      if (!r.ok) setErro(r.error ?? "Erro ao criar");
      else setCriando(false);
    });
  }

  async function copiar(id: string) {
    await navigator.clipboard.writeText(linkDe(id));
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1800);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[17px] font-semibold text-white">
            <Inbox size={16} strokeWidth={2.2} className="text-emerald-400" />
            Nosso webhook
          </h3>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-neutral-400">
            O endereço é <strong className="font-semibold text-neutral-200">nosso</strong>.
            Você cria aqui, copia o link e cola na página — o lead cai direto no
            portal, sem passar por Clint nem por ninguém.
          </p>
        </div>
        <button
          onClick={() => setCriando((v) => !v)}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          <Plus size={15} strokeWidth={2.4} />
          Criar webhook
        </button>
      </div>

      {erro && (
        <p className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12.5px] font-medium text-rose-300">
          {erro}
        </p>
      )}

      {criando && (
        <form
          action={criar}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] p-4"
        >
          <label className="min-w-[220px] flex-1">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Pra que serve
            </span>
            <input
              name="nome"
              required
              autoFocus
              placeholder="Ex: LP Basic NanoFios"
              className="w-full rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
          </label>
          <label className="min-w-[180px] flex-1">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Tags (opcional)
            </span>
            <input
              name="tags"
              placeholder="nanofios, instagram"
              className="w-full rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pendente}
            className="btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {pendente && <Loader2 size={14} strokeWidth={2.4} className="animate-spin" />}
            Gerar link
          </button>
        </form>
      )}

      {webhooks.length === 0 && !criando && (
        <div className="rounded-xl border border-dashed border-[#262626] px-6 py-8 text-center">
          <p className="text-sm font-semibold text-neutral-300">
            Nenhum webhook criado ainda
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-neutral-500">
            Crie um, copie o link e cole na página. É o mesmo passo a passo do
            Clint — a diferença é que o link é seu.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {webhooks.map((w) => (
          <div
            key={w.id}
            className="rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-2 w-2 shrink-0 rounded-full ${w.ativo ? "bg-emerald-400" : "bg-neutral-600"}`}
                  />
                  <h4 className="truncate text-[15px] font-semibold text-white">
                    {w.nome}
                  </h4>
                  {!w.ativo && (
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      desligado
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[12px] text-neutral-500">
                  {w.recebidos
                    ? `${w.recebidos} lead${w.recebidos === 1 ? "" : "s"} recebido${w.recebidos === 1 ? "" : "s"}`
                    : "nenhum lead ainda"}
                  {w.tags?.length ? ` · tags: ${w.tags.join(", ")}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <form action={alternarWebhookAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <button
                    type="submit"
                    aria-label={w.ativo ? "Desligar" : "Ligar"}
                    className="rounded-lg border border-[#262626] p-2 text-neutral-400 transition hover:border-neutral-600 hover:text-white"
                  >
                    <Power size={13} strokeWidth={2.4} />
                  </button>
                </form>
                <form action={excluirWebhookAction}>
                  <input type="hidden" name="id" value={w.id} />
                  <button
                    type="submit"
                    aria-label={`Excluir ${w.nome}`}
                    className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                  </button>
                </form>
              </div>
            </div>

            {/* O link, do jeito que o Clint mostra: caixa + botão de copiar. */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-[#1f1f1f] bg-black/40 px-3 py-2.5 font-mono text-[12px] text-neutral-300">
                {linkDe(w.id)}
              </code>
              <button
                onClick={() => copiar(w.id)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#0a0a0a] transition hover:bg-neutral-200"
              >
                {copiado === w.id ? (
                  <>
                    <Check size={13} strokeWidth={2.6} /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={13} strokeWidth={2.4} /> Copiar link
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
