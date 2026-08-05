import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { PreviewCelular } from "@/components/preview-celular";
import { getLpFromStore } from "@/lib/lp-store";
import { publicUrlFor } from "@/lib/landing-pages";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export default async function PreviewCelularPage({ params }: { params: Params }) {
  const { slug } = await params;
  const lp = await getLpFromStore(slug);
  if (!lp) notFound();

  /**
   * Caminho relativo de propósito: o portal serve a LP no próprio slug, então
   * `/academy` funciona tanto no localhost quanto em produção — e por ser mesma
   * origem, os atalhos por dobra conseguem ler o conteúdo. Só cai pra URL
   * pública quando a LP mora fora daqui.
   */
  const url = lp.productionUrl && !lp.productionUrl.includes("jayacademy")
    ? publicUrlFor(lp) ?? `/${slug}`
    : `/${slug}`;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-5 lg:px-10 lg:pt-8 lg:pb-5">
          <Link
            href={`/lps/${slug}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-white"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            {lp.name}
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-white lg:text-2xl">
            No celular
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            A página de verdade rodando num iPhone 13. Role dentro da tela.
          </p>
        </header>

        <div className="px-5 py-6 lg:px-10">
          <PreviewCelular url={url} nome={lp.name} />
        </div>
      </main>
    </div>
  );
}
