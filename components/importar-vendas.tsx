"use client";

import { useState } from "react";
import { Check, FileUp, TriangleAlert } from "lucide-react";
import { lerCsv, agruparPorEmail, emLotes, type LeituraDoCsv } from "@/lib/hotmart-csv";

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

/** E-mails por requisição. 300 × ~2 idas ao banco cabe folgado no tempo limite. */
const POR_LOTE = 300;

export function ImportarVendas({
  importar,
  fechar,
}: {
  importar: (lote: string) => Promise<{ ok: boolean; gravadas?: number; erro?: string }>;
  fechar: (total: number, alunas: number, arquivos: string[]) => Promise<{ ok: boolean }>;
}) {
  const [leitura, setLeitura] = useState<LeituraDoCsv | null>(null);
  const [arquivo, setArquivo] = useState<string>("");
  const [nomes, setNomes] = useState<string[]>([]);
  const [gravando, setGravando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [feito, setFeito] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(lista: FileList | null) {
    setFeito(null);
    setErro(null);
    if (!lista?.length) return setLeitura(null);

    // ⚠️ Aceita VÁRIOS arquivos: a Hotmart exporta um por ano, e são sete.
    // Subir um de cada vez multiplicaria por sete a chance de esquecer um — e
    // o ano esquecido vira aluna que o suporte não acha.
    const arquivos = [...lista];
    setNomes(arquivos.map((f) => f.name));
    setArquivo(
      arquivos.length === 1 ? arquivos[0]!.name : `${arquivos.length} arquivos`
    );

    const juntas: LeituraDoCsv = { compras: [], colunas: {}, descartadas: [] };
    for (const f of arquivos) {
      const r = lerCsv(await f.text());
      juntas.compras.push(...r.compras);
      juntas.descartadas.push(...r.descartadas);
      if (!Object.keys(juntas.colunas).length) juntas.colunas = r.colunas;
    }
    setLeitura(juntas);
  }

  async function gravar() {
    if (!leitura?.compras.length) return;
    setGravando(true);
    setErro(null);
    setProgresso(0);

    // Agrupa por e-mail ANTES de mandar: uma escrita por pessoa, não por linha.
    // Com 12 mil linhas a diferença é entre segundos e estourar no meio.
    const porPessoa = agruparPorEmail(leitura.compras);
    const lotes = emLotes(porPessoa, POR_LOTE);
    let total = 0;

    for (let i = 0; i < lotes.length; i++) {
      const r = await importar(JSON.stringify(lotes[i]));
      if (!r.ok) {
        setGravando(false);
        // ⚠️ Diz ONDE parou. "Deu erro" depois de 4 mil alunas gravadas
        // deixaria ninguém sabendo se pode tentar de novo (pode: reimportar
        // atualiza em vez de duplicar).
        setErro(
          `${r.erro ?? "Não deu pra gravar."} — parou no lote ${i + 1} de ${lotes.length}, com ${total} compras já gravadas. Dá pra rodar de novo: reimportar atualiza em vez de duplicar.`
        );
        return;
      }
      total += r.gravadas ?? 0;
      setProgresso(Math.round(((i + 1) / lotes.length) * 100));
    }

    const alunas = porPessoa.length;
    await fechar(total, alunas, nomes).catch(() => {});
    setGravando(false);
    setFeito(total);
  }

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#2a2a2a] bg-[#0d0d0d] px-5 py-6 transition hover:border-[#AC9751]/50">
        <FileUp size={18} strokeWidth={2} className="shrink-0 text-[#AC9751]" />
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-white">
            {arquivo || "Escolher os arquivos exportados da Hotmart"}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Pode escolher vários de uma vez — a Hotmart exporta um por ano. São
            lidos aqui no navegador, e nada é gravado até você conferir.
          </p>
        </div>
        <input
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="hidden"
          multiple
          onChange={(e) => {
            escolher(e.target.files);
            // ⚠️ Zera o campo. Sem isto, escolher OS MESMOS arquivos de novo
            // não dispara nada — o navegador só avisa quando o valor muda — e
            // reimportar o mesmo pacote exigia recarregar a página.
            e.target.value = "";
          }}
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
              ? `Importando… ${progresso}%`
              : `Importar ${leitura.compras.length} ${leitura.compras.length === 1 ? "compra" : "compras"}`}
          </button>

          {/* ⚠️ Barra de verdade, porque isto demora. São 8.477 e-mails em 29
              lotes — sem sinal de vida, quem está olhando fecha a aba no meio. */}
          {gravando && (
            <div className="h-1.5 max-w-xs overflow-hidden rounded-full bg-[#1a1a1a]">
              <div
                className="h-full rounded-full bg-[#AC9751] transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
          )}
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
