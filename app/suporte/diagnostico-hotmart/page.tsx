import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { sondar, sondarVendas } from "@/lib/hotmart-sonda";

/**
 * O diagnóstico da Hotmart, em tela legível.
 *
 * ⚠️ Existe pra **gravar em vídeo**: o suporte da Hotmart pediu um vídeo do
 * processo pra anexar no chamado interno. A alternativa era o James rodar as
 * chamadas no Postman ou no terminal — e aí o cabeçalho `Authorization`
 * apareceria na gravação, que vai virar anexo num sistema de terceiro. Token
 * expira; `client_secret` não.
 *
 * ⚠️ Nenhuma credencial aparece aqui. Só método, endereço, código e resposta.
 *
 * ⚠️ Só GET. Nada nesta tela executa ação na conta.
 */

export const dynamic = "force-dynamic";

export default async function DiagnosticoPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/suporte/diagnostico-hotmart");
  if (!canEdit(me)) redirect("/dashboard");

  const email = ((await searchParams).email ?? "comprador@exemplo.com").trim();

  const [vendas, club] = await Promise.all([
    sondarVendas(email).catch(() => []),
    sondar("pmuclass").catch(() => []),
  ]);

  const linhas = [...vendas, ...club];

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
            Diagnóstico das APIs da Hotmart
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-500">
            Cada linha é uma chamada real, feita agora, com a credencial de
            produção da conta. Só leitura — nada aqui executa ação.
          </p>
        </header>

        <section className="space-y-2 px-5 py-6 lg:px-8 lg:py-7">
          {/* O resumo que fecha o argumento, no topo: dá pra ler em 3 segundos
              num vídeo, que é como isto vai ser assistido. */}
          <div className="mb-5 max-w-3xl rounded-xl border border-[#AC9751]/25 bg-[#AC9751]/[0.05] px-5 py-4">
            <p className="text-[13px] leading-relaxed text-[#F4F1EA]/85">
              A credencial <strong>autentica normalmente</strong> — o{" "}
              <span className="font-mono text-[12px]">/subscriptions</span>{" "}
              responde 200 com dados reais no mesmo token e no mesmo momento.
              Mesmo assim, <strong>todo</strong>{" "}
              <span className="font-mono text-[12px]">/sales/</span> responde 400{" "}
              <span className="font-mono text-[12px]">invalid_parameter</span>,
              inclusive <strong>sem nenhum parâmetro</strong> — e uma chamada sem
              parâmetro não pode falhar por parâmetro inválido.
            </p>
          </div>

          {linhas.map((l, i) => {
            const ok = l.status >= 200 && l.status < 300;
            return (
              <div
                key={i}
                className={`max-w-3xl rounded-xl border px-4 py-3.5 ${
                  ok
                    ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                    : "border-[#1f1f1f] bg-[#0d0d0d]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
                      ok
                        ? "bg-emerald-500/15 text-emerald-300"
                        : l.status === 0
                          ? "bg-neutral-700/30 text-neutral-400"
                          : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {ok ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                    {l.status || "erro"}
                  </span>
                  <span className="font-mono text-[10.5px] font-semibold text-neutral-600">
                    GET
                  </span>
                  <span className="min-w-0 break-all font-mono text-[12px] text-neutral-200">
                    {l.endereco}
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] text-neutral-400">{l.leitura}</p>
                {l.resposta && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-neutral-400">
                    {l.resposta}
                  </pre>
                )}
              </div>
            );
          })}

          <p className="max-w-3xl pt-3 text-[11.5px] leading-relaxed text-neutral-600">
            Nenhuma credencial aparece nesta tela — só método, endereço, código
            de resposta e o corpo devolvido pela Hotmart.
          </p>
        </section>
      </main>
    </div>
  );
}
