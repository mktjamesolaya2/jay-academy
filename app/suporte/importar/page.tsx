import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ImportarVendas } from "@/components/importar-vendas";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { importarVendasAction, fecharImportacaoAction } from "@/app/suporte/actions";

/**
 * Importar o histórico de vendas da Hotmart.
 *
 * ⚠️ Existe porque a API de vendas está barrada pra nossa conta. Sem isto, o
 * suporte só enxerga compra feita DEPOIS que o webhook foi ligado — e quem
 * escreve dizendo "não consigo acessar" costuma ser justamente a aluna antiga.
 *
 * ⚠️ Não é um substituto permanente: é um retrato. Roda de novo quando quiser
 * atualizar, e o webhook continua cuidando das vendas novas sozinho.
 */

export const dynamic = "force-dynamic";

export default async function ImportarPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/suporte/importar");
  if (!canEdit(me)) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-5 lg:px-8 lg:pt-8 lg:pb-6">
          <Link
            href="/suporte"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-500 transition hover:text-white"
          >
            <ArrowLeft size={13} strokeWidth={2.2} />
            Suporte
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">
            Importar vendas da Hotmart
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-500">
            Enquanto a Hotmart não libera a API de vendas, o suporte só enxerga
            compra feita depois que o webhook foi ligado. Sobe aqui os relatórios
            exportados do painel — pode ser vários de uma vez — e ele passa a
            achar as alunas antigas também.
          </p>
        </header>

        <section className="px-5 py-6 lg:px-8 lg:py-7">
          <div className="max-w-2xl space-y-5">
            <ol className="space-y-1.5 rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-5 py-4 text-[12.5px] leading-relaxed text-neutral-400">
              <li>
                <span className="text-neutral-600">1.</span> No painel da
                Hotmart, vai em <strong className="text-neutral-200">Vendas</strong>{" "}
                e exporta o relatório em CSV.
              </li>
              <li>
                <span className="text-neutral-600">2.</span> Pede o período mais
                largo que der — o acesso vale 12 meses, então dois anos cobre com
                folga.
              </li>
              <li>
                <span className="text-neutral-600">3.</span> Sobe o arquivo aqui
                embaixo e confere o que apareceu antes de importar.
              </li>
            </ol>

            <ImportarVendas importar={importarVendasAction} fechar={fecharImportacaoAction} />
          </div>
        </section>
      </main>
    </div>
  );
}
