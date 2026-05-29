import { NextResponse } from "next/server";
import { logAnonymousActivity } from "@/lib/activity-log";
import { getPublishedBySlug, loadContent } from "@/lib/wp-content-storage";
import {
  addSubmission,
  type FormSubmission,
} from "@/lib/forms-store";

type Incoming = {
  publicSlug: string;
  /** Coletado pelo script — qualquer par chave/valor dos inputs. */
  fields: Record<string, string>;
};

function pick(fields: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const exact = fields[k];
    if (exact && exact.trim()) return exact.trim();
  }
  // Procura também por chaves que CONTÉM o nome (Elementor usa "form_fields[name]" etc.)
  const lower = Object.entries(fields).map(([k, v]) => [k.toLowerCase(), v] as const);
  for (const k of keys) {
    const match = lower.find(([lk]) => lk.includes(k));
    if (match && match[1] && match[1].trim()) return match[1].trim();
  }
  return "";
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<Incoming>;
    const publicSlug = body.publicSlug?.toString() || "";
    const fields = (body.fields || {}) as Record<string, string>;

    if (!publicSlug) {
      return NextResponse.json({ error: "publicSlug ausente" }, { status: 400 });
    }

    const index = await getPublishedBySlug(publicSlug);
    if (!index) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    }
    const content = await loadContent(index.domain, index.slug);
    if (!content) {
      return NextResponse.json({ error: "Página não encontrada" }, { status: 404 });
    }

    // Extrai dados comuns pra normalizar — funciona com Elementor, CF7, Gravity, etc.
    const name = pick(fields, [
      "name",
      "nome",
      "your-name",
      "fullname",
      "full_name",
    ]);
    const email = pick(fields, ["email", "e-mail", "your-email", "mail"]);
    const whatsapp = pick(fields, [
      "whatsapp",
      "phone",
      "telefone",
      "tel",
      "fone",
      "celular",
      "your-tel",
    ]);

    if (!name && !email && !whatsapp) {
      return NextResponse.json(
        { error: "Nenhum campo identificável (nome/email/whatsapp) foi encontrado" },
        { status: 400 }
      );
    }
    if (email && !isEmail(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    let webhookStatus: FormSubmission["webhookStatus"] = "skipped";
    let webhookError: string | undefined;

    if (content.formWebhookUrl) {
      try {
        const payload = {
          name,
          email,
          phone: whatsapp,
          whatsapp,
          submitted_at: new Date().toISOString(),
          form_name: content.title,
          form_slug: content.publicSlug || content.slug,
          source: "jayacademy.portal.wp",
          // raw também — pra integrações que querem todos os campos originais
          raw: fields,
        };
        const r = await fetch(content.formWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) {
          webhookStatus = "failed";
          const body = await r.text().catch(() => "");
          webhookError = `${r.status} ${body.slice(0, 200)}`;
        } else {
          webhookStatus = "sent";
        }
      } catch (e) {
        webhookStatus = "failed";
        webhookError = e instanceof Error ? e.message : "Erro de rede";
      }
    }

    // Usa o próprio publicSlug como "formId virtual" pra agrupar submissões
    // de páginas WP — fica em form-submissions:wp:<slug>
    const virtualFormId = `wp:${publicSlug}`;
    await addSubmission({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      formId: virtualFormId,
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
      content.title || publicSlug,
      webhookStatus === "sent"
        ? "via página WP — webhook ok"
        : webhookStatus === "failed"
        ? `via página WP — webhook falhou: ${webhookError || ""}`
        : "via página WP — sem webhook"
    );

    return NextResponse.json({
      ok: true,
      redirectUrl: content.formRedirectUrl || null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro interno" },
      { status: 500 }
    );
  }
}
