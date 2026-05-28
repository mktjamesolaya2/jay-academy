import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FolderOpen,
  Terminal,
  Globe,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { statusLabel, statusColors } from "@/lib/landing-pages";
import { getLpFromStore } from "@/lib/lp-store";
import { clsx } from "clsx";
import { LpActionsMenu } from "@/components/lp-actions-menu";

type Params = Promise<{ slug: string }>;

export default async function LpDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const lp = await getLpFromStore(slug);
  if (!lp) notFound();

  const style = statusColors[lp.status];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pro dashboard
          </Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                /{lp.slug}
              </p>
              <h2 className="text-4xl font-extrabold tracking-tight text-white mt-1">
                {lp.name}
              </h2>
              <p className="text-neutral-400 mt-1.5 text-[15px]">{lp.tagline}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full ring-1",
                    style.bg,
                    style.text
                  )}
                >
                  <span
                    className={clsx("w-1.5 h-1.5 rounded-full", style.dot)}
                  />
                  {statusLabel[lp.status]}
                </span>
                {lp.stack && (
                  <span className="text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-[#161616] text-neutral-400">
                    {lp.stack}
                  </span>
                )}
              </div>
              <LpActionsMenu lp={lp} />
            </div>
          </div>
        </header>

        <section className="px-10 py-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {!lp.localPath && (
              <div className="bg-amber-500/5 border border-amber-500/25 rounded-2xl p-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300 font-semibold">
                  Página em rascunho
                </p>
                <h3 className="text-base font-semibold text-white mt-1.5">
                  Conteúdo ainda não foi construído
                </h3>
                <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
                  Você criou o registro dessa página, mas o HTML/visual dela
                  ainda não existe. Pra continuar:
                </p>
                <ul className="text-sm text-neutral-300 mt-3 space-y-1.5">
                  <li>
                    <span className="text-amber-300 font-semibold">•</span>{" "}
                    Peça pro programador (Claude) estruturar essa página
                  </li>
                  <li>
                    <span className="text-amber-300 font-semibold">•</span>{" "}
                    Ou crie a pasta{" "}
                    <code className="bg-[#161616] px-1.5 py-0.5 rounded text-xs font-mono">
                      {lp.slug}/
                    </code>{" "}
                    com os arquivos da página
                  </li>
                  <li>
                    <span className="text-amber-300 font-semibold">•</span>{" "}
                    Ou importe uma página similar do WordPress e adapte
                  </li>
                </ul>
              </div>
            )}

            <Block title="Sobre essa página">
              <p className="text-neutral-300 leading-relaxed">
                {lp.description || (
                  <span className="text-neutral-600 italic">
                    Sem descrição ainda.
                  </span>
                )}
              </p>
            </Block>

            {lp.localPath && (
              <Block title="Como rodar localmente">
                <ol className="text-sm text-neutral-400 space-y-3 leading-relaxed">
                <li>
                  <span className="text-neutral-600 mr-2 font-mono">1.</span>
                  Vá pra pasta do projeto:
                  <code className="block mt-1.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-3 py-2 text-neutral-200 text-xs font-mono">
                    cd {lp.localPath}
                  </code>
                </li>
                <li>
                  <span className="text-neutral-600 mr-2 font-mono">2.</span>
                  Inicie o servidor:
                  <code className="block mt-1.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-3 py-2 text-neutral-200 text-xs font-mono">
                    {lp.stack.startsWith("HTML")
                      ? "npx http-server -p 5500"
                      : "npm install && npm run dev"}
                  </code>
                </li>
                {lp.devUrl && (
                  <li>
                    <span className="text-neutral-600 mr-2 font-mono">3.</span>
                    Abra no navegador:{" "}
                    <a
                      href={lp.devUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-semibold hover:underline"
                    >
                      {lp.devUrl}
                    </a>
                  </li>
                )}
              </ol>
            </Block>
            )}

            <Block title="Path público quando deployar">
              <p className="text-neutral-400 text-sm leading-relaxed">
                URL final pública dessa LP:
              </p>
              <code className="block mt-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-3 py-2.5 text-white text-sm font-mono">
                https://jayacademy.com.br/{lp.slug}
              </code>
            </Block>
          </div>

          <aside className="space-y-5">
            <Block title="Atalhos">
              <div className="space-y-2">
                {lp.devUrl && (
                  <ActionRow
                    icon={ExternalLink}
                    label="Abrir LP local"
                    sub={lp.devUrl.replace("http://", "")}
                    href={lp.devUrl}
                    external
                  />
                )}
                <ActionRow icon={FolderOpen} label="Pasta" sub={lp.localPath} />
                <ActionRow icon={Terminal} label="Stack" sub={lp.stack} />
                {lp.productionUrl && (
                  <ActionRow
                    icon={Globe}
                    label="Produção"
                    sub={lp.productionUrl}
                    href={lp.productionUrl}
                    external
                  />
                )}
              </div>
            </Block>

            <Block title="Criada em">
              <p className="text-neutral-300 text-sm font-medium">{lp.createdAt}</p>
            </Block>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-4">
        {title}
      </p>
      {children}
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  sub,
  href,
  external,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  sub: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#121212] transition">
      <Icon size={14} strokeWidth={2} className="text-neutral-500 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white">{label}</p>
        <p className="text-[11px] text-neutral-500 truncate font-medium">{sub}</p>
      </div>
    </div>
  );
  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {inner}
      </a>
    );
  }
  return inner;
}
