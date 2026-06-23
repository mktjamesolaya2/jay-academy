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
