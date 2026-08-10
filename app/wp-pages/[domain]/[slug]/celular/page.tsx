import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { PreviewCelular } from "@/components/preview-celular";
import { loadContent } from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";

/**
 * Ver uma página migrada do WP no celular.
 *
 * ⚠️ Sugestão "MOBILE" (Administrador, 06/08): "as páginas WP não estão vindo
 * com a opção de ver a opção mobile". O preview de celular existia só nas LPs
 * (/lps/[slug]/celular) — as migradas ficaram de fora. Mesmo componente,
 * mesma moldura.
 *
 * Aponta para a rota de preview DAQUI (/wp-pages/.../preview), e não para o
 * link público do WP: sendo mesma origem, o componente consegue ler as dobras
 * de dentro do iframe e montar os atalhos. Apontar pro domínio original faria
 * o navegador barrar a leitura e os atalhos sumiriam.
 */

export const dynamic = "force-dynamic";

type Params = Promise<{ domain: string; slug: string }>;

export default async function CelularWpPage({ params }: { params: Params }) {
  const { domain, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const content = await loadContent(domain as WpDomain, decodedSlug);
  if (!content) notFound();

  const encSlug = encodeURIComponent(content.slug);
  const titulo = content.title.replace(/<[^>]*>/g, "");

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-5 lg:px-10 lg:pt-8 lg:pb-5">
          <Link
            href={`/wp-pages/${content.domain}/${encSlug}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-white"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            {titulo}
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-white lg:text-2xl">
            No celular
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            A página de verdade rodando num iPhone 13. Role dentro da tela.
          </p>
        </header>

        <div className="px-5 py-6 lg:px-10">
          <PreviewCelular
            url={`/wp-pages/${content.domain}/${encSlug}/preview`}
            nome={titulo}
          />
        </div>
      </main>
    </div>
  );
}
