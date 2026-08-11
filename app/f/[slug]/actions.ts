"use server";

import { redirect } from "next/navigation";
import {
  addSubmission,
  getFormBySlug,
  type FormSubmission,
} from "@/lib/forms-store";
import { entregarLead } from "@/lib/lead-destinos";
import { leadDeFormulario } from "@/lib/lead-de-formulario";
import { logAnonymousActivity } from "@/lib/activity-log";
import { rateLimitByIp, clientIpFromHeaders } from "@/lib/rate-limit";

function sanitize(s: string): string {
  return s.trim().slice(0, 500);
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function fireWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const r = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // 8s de timeout não trava demais o user se o serviço estiver lento
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { ok: false, error: `${r.status} ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro de rede",
    };
  }
}

export async function submitFormAction(
  prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const slug = formData.get("__slug")?.toString() ?? "";
  const name = sanitize(formData.get("name")?.toString() ?? "");
  const whatsapp = sanitize(formData.get("whatsapp")?.toString() ?? "");
  const email = sanitize(formData.get("email")?.toString() ?? "");
  // Honeypot anti-bot: se preenchido, finge sucesso silencioso
  const honey = (formData.get("website")?.toString() ?? "").trim();

  if (honey) return { success: true };

  // Teto por IP, igual ao /api/wp-form-submit — o honeypot sozinho não segura
  // flood no inbox de leads.
  const ip = await clientIpFromHeaders();
  if (!(await rateLimitByIp("form-submit", ip, 15, 60)).ok) {
    return { error: "Muitos envios seguidos. Espere um minuto e tente de novo." };
  }

  if (!slug) return { error: "Formulário inválido" };
  if (!name) return { error: "Preencha seu nome" };
  if (!whatsapp) return { error: "Preencha seu WhatsApp" };
  if (!email) return { error: "Preencha seu e-mail" };
  if (!isEmail(email)) return { error: "E-mail inválido" };

  const form = await getFormBySlug(slug);
  if (!form) return { error: "Formulário não encontrado" };

  let webhookStatus: FormSubmission["webhookStatus"] = "skipped";
  let webhookError: string | undefined;

  if (form.webhookUrl) {
    // Payload padrão que funciona com Clint, Zapier, Make, RD Station, etc.
    const payload = {
      name,
      email,
      phone: whatsapp,
      whatsapp,
      submitted_at: new Date().toISOString(),
      form_name: form.name,
      form_slug: form.slug,
      source: "jayacademy.portal",
    };
    const res = await fireWebhook(form.webhookUrl, payload);
    if (res.ok) {
      webhookStatus = "sent";
    } else {
      webhookStatus = "failed";
      webhookError = res.error;
    }
  }

  // Destinos cadastrados (o CRM novo) — somam ao webhook antigo do formulário,
  // não substituem: o Clint continua recebendo pelo caminho de sempre enquanto
  // a transição não termina. Nunca lança, então lead nenhum se perde por causa
  // de CRM fora do ar.
  const leadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const lead = leadDeFormulario({
    id: leadId,
    nome: name,
    email,
    telefone: whatsapp,
    origem: form.slug,
    extras: Object.fromEntries(formData.entries()),
  });
  const entregas = await entregarLead(lead, form.slug);

  await addSubmission({
    id: leadId,
    formId: form.id,
    name,
    whatsapp,
    email,
    submittedAt: lead.enviado_em,
    webhookStatus,
    webhookError,
    entregas,
    lead,
  });

  await logAnonymousActivity(
    "form.submission",
    name,
    form.name,
    webhookStatus === "sent"
      ? "webhook ok"
      : webhookStatus === "failed"
      ? `webhook falhou: ${webhookError || "erro"}`
      : undefined
  );

  if (form.redirectUrl) {
    redirect(form.redirectUrl);
  }

  return { success: true };
}
