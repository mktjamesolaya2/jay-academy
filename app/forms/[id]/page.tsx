import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Trash2,
  Webhook,
  Globe,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { getForm, listSubmissions } from "@/lib/forms-store";
import { deleteFormAction } from "../actions";
import { EditFormView } from "./edit-form-view";
import { CopyableUrl } from "@/components/copyable-url";

type Params = Promise<{ id: string }>;

export const dynamic = "force-dynamic";

export default async function FormDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/forms");
  if (!canEdit(me)) {
    redirect("/forms");
  }

  const [form, submissions] = await Promise.all([
    getForm(id),
    listSubmissions(id, 100),
  ]);
  if (!form) notFound();

  const publicPath = `/f/${form.slug}`;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
          <Link
            href="/forms"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pros formulários
          </Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                Formulário
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
                {form.name}
              </h2>
              {form.description && (
                <p className="text-neutral-400 mt-1.5 text-sm max-w-2xl">
                  {form.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Abrir público
                <ExternalLink size={13} strokeWidth={2} />
              </Link>
              <form action={deleteFormAction}>
                <input type="hidden" name="id" value={form.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition"
                >
                  <Trash2 size={13} strokeWidth={2} />
                  Excluir
                </button>
              </form>
            </div>
          </div>
        </header>

        <section className="px-10 py-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Block title="URL pública">
              <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
                Compartilhe esse link ou embute em outra LP. Sem login.
              </p>
              <CopyableUrl path={publicPath} />
            </Block>

            <Block title="Configuração">
              <EditFormView
                id={form.id}
                name={form.name}
                description={form.description}
                buttonLabel={form.buttonLabel}
                webhookUrl={form.webhookUrl}
                redirectUrl={form.redirectUrl}
              />
            </Block>

            <Block title={`Leads recebidos (${submissions.length})`}>
              {submissions.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">
                  Nenhum lead ainda. Vão aparecer aqui em tempo real.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {submissions.map((s) => (
                    <SubmissionRow key={s.id} submission={s} />
                  ))}
                </div>
              )}
            </Block>
          </div>

          <aside className="space-y-5">
            <Block title="Comportamento configurado">
              <div className="space-y-3">
                <Behavior
                  icon={Webhook}
                  iconColor="text-emerald-300"
                  label="Webhook"
                  configured={!!form.webhookUrl}
                  detail={form.webhookUrl}
                />
                <Behavior
                  icon={Globe}
                  iconColor="text-violet-300"
                  label="Redirect"
                  configured={!!form.redirectUrl}
                  detail={form.redirectUrl}
                />
              </div>
              {!form.webhookUrl && !form.redirectUrl && (
                <p className="text-[11px] text-amber-300/90 mt-3 leading-relaxed">
                  Sem webhook nem redirect — leads ficam só guardados aqui no
                  portal. Recomendo configurar pelo menos um.
                </p>
              )}
            </Block>

            <Block title="Criado em">
              <p className="text-neutral-300 text-sm font-medium">
                {new Date(form.createdAt).toLocaleString("pt-BR")}
              </p>
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

function Behavior({
  icon: Icon,
  iconColor,
  label,
  configured,
  detail,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  iconColor: string;
  label: string;
  configured: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-7 h-7 rounded-md bg-[#161616] flex items-center justify-center shrink-0">
        <Icon size={12} strokeWidth={2} className={iconColor} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white">{label}</p>
        {configured ? (
          <p className="text-[10px] text-neutral-500 font-mono truncate mt-0.5">
            {detail}
          </p>
        ) : (
          <p className="text-[10px] text-neutral-600 mt-0.5">Não configurado</p>
        )}
      </div>
    </div>
  );
}

function SubmissionRow({
  submission,
}: {
  submission: import("@/lib/forms-store").FormSubmission;
}) {
  const StatusIcon =
    submission.webhookStatus === "sent"
      ? CheckCircle2
      : submission.webhookStatus === "failed"
      ? XCircle
      : MinusCircle;
  const statusColor =
    submission.webhookStatus === "sent"
      ? "text-emerald-300"
      : submission.webhookStatus === "failed"
      ? "text-rose-300"
      : "text-neutral-500";
  const statusLabel =
    submission.webhookStatus === "sent"
      ? "Enviado pro webhook"
      : submission.webhookStatus === "failed"
      ? `Webhook falhou: ${submission.webhookError || ""}`
      : "Sem webhook configurado";
  return (
    <div className="border border-[#1a1a1a] rounded-md px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {submission.name}
          </p>
          <p className="text-[11px] text-neutral-500 font-mono truncate mt-0.5">
            {submission.email} · {submission.whatsapp}
          </p>
        </div>
        <p className="text-[10px] text-neutral-500 shrink-0 whitespace-nowrap mt-0.5">
          {new Date(submission.submittedAt).toLocaleString("pt-BR")}
        </p>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <StatusIcon size={10} strokeWidth={2.4} className={statusColor} />
        <p className={`text-[10px] ${statusColor} font-medium`}>
          {statusLabel}
        </p>
      </div>
    </div>
  );
}
