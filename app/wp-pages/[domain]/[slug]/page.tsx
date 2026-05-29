import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Layout,
  FileText,
  X,
  Eye,
  Trash2,
  Pencil,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { loadContent } from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";
import { deleteWpPageAction, placeWpPageAction } from "../../actions";
import { PublishButton } from "@/components/publish-button";
import { canEdit, getCurrentUser } from "@/lib/auth";

type Params = Promise<{ domain: string; slug: string }>;

const PLACEMENT_OPTIONS = [
  {
    value: "website",
    label: "Website",
    icon: Globe,
    description: "Página é parte de um site multi-página",
  },
  {
    value: "lp",
    label: "Landing page",
    icon: Layout,
    description: "Página de venda/captação única",
  },
  {
    value: "form",
    label: "Formulário",
    icon: FileText,
    description: "Cadastro, obrigado ou contato",
  },
] as const;

export default async function WpPageDetailPage({
  params,
}: {
  params: Params;
}) {
  const { domain, slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const [content, me] = await Promise.all([
    loadContent(domain as WpDomain, decodedSlug),
    getCurrentUser(),
  ]);
  if (!content) notFound();
  const userCanEdit = canEdit(me);

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
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                Página do WordPress
              </p>
              <h2
                className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1"
                dangerouslySetInnerHTML={{ __html: content.title }}
              />
              <p className="text-neutral-500 mt-1.5 font-mono text-xs">
                {content.domain === "main"
                  ? "jayacademy.com.br"
                  : "lp.jayacademy.com.br"}
                /{content.slug}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {userCanEdit && (
                <Link
                  href={`/wp-pages/${content.domain}/${encodeURIComponent(
                    content.slug
                  )}/edit`}
                  className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  <Pencil size={13} strokeWidth={2.4} />
                  Editar
                </Link>
              )}
              <a
                href={content.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Ver no WP
                <ExternalLink size={13} strokeWidth={2} />
              </a>
              {userCanEdit && (
                <form action={deleteWpPageAction}>
                  <input type="hidden" name="domain" value={content.domain} />
                  <input type="hidden" name="slug" value={content.slug} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                    Excluir
                  </button>
                </form>
              )}
            </div>
          </div>
        </header>

        {userCanEdit && (
        <section className="px-10 py-8">
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
              Onde colocar essa página?
            </p>
            <p className="text-neutral-400 text-sm mt-1.5 max-w-2xl">
              Escolha uma categoria pra ela aparecer no dashboard. Pode mudar
              depois.{" "}
              {content.placed && (
                <span className="text-emerald-300 font-semibold">
                  Atualmente em:{" "}
                  {content.placed === "website"
                    ? "Website"
                    : content.placed === "lp"
                    ? "Landing pages"
                    : "Formulários"}
                </span>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLACEMENT_OPTIONS.map(({ value, label, icon: Icon, description }) => {
              const isActive = content.placed === value;
              return (
                <form key={value} action={placeWpPageAction}>
                  <input type="hidden" name="domain" value={content.domain} />
                  <input type="hidden" name="slug" value={content.slug} />
                  <input type="hidden" name="type" value={value} />
                  <button
                    type="submit"
                    className={
                      isActive
                        ? "w-full text-left bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-5 transition"
                        : "w-full text-left bg-[#0f0f0f] border border-[#1f1f1f] hover:border-neutral-700 rounded-2xl p-5 transition"
                    }
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={
                          isActive
                            ? "w-10 h-10 rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30 flex items-center justify-center"
                            : "w-10 h-10 rounded-lg bg-[#161616] flex items-center justify-center"
                        }
                      >
                        <Icon
                          size={16}
                          strokeWidth={2}
                          className={isActive ? "text-emerald-300" : "text-neutral-300"}
                        />
                      </span>
                      <h3 className="font-semibold text-lg text-white tracking-tight">
                        {label}
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {description}
                    </p>
                    {isActive && (
                      <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-emerald-300 font-semibold">
                        Selecionado
                      </p>
                    )}
                  </button>
                </form>
              );
            })}
          </div>

          {content.placed && (
            <form action={placeWpPageAction} className="mt-4">
              <input type="hidden" name="domain" value={content.domain} />
              <input type="hidden" name="slug" value={content.slug} />
              <input type="hidden" name="type" value="" />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition font-medium"
              >
                <X size={12} strokeWidth={2} />
                Tirar da categoria (voltar pra sem categoria)
              </button>
            </form>
          )}
        </section>

        )}

        {userCanEdit && (
          <section className="px-10 pb-8">
            <div className="mb-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                Publicação
              </p>
              <p className="text-neutral-400 text-sm mt-1.5 max-w-2xl">
                Quando publicada, qualquer pessoa com o link consegue ver — sem
                precisar de login.
              </p>
            </div>
            <PublishButton
              content={{
                domain: content.domain,
                slug: content.slug,
                published: content.published,
                publicSlug: content.publicSlug,
                publishedAt: content.publishedAt,
              }}
            />
          </section>
        )}

        <section className="px-10 pb-12">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white tracking-[-0.02em]">
              Preview do conteúdo
            </h3>
            <p className="text-[11px] text-neutral-500 font-medium">
              Editor visual vem no próximo passo
            </p>
          </div>
          <a
            href={`/wp-pages/${content.domain}/${encodeURIComponent(
              content.slug
            )}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 bg-gradient-to-r from-[#0f0f0f] to-[#0c0c0c] border border-[#1f1f1f] hover:border-neutral-700 rounded-2xl px-6 py-5 transition group"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                Conteúdo copiado
              </p>
              <p className="text-white font-semibold mt-1 text-[15px]">
                Abrir preview em nova aba
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                Renderiza o HTML em tela cheia, sem cortes
              </p>
            </div>
            <span className="flex items-center gap-2 text-sm font-semibold text-white group-hover:translate-x-0.5 transition">
              <Eye size={15} strokeWidth={2.2} />
              Abrir preview
              <ExternalLink size={13} strokeWidth={2.2} />
            </span>
          </a>
        </section>
      </main>
    </div>
  );
}
