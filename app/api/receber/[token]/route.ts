import { NextResponse } from "next/server";
import { addSubmission } from "@/lib/forms-store";
import { logAnonymousActivity } from "@/lib/activity-log";
import { rateLimit, tooManyRequests, payloadTooLarge } from "@/lib/rate-limit";
import { acharWebhook, registrarRecebimento } from "@/lib/webhooks-entrada";
import { achatar, acharCampo } from "@/lib/campos-recebidos";
import { leadDeFormulario } from "@/lib/lead-de-formulario";
import { entregarLead } from "@/lib/lead-destinos";

/**
 * O NOSSO webhook. É este endereço que a gente cola nas páginas.
 *
 * `POST /api/receber/<token>` — o token é o que a tela de integrações gera.
 * O lead cai direto no portal, sem passar por Clint nem por ninguém.
 *
 * Aceita JSON, formulário comum e o formato do Elementor, porque o link vai
 * ser colado em lugares que a gente não controla. Exigir um formato só faria
 * o link funcionar apenas onde a gente mesmo montou o formulário — e aí não
 * serviria de webhook.
 *
 * Responde com CORS liberado: o formulário que posta pode estar em outro
 * domínio, e sem isso o navegador bloqueia antes mesmo de sair.
 */

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

async function lerCorpo(req: Request): Promise<Record<string, string>> {
  const tipo = req.headers.get("content-type") ?? "";
  if (tipo.includes("application/json")) {
    return achatar(await req.json().catch(() => ({})));
  }
  // multipart e urlencoded — formulário de página, Elementor, etc.
  const fd = await req.formData().catch(() => null);
  if (!fd) return {};
  const cru: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") cru[k] = v;
  return achatar(cru);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (payloadTooLarge(req, 64 * 1024)) {
    return NextResponse.json({ ok: false, erro: "Envio muito grande." }, { status: 413, headers: CORS });
  }
  if (!(await rateLimit("webhook-entrada", req, 30, 60)).ok) {
    const r = tooManyRequests() as NextResponse;
    Object.entries(CORS).forEach(([k, v]) => r.headers.set(k, v));
    return r;
  }

  const webhook = await acharWebhook(token);
  // Mesma resposta pra token errado e token desligado: quem está sondando não
  // descobre se o endereço existe.
  if (!webhook || !webhook.ativo) {
    return NextResponse.json({ ok: false, erro: "Webhook não encontrado" }, { status: 404, headers: CORS });
  }

  try {
    const campos = await lerCorpo(req);
    const nome = acharCampo(campos, "nome");
    const email = acharCampo(campos, "email");
    const telefone = acharCampo(campos, "telefone");

    if (!nome && !email && !telefone) {
      return NextResponse.json(
        { ok: false, erro: "Não achei nome, e-mail nem telefone no que foi enviado" },
        { status: 400, headers: CORS }
      );
    }

    const leadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const lead = leadDeFormulario({
      id: leadId,
      nome,
      email,
      telefone,
      origem: webhook.nome,
      url: campos.url || req.headers.get("referer") || undefined,
      extras: campos,
      tags: webhook.tags,
    });

    // Guarda ANTES de repassar: se o CRM estiver fora do ar, o lead já é nosso.
    await addSubmission({
      id: leadId,
      formId: `wh:${webhook.id}`,
      name: nome || "(sem nome)",
      whatsapp: telefone,
      email,
      submittedAt: lead.enviado_em,
      lead,
    });
    await registrarRecebimento(webhook.id);

    // Repassa pros destinos de saída (o CRM), se houver algum cadastrado.
    const entregas = await entregarLead(lead, webhook.nome);
    if (entregas.length) {
      await addSubmission({
        id: leadId,
        formId: `wh:${webhook.id}`,
        name: nome || "(sem nome)",
        whatsapp: telefone,
        email,
        submittedAt: lead.enviado_em,
        lead,
        entregas,
      });
    }

    await logAnonymousActivity(
      "form.submission",
      nome || email || telefone || "anônimo",
      webhook.nome,
      "pelo nosso webhook"
    );

    return NextResponse.json({ ok: true, id: leadId }, { headers: CORS });
  } catch (e) {
    // Lead que falha em gravar TEM que aparecer no log da Vercel.
    console.error("[receber] falha ao processar lead:", e);
    return NextResponse.json(
      { ok: false, erro: e instanceof Error ? e.message : "Erro interno" },
      { status: 500, headers: CORS }
    );
  }
}
