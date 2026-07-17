import { NextResponse } from "next/server";
import { logAnonymousActivity } from "@/lib/activity-log";
import { getPublishedBySlug, loadContent } from "@/lib/wp-content-storage";
import { addSubmission, type FormSubmission } from "@/lib/forms-store";
import { rateLimit, tooManyRequests, payloadTooLarge } from "@/lib/rate-limit";
import { getLpFormConfig } from "@/lib/lp-form-config";

// Substituto local do admin-ajax.php do WordPress para os formulários Elementor Pro
// embutidos nas LPs estáticas (lp-html/). O ajaxurl dos HTMLs aponta pra cá; o JS do
// Elementor envia action=elementor_pro_forms_send_form com form_fields[...] e espera
// o envelope {success, data:{message}} de volta. Leads caem no mesmo store das
// páginas WP (form-submissions:wp:<slug>) e reaproveitam webhook/redirect da página
// gêmea no KV, se configurados no painel.

export const dynamic = "force-dynamic";

function pick(fields: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const exact = fields[k];
    if (exact && exact.trim()) return exact.trim();
  }
  const lower = Object.entries(fields).map(([k, v]) => [k.toLowerCase(), v] as const);
  for (const k of keys) {
    const match = lower.find(([lk]) => lk.includes(k));
    if (match && match[1] && match[1].trim()) return match[1].trim();
  }
  return "";
}

export async function POST(req: Request) {
  // Anti-abuso: cap de tamanho + rate-limit por IP (leads legítimos são poucos).
  if (payloadTooLarge(req, 64 * 1024)) {
    return NextResponse.json(
      { success: false, data: { message: "Envio muito grande." } },
      { status: 413 }
    );
  }
  if (!(await rateLimit("elementor-form", req, 15, 60)).ok) {
    return tooManyRequests() as NextResponse;
  }
  try {
    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json(
        { success: false, data: { message: "Corpo inválido" } },
        { status: 400 }
      );
    }

    const action = form.get("action")?.toString() || "";
    if (action !== "elementor_pro_forms_send_form") {
      // Outros plugins do WP (Pixel Cat etc.) também usavam o ajaxurl — no-op silencioso.
      return NextResponse.json({ success: false, data: { message: "Ação não suportada" } });
    }

    // form_fields[chave] → { chave: valor }
    const fields: Record<string, string> = {};
    for (const [k, v] of form.entries()) {
      const m = k.match(/^form_fields\[(.+)\]$/);
      if (m && typeof v === "string") fields[m[1]] = v;
    }

    const name = pick(fields, ["name", "nome", "fullname", "full_name"]);
    const email = pick(fields, ["email", "e-mail", "mail"]);
    const whatsapp = pick(fields, ["whatsapp", "phone", "telefone", "tel", "fone", "celular"]);

    if (!name && !email && !whatsapp) {
      return NextResponse.json(
        { success: false, data: { message: "Preencha ao menos um campo." } },
        { status: 400 }
      );
    }

    // Slug da LP de origem: path do referer (ex.: /basic-nanofios)
    const referer = form.get("referer")?.toString() || req.headers.get("referer") || "";
    let slug = "lp";
    try {
      const p = new URL(referer, "https://jayacademy.com.br").pathname;
      slug = p.replace(/^\/+|\/+$/g, "").split("/")[0] || "lp";
    } catch {}

    // Webhook/redirect: config explícita por LP (lp-form-config) tem prioridade;
    // senão cai na página gêmea no KV (se publicada e configurada no painel).
    let webhookStatus: FormSubmission["webhookStatus"] = "skipped";
    let webhookError: string | undefined;
    let redirectUrl: string | null = null;
    const index = await getPublishedBySlug(slug).catch(() => null);
    const content = index ? await loadContent(index.domain, index.slug).catch(() => null) : null;
    const lpCfg = await getLpFormConfig(slug).catch(() => null);
    const webhookUrl = lpCfg?.formWebhookUrl || content?.formWebhookUrl;
    redirectUrl = lpCfg?.formRedirectUrl || content?.formRedirectUrl || null;
    if (webhookUrl) {
      try {
        const r = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone: whatsapp,
            whatsapp,
            submitted_at: new Date().toISOString(),
            form_name: form.get("form_id")?.toString() || content?.title || slug,
            form_slug: slug,
            source: "jayacademy.portal.lp-elementor",
            raw: fields,
          }),
          signal: AbortSignal.timeout(8000),
        });
        webhookStatus = r.ok ? "sent" : "failed";
        if (!r.ok) webhookError = `${r.status}`;
      } catch (e) {
        webhookStatus = "failed";
        webhookError = e instanceof Error ? e.message : "Erro de rede";
      }
    }

    await addSubmission({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      formId: `wp:${slug}`,
      name: name || "(sem nome)",
      whatsapp: whatsapp || "",
      email: email || "",
      submittedAt: new Date().toISOString(),
      webhookStatus,
      webhookError,
    });

    await logAnonymousActivity(
      "form.submission",
      name || email || whatsapp || "anônimo",
      slug,
      `popup Elementor na LP${webhookStatus === "sent" ? " — webhook ok" : ""}`
    );

    return NextResponse.json({
      success: true,
      data: {
        message: "Recebido com sucesso! Em breve entraremos em contato.",
        ...(redirectUrl ? { redirect_url: redirectUrl } : {}),
      },
    });
  } catch (e) {
    // NÃO engolir silenciosamente: um lead que falha em gravar tem que aparecer
    // nos logs da Vercel (antes sumia sem rastro).
    console.error("[elementor-form] falha ao processar lead:", e);
    return NextResponse.json(
      { success: false, data: { message: e instanceof Error ? e.message : "Erro interno" } },
      { status: 500 }
    );
  }
}
