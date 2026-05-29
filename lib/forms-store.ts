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

export async function listForms(): Promise<FormConfig[]> {
  const forms = (await kvGet<FormConfig[]>(FORMS_KEY)) || [];
  return forms;
}

export async function getForm(id: string): Promise<FormConfig | null> {
  const forms = await listForms();
  return forms.find((f) => f.id === id) || null;
}

export async function getFormBySlug(slug: string): Promise<FormConfig | null> {
  const forms = await listForms();
  return forms.find((f) => f.slug === slug) || null;
}

export async function saveForm(form: FormConfig): Promise<void> {
  const forms = await listForms();
  const idx = forms.findIndex((f) => f.id === form.id);
  if (idx === -1) forms.push(form);
  else forms[idx] = form;
  await kvSet(FORMS_KEY, forms);
}

export async function deleteForm(id: string): Promise<void> {
  const forms = await listForms();
  await kvSet(FORMS_KEY, forms.filter((f) => f.id !== id));
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
