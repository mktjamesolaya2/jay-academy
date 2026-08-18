"use client";

import { useState } from "react";
import { Check, FileUp, TriangleAlert } from "lucide-react";
import { lerCsv, type LeituraDoCsv } from "@/lib/hotmart-csv";

/**
 * Sobe o relatório de vendas da Hotmart pro portal.
 *
 * ⚠️ Lê o arquivo **no navegador** e mostra o que entendeu ANTES de gravar.
 * Importador que engole o arquivo e diz "pronto!" é o jeito mais fácil de
 * encher o banco de lixo sem ninguém perceber — e aqui o lixo vira resposta
 * errada pra aluna sobre o acesso dela.
 *
 * ⚠️ O arquivo tem e-mail e nome de todas as compradoras. Ele não passa por
 * lugar nenhum além do navegador de quem subiu e do nosso servidor.
 */

const ROTULOS: Record<string, string> = {
  email: "E-mail da compradora",
  nome: "Nome",
  produto: "Produto",
  data: "Data da compra",
  situacao: "Situação",
};

export function ImportarVendas({
  importar,
}: {
  importar: (compras: string) => Promise<{ ok: boolean; gravadas?: number; erro?: string }>;
}) {
  const [leitura, setLeitura] = useState<LeituraDoCsv | null>(null);
  const [arquivo, setArquivo] = useState<string>("");
  const [gravando, setGravando] = useState(false);
  const [feito, setFeito] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(f: File | null) {
    setFeito(null);
    setErro(null);
    if (!f) return setLeitura(null);
    setArquivo(f.name);
    const texto = await f.text();
    setLeitura(lerCsv(texto));
  }

  async function gravar() {
    if (!leitura?.compras.length) return;
    setGravando(true);
    setErro(null);
    const r = await importar(JSON.stringify(leitura.compras));
    setGravando(false);
    if (r.ok) setFeito(r.gravadas ?? 0);
    else setErro(r.erro ?? "Não deu pra gravar.");
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#2a2a2a] bg-[#0d0d0d] px-5 py-6 transition hover:border-[#AC9751]/50">
        <FileUp size={18} strokeWidth={2} className="shrink-0 text-[#AC9751]" />
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-white">
            {arquivo || "Escolher o arquivo exportado da Hotmart"}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            CSV ou TXT. O arquivo é lido aqui no navegador primeiro — nada é
            gravado até você conferir e confirmar.
          </p>
        </div>
        <input
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => escolher(e.target.files?.[0] ?? null)}
        />
      </label>

      {leitura && (
        <>
          {/* O que ele entendeu de cada coluna. É aqui que se pega arquivo
              com cabeçalho diferente antes de gravar errado. */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
              O que eu entendi do arquivo
            </p>
            <div className="mt-3 space-y-1.5">
              {Object.entries(ROTULOS).map(([campo, rotulo]) => {
                const achou = leitura.colunas[campo];
                const essencial = campo === "email" || campo === "data";
                return (
                  <p key={campo} className="flex flex-wrap gap-x-2 text-[12.5px]">
                    <span className="text-neutral-500">{rotulo}:</span>
                    {achou ? (
                      <span className="font-mono text-neutral-200">{achou}</span>
                    ) : (
                      <span className={essencial ? "text-rose-300" : "text-neutral-600"}>
                        {essencial ? "NÃO ACHEI — sem isso não dá pra importar" : "não achei (tudo bem)"}
                      </span>
                    )}
                  </p>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3.5">
              <p className="text-[19px] font-semibold leading-none text-white">
                {leitura.compras.length}
              </p>
              <p className="mt-1.5 text-[12px] text-neutral-500">
                {leitura.compras.length === 1 ? "compra pronta" : "compras prontas"} pra importar
              </p>
            </div>
            <div
              className={`rounded-xl border px-4 py-3.5 ${
                leitura.descartadas.length
                  ? "border-amber-500/25 bg-amber-500/[0.04]"
                  : "border-[#1f1f1f] bg-[#0d0d0d]"
              }`}
            >
              <p className="text-[19px] font-semibold leading-none text-white">
                {leitura.descartadas.length}
              </p>
              <p className="mt-1.5 text-[12px] text-neutral-500">
                {leitura.descartadas.length === 1 ? "linha ficou de fora" : "linhas ficaram de fora"}
              </p>
            </div>
          </div>

          {leitura.descartadas.length > 0 && (
            <details className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4">
              <summary className="cursor-pointer text-[12.5px] font-semibold text-amber-300">
                <TriangleAlert size={12} strokeWidth={2.4} className="mr-1.5 inline" />
                Ver quais linhas ficaram de fora, e por quê
              </summary>
              <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-[12px] text-neutral-400">
                {leitura.descartadas.slice(0, 200).map((d, i) => (
                  <li key={i}>
                    <span className="font-mono text-neutral-600">linha {d.linha}</span> — {d.motivo}
                  </li>
                ))}
              </ul>
              {leitura.descartadas.length > 200 && (
                <p className="mt-2 text-[11.5px] text-neutral-600">
                  …e mais {leitura.descartadas.length - 200}. O número da linha é o
                  do arquivo, pra achar no Excel.
                </p>
              )}
            </details>
          )}

          {/* Uma amostra de verdade. Ler três linhas prontas pega troca de
              coluna que nenhum contador pegaria. */}
          {leitura.compras.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[#1f1f1f] bg-[#0d0d0d]">
              <table className="w-full text-left text-[12px]">
                <thead className="text-[10.5px] uppercase tracking-wider text-neutral-600">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">E-mail</th>
                    <th className="px-4 py-2.5 font-semibold">Produto</th>
                    <th className="px-4 py-2.5 font-semibold">Comprou em</th>
                    <th className="px-4 py-2.5 font-semibold">Situação</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-300">
                  {leitura.compras.slice(0, 3).map((c, i) => (
                    <tr key={i} className="border-t border-[#181818]">
                      <td className="px-4 py-2.5 font-mono">{c.email}</td>
                      <td className="px-4 py-2.5">{c.produto}</td>
                      <td className="px-4 py-2.5">
                        {new Date(c.compradaEm).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-2.5">{c.situacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-[#181818] px-4 py-2.5 text-[11.5px] text-neutral-600">
                Confere se cada coluna está no lugar certo antes de importar.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={gravar}
            disabled={gravando || !leitura.compras.length}
            className="rounded-full bg-[#AC9751] px-5 py-2.5 text-[13.5px] font-semibold text-[#101820] transition hover:brightness-110 disabled:opacity-40"
          >
            {gravando
              ? "Importando…"
              : `Importar ${leitura.compras.length} ${leitura.compras.length === 1 ? "compra" : "compras"}`}
          </button>
        </>
      )}

      {feito !== null && (
        <p className="flex items-center gap-2 text-[13px] text-emerald-400">
          <Check size={14} strokeWidth={2.6} />
          {feito} {feito === 1 ? "compra importada" : "compras importadas"}. O suporte
          já acha essas alunas.
        </p>
      )}
      {erro && <p className="text-[13px] text-rose-300">{erro}</p>}
    </div>
  );
}
