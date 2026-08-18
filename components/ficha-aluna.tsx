"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

/**
 * A ficha da aluna, ao lado da conversa.
 *
 * ⚠️ James: *"ao clicar na aluna aparece meio q a ficha dela"*. Serve pra ele
 * resolver o atendimento **sem ler a conversa toda**: o protocolo que ela
 * ditou, o e-mail pra colar na Hotmart e o botão pra falar com ela.
 *
 * ⚠️ Os dois valores são copiáveis num clique de propósito. Selecionar
 * e-mail com o mouse num painel escuro é chato, e o gesto seguinte é sempre o
 * mesmo: colar na Hotmart.
 */

export function FichaAluna({
  protocolo,
  nome,
  email,
  quando,
  situacao,
  whatsapp,
}: {
  protocolo: string;
  nome: string;
  email?: string;
  quando: string;
  situacao: string;
  whatsapp: string | null;
}) {
  return (
    <aside className="w-full shrink-0 space-y-3 lg:w-[250px]">
      <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-4">
        <Campo rotulo="Protocolo" valor={protocolo} destaque />
        <Linha rotulo="Nome" valor={nome} />
        {email ? <Campo rotulo="E-mail" valor={email} /> : <Linha rotulo="E-mail" valor="não informado" apagado />}
        <Linha rotulo="Começou" valor={quando} />
        <Linha rotulo="Situação" valor={situacao} />
      </div>

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#AC9751] px-4 py-2.5 text-[13px] font-semibold text-[#101820] transition hover:brightness-110"
        >
          <MessageCircle size={14} strokeWidth={2.4} />
          Falar no WhatsApp
        </a>
      )}
    </aside>
  );
}

/** Rótulo e valor, sem nada pra clicar. */
function Linha({
  rotulo,
  valor,
  apagado,
}: {
  rotulo: string;
  valor: string;
  apagado?: boolean;
}) {
  return (
    <div className="border-t border-[#191919] pt-2.5 first:border-0 first:pt-0 [&+*]:mt-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
        {rotulo}
      </p>
      <p className={`mt-0.5 text-[13px] ${apagado ? "text-neutral-600" : "text-neutral-200"}`}>
        {valor}
      </p>
    </div>
  );
}

/** Rótulo e valor que se copia num clique. */
function Campo({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  const [copiou, setCopiou] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiou(true);
      setTimeout(() => setCopiou(false), 1600);
    } catch {
      // Navegador sem permissão de área de transferência. O valor continua na
      // tela pra selecionar com a mão — melhor que um erro em cima do e-mail.
    }
  }

  return (
    <div className="border-t border-[#191919] pt-2.5 first:border-0 first:pt-0 [&+*]:mt-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
        {rotulo}
      </p>
      <button
        type="button"
        onClick={copiar}
        title={`Copiar ${rotulo.toLowerCase()}`}
        className="group mt-0.5 flex w-full items-center gap-1.5 text-left"
      >
        <span
          className={`min-w-0 break-all font-mono ${
            destaque
              ? "text-[15px] font-semibold tracking-wider text-[#AC9751]"
              : "text-[12.5px] text-neutral-200"
          }`}
        >
          {valor}
        </span>
        {copiou ? (
          <Check size={12} strokeWidth={2.6} className="shrink-0 text-emerald-400" />
        ) : (
          <Copy
            size={11}
            strokeWidth={2.2}
            className="shrink-0 text-neutral-700 transition group-hover:text-neutral-400"
          />
        )}
      </button>
    </div>
  );
}
