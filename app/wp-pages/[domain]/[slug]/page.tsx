import { notFound } from "next/navigation";
import Link from "next/link";
import { CrmCodigoForm } from "@/components/crm-codigo-form";
import { getLpFormConfig } from "@/lib/lp-form-config";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Layout,
  FileText,
  X,
  Eye,
  Pencil,
  Smartphone,
} from "lucide-react";
import { clsx } from "clsx";
import { Sidebar } from "@/components/sidebar";
import { loadContent } from "@/lib/wp-content-storage";
import type { WpDomain } from "@/lib/wp-api";
import { placeWpPageAction } from "../../actions";
import { PublishButton } from "@/components/publish-button";
import { WpFormBehavior } from "@/components/wp-form-behavior";
import { WpPageActions } from "@/components/wp-page-actions";
import { SmartSummary } from "@/components/smart-summary";
import { SeoShortcut } from "@/components/seo-shortcut";
import { ScheduleControl } from "@/components/schedule-control";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { formatDateTimeBR } from "@/lib/format-date";
import { pageOriginLabel } from "@/lib/page-origin";

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
  const formConfig = await getLpFormConfig(
    content.publicSlug || content.slug
  ).catch(() => null);

  const isPublished = !!content.published;
  const isForm = content.placed === "form";
  const publicSlug = content.publicSlug || content.slug;
  const domainLabel = pageOriginLabel(content);
  const encSlug = encodeURIComponent(content.slug);
  const editHref = `/wp-pages/${content.domain}/${encSlug}/edit`;
  const previewHref = `/wp-pages/${content.domain}/${encSlug}/preview`;
  const celularHref = `/wp-pages/${content.domain}/${encSlug}/celular`;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
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
                {content.sourceKind === "web"
                  ? "Página copiada da web"
                  : "Página do WordPress"}
              </p>
              <h2
                className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1"
                dangerouslySetInnerHTML={{ __html: content.title }}
              />
              <p className="text-neutral-500 mt-1.5 font-mono text-xs">
                {domainLabel}/{content.slug}
              </p>
              {isPublished && (
                <a
                  href={`/${publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-mono text-emerald-300/90 hover:text-emerald-200 transition"
                >
                  /{publicSlug}
                  <ExternalLink size={11} strokeWidth={2} />
                </a>
              )}
            </div>
            <div className="flex flex-col items-end gap-3">
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full ring-1",
                  isPublished
                    ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25"
                    : "bg-[#161616] text-neutral-400 ring-[#262626]"
                )}
              >
                <span
                  className={clsx(
                    "w-1.5 h-1.5 rounded-full",
                    isPublished ? "bg-emerald-400" : "bg-neutral-500"
                  )}
                />
                {isPublished ? "Publicada" : "Não publicada"}
              </span>
              {userCanEdit && (
                <WpPageActions
                  domain={content.domain}
                  slug={content.slug}
                  name={content.title}
                  published={isPublished}
                />
              )}
            </div>
          </div>
        </header>

        {isPublished ? (
          /* ===== PUBLICADA — tela de gestão limpa (padrão LP) ===== */
          <section className="px-5 py-6 lg:px-10 lg:py-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <Block title="Sobre essa página">
                <SmartSummary
                  domain={content.domain}
                  slug={content.slug}
                  summary={content.summary}
                  canEdit={userCanEdit}
                />
              </Block>

              {isForm && userCanEdit && (
                <Block title="Comportamento dos formulários">
                  <p className="text-neutral-400 text-sm mb-4 leading-relaxed">
                    Conecte o form da página a um webhook e defina pra onde
                    redirecionar depois do envio.
                  </p>
                  <WpFormBehavior
                    domain={content.domain}
                    slug={content.slug}
                    initialWebhookUrl={content.formWebhookUrl}
                    initialRedirectUrl={content.formRedirectUrl}
                    isPublished={isPublished}
                  />
                </Block>
              )}

            </div>

            <aside className="space-y-5">
              {/* ⚠️ Webhook em TODA página, não só nas que têm formulário.
                  James: "a webhook serviria pra tudo, pra todo tipo de página".
                  Mesmo componente e MESMO store das LPs (lp-form-config), pra
                  não existir "o webhook da LP" e "o da página do WP" como duas
                  coisas diferentes. */}
              {userCanEdit && (
                <Block title="Webhook">
                  <CrmCodigoForm
                    slug={content.publicSlug || content.slug}
                    codigo={formConfig?.codigoCrm}
                  />
                </Block>
              )}

              <Block title="Atalhos">
                <div className="space-y-2">
                  <ActionRow
                    icon={Globe}
                    label="Abrir página"
                    sub={`/${publicSlug}`}
                    href={`/${publicSlug}`}
                    external
                  />
                  {/* Sugestão "MOBILE" (06/08): faltava em TODA página WP —
                      tanto aqui (publicada) quanto na tela de não publicada. */}
                  <ActionRow
                    icon={Smartphone}
                    label="Ver no celular"
                    sub="Num iPhone 13, com atalho por dobra"
                    href={celularHref}
                  />
                  {userCanEdit && (
                    <ActionRow
                      icon={Pencil}
                      label="Editar visualmente"
                      sub="Editar o conteúdo da página"
                      href={editHref}
                    />
                  )}
                  {userCanEdit && (
                    <SeoShortcut
                      domain={content.domain}
                      slug={content.slug}
                      initialSlug={content.publicSlug || content.slug}
                      pageTitle={content.title.replace(/<[^>]*>/g, "")}
                      initial={{
                        seoTitle: content.seoTitle,
                        seoDescription: content.seoDescription,
                        seoImage: content.seoImage,
                        seoCanonical: content.seoCanonical,
                        seoNoIndex: content.seoNoIndex,
                      }}
                    />
                  )}
                </div>
              </Block>

              {userCanEdit && (
                <Block title="Agendamento">
                  <ScheduleControl
                    domain={content.domain}
                    slug={content.slug}
                    mode="unpublish"
                    current={content.scheduledUnpublishAt}
                  />
                </Block>
              )}

              {content.publishedAt && (
                <Block title="Publicada em">
                  <p className="text-neutral-300 text-sm font-medium">
                    {formatDateTimeBR(content.publishedAt)}
                  </p>
                </Block>
              )}
            </aside>
          </section>
        ) : (
          /* ===== NÃO PUBLICADA — categorizar + publicar ===== */
          <>
            {userCanEdit && (
              <section className="px-5 py-6 lg:px-10 lg:py-8">
                <div className="mb-6">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                    Onde colocar essa página?
                  </p>
                  <p className="text-neutral-400 text-sm mt-1.5 max-w-2xl">
                    Escolha uma categoria pra ela aparecer no dashboard. Pode
                    mudar depois.{" "}
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
                  {PLACEMENT_OPTIONS.map(
                    ({ value, label, icon: Icon, description }) => {
                      const isActive = content.placed === value;
                      return (
                        <form key={value} action={placeWpPageAction}>
                          <input
                            type="hidden"
                            name="domain"
                            value={content.domain}
                          />
                          <input
                            type="hidden"
                            name="slug"
                            value={content.slug}
                          />
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
                                  className={
                                    isActive
                                      ? "text-emerald-300"
                                      : "text-neutral-300"
                                  }
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
                    }
                  )}
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
              <section className="px-10 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <div className="mb-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                      Publicação
                    </p>
                    <p className="text-neutral-400 text-sm mt-1.5">
                      Quando publicada, qualquer pessoa com o link consegue ver
                      — sem precisar de login.
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
                  <div className="mt-3 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl p-4">
                    <ScheduleControl
                      domain={content.domain}
                      slug={content.slug}
                      mode="publish"
                      current={content.scheduledPublishAt}
                    />
                  </div>
                </div>

                {isForm && (
                  <div>
                    <div className="mb-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                        Comportamento dos formulários
                      </p>
                      <p className="text-neutral-400 text-sm mt-1.5">
                        Conecte o form da página a um webhook e defina pra onde
                        redirecionar depois do envio.
                      </p>
                    </div>
                    <WpFormBehavior
                      domain={content.domain}
                      slug={content.slug}
                      initialWebhookUrl={content.formWebhookUrl}
                      initialRedirectUrl={content.formRedirectUrl}
                      isPublished={!!content.published}
                    />
                  </div>
                )}
              </section>
            )}

            {userCanEdit && (
              <section className="px-10 pb-8">
                <div className="max-w-md">
                  <SeoShortcut
                    domain={content.domain}
                    slug={content.slug}
                    initialSlug={content.publicSlug || content.slug}
                    pageTitle={content.title.replace(/<[^>]*>/g, "")}
                    initial={{
                      seoTitle: content.seoTitle,
                      seoDescription: content.seoDescription,
                      seoImage: content.seoImage,
                      seoCanonical: content.seoCanonical,
                      seoNoIndex: content.seoNoIndex,
                    }}
                  />
                </div>
              </section>
            )}

            <section className="px-10 pb-12">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white tracking-[-0.02em]">
                  Conteúdo
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCanEdit && (
                  <Link
                    href={editHref}
                    className="flex items-center justify-between gap-4 bg-[#0f0f0f] border border-[#1f1f1f] hover:border-neutral-700 rounded-2xl px-6 py-5 transition group"
                  >
                    <div>
                      <p className="text-white font-semibold text-[15px]">
                        Editar visualmente
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                        Editar o conteúdo da página
                      </p>
                    </div>
                    <Pencil
                      size={15}
                      strokeWidth={2.2}
                      className="text-neutral-400 group-hover:text-white transition"
                    />
                  </Link>
                )}
                <a
                  href={previewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 bg-[#0f0f0f] border border-[#1f1f1f] hover:border-neutral-700 rounded-2xl px-6 py-5 transition group"
                >
                  <div>
                    <p className="text-white font-semibold text-[15px]">
                      Abrir preview
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                      Renderiza o HTML em tela cheia
                    </p>
                  </div>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white group-hover:translate-x-0.5 transition">
                    <Eye size={15} strokeWidth={2.2} />
                    <ExternalLink size={13} strokeWidth={2.2} />
                  </span>
                </a>
                {/* Sugestão "MOBILE" (06/08): as páginas WP não tinham como
                    ver no celular. Mesmo preview das LPs. */}
                <Link
                  href={celularHref}
                  className="flex items-center justify-between gap-4 bg-[#0f0f0f] border border-[#1f1f1f] hover:border-neutral-700 rounded-2xl px-6 py-5 transition group"
                >
                  <div>
                    <p className="text-white font-semibold text-[15px]">
                      Ver no celular
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 font-medium">
                      A página rodando num iPhone 13, com atalho por dobra
                    </p>
                  </div>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white group-hover:translate-x-0.5 transition">
                    <Smartphone size={15} strokeWidth={2.2} />
                  </span>
                </Link>
              </div>
            </section>
          </>
        )}
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
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  label: string;
  sub: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      <div className="flex items-start gap-3 p-3 rounded-lg border border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#121212] transition">
        <Icon size={14} strokeWidth={2} className="text-neutral-500 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white">{label}</p>
          <p className="text-[11px] text-neutral-500 truncate font-medium">
            {sub}
          </p>
        </div>
      </div>
    </a>
  );
}
