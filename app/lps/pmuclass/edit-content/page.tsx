import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { loadPmuClassContent } from "@/lib/lp-content-store";
import { EditPmuContentView } from "./edit-pmu-content-view";

export const dynamic = "force-dynamic";

export default async function EditPmuClassContentPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/lps/pmuclass/edit-content");
  if (!canEdit(me)) redirect("/lps/pmuclass");

  const content = await loadPmuClassContent();

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
          <Link
            href="/lps/pmuclass"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pra PMU CLASS
          </Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                PMU CLASS · Editor de conteúdo
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
                Textos, links e WhatsApp
              </h2>
              <p className="text-neutral-400 mt-1.5 text-sm max-w-2xl">
                Os textos abaixo aparecem direto em{" "}
                <span className="font-mono text-neutral-300">/pmuclass</span> e
                refletem em até <span className="text-neutral-300">15 segundos</span>{" "}
                (cache curto). Imagens e vídeos são gerados pelo build —
                me avise quando quiser trocar essas.
              </p>
            </div>
            <Link
              href="/pmuclass"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Ver no ar
              <ExternalLink size={13} strokeWidth={2} />
            </Link>
          </div>
        </header>

        <section className="px-10 py-8 max-w-4xl">
          <EditPmuContentView initialContent={content} />
        </section>
      </main>
    </div>
  );
}
