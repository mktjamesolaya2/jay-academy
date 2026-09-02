import "server-only";
import { kvDel, kvGet, kvKeys, kvSet } from "./storage";

export type FormConfig = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  buttonLabel: string;
  webhookUrl?: string;
  redirectUrl?: string;
  createdAt: string;
  createdBy: string;
  trashed?: boolean;
  trashedAt?: string;
};

export type FormSubmission = {
  id: string;
  formId: string;
  name: string;
  whatsapp: string;
  email: string;
  submittedAt: string;
  webhookStatus?: "sent" | "failed" | "skipped";
  webhookError?: string;
  /**
   * O lead chegou no CRM?
   *
   * ⚠️ Separado do `webhookStatus`, que é do webhook por URL. São dois destinos
   * diferentes e um pode falhar sem o outro. Sem este campo, o portal mostrava
   * o lead como recebido mesmo quando o CRM tinha recusado — foi o que
   * aconteceu com o James: *"o lead foi criado aqui dentro do portal, apenas
   * não dentro do CRM"*, e não havia como ver isso na lista.
   */
  crmStatus?: "ok" | "falhou" | "sem-chave";
  crmErro?: string;
  /** Página de origem — é ela que sabe qual chave usar num reenvio. */
  paginaSlug?: string;
  /** Respostas de qualificação, preservadas para o comercial e para o CSV. */
  respostas?: Record<string, string>;
};

const FORMS_KEY = "forms:all";

async function readAllForms(): Promise<FormConfig[]> {
  return (await kvGet<FormConfig[]>(FORMS_KEY)) || [];
}

export async function listForms(): Promise<FormConfig[]> {
  const all = await readAllForms();
  return all.filter((f) => !f.trashed);
}

export async function listTrashedForms(): Promise<FormConfig[]> {
  const all = await readAllForms();
  return all
    .filter((f) => f.trashed)
    .sort((a, b) => (b.trashedAt ?? "").localeCompare(a.trashedAt ?? ""));
}

export async function getForm(id: string): Promise<FormConfig | null> {
  const all = await readAllForms();
  return all.find((f) => f.id === id) || null;
}

export async function getFormBySlug(slug: string): Promise<FormConfig | null> {
  // Pra resolver public URL /f/[slug] não retorna trashed
  const all = await readAllForms();
  return all.find((f) => f.slug === slug && !f.trashed) || null;
}

export async function trashForm(id: string): Promise<void> {
  const all = await readAllForms();
  const idx = all.findIndex((f) => f.id === id);
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    trashed: true,
    trashedAt: new Date().toISOString(),
  };
  await kvSet(FORMS_KEY, all);
}

export async function restoreForm(id: string): Promise<void> {
  const all = await readAllForms();
  const idx = all.findIndex((f) => f.id === id);
  if (idx === -1) return;
  const next = { ...all[idx] };
  delete next.trashed;
  delete next.trashedAt;
  all[idx] = next;
  await kvSet(FORMS_KEY, all);
}

export async function saveForm(form: FormConfig): Promise<void> {
  // readAllForms (não listForms) — senão regravar a lista filtrada apagaria
  // permanentemente todos os formulários que estavam na lixeira.
  const forms = await readAllForms();
  const idx = forms.findIndex((f) => f.id === form.id);
  if (idx === -1) forms.push(form);
  else forms[idx] = form;
  await kvSet(FORMS_KEY, forms);
}

export async function deleteForm(id: string): Promise<void> {
  const forms = await readAllForms();
  await kvSet(
    FORMS_KEY,
    forms.filter((f) => f.id !== id)
  );
  // Limpa submissões também
  await kvDel(submissionsKey(id));
}

function submissionsKey(formId: string): string {
  return `form-submissions:${formId}`;
}

export async function listSubmissions(
  formId: string,
  limit = 50
): Promise<FormSubmission[]> {
  const entries = (await kvGet<FormSubmission[]>(submissionsKey(formId))) || [];
  return entries.slice(0, limit);
}

export async function countSubmissions(formId: string): Promise<number> {
  const entries = (await kvGet<FormSubmission[]>(submissionsKey(formId))) || [];
  return entries.length;
}

export async function addSubmission(
  submission: FormSubmission
): Promise<void> {
  const existing =
    (await kvGet<FormSubmission[]>(submissionsKey(submission.formId))) || [];
  const next = [submission, ...existing].slice(0, 500); // mantém últimas 500
  await kvSet(submissionsKey(submission.formId), next);
}

/**
 * Todas as submissões de todos os formulários (nativos e dos forms das LPs,
 * chaves `form-submissions:*` — inclui `form-submissions:wp:<slug>` do
 * /api/elementor-form), ordenadas da mais nova pra mais antiga.
 * Usado no dashboard (total de leads + lista de recentes).
 */
export async function listAllSubmissions(): Promise<{
  total: number;
  submissions: FormSubmission[];
}> {
  const keys = await kvKeys("form-submissions:*");
  const lists = await Promise.all(
    keys.map((k) => kvGet<FormSubmission[]>(k))
  );
  const submissions = lists
    .filter((l): l is FormSubmission[] => Array.isArray(l))
    .flat()
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
  return { total: submissions.length, submissions };
}

/**
 * Atualiza campos de um lead já gravado (usado pelo reenvio pro CRM).
 *
 * Procura em todas as listas porque o id não carrega o formId — e reescrever a
 * lista inteira é aceitável: cada uma tem no máximo 500 entradas.
 */
export async function atualizarSubmissao(
  id: string,
  campos: Partial<FormSubmission>
): Promise<boolean> {
  const keys = await kvKeys("form-submissions:*");
  for (const k of keys) {
    const lista = await kvGet<FormSubmission[]>(k);
    if (!Array.isArray(lista)) continue;
    const i = lista.findIndex((s) => s.id === id);
    if (i === -1) continue;
    lista[i] = { ...lista[i], ...campos };
    await kvSet(k, lista);
    return true;
  }
  return false;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function newFormId(): string {
  return "form-" + Math.random().toString(36).slice(2, 10);
}
