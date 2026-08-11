import { NextResponse } from "next/server";
import { addSubmission } from "@/lib/forms-store";
import { logAnonymousActivity } from "@/lib/activity-log";
import { rateLimit, tooManyRequests, payloadTooLarge } from "@/lib/rate-limit";
import { acharIntegracao, registrarEntrada, getCrm } from "@/lib/integracoes";
import {
  aplicarMapeamento,
  corpoParaOCrm,
  urlDoCrm,
  temTelefone,
  explicarResposta,
} from "@/lib/integracoes-core";
import { achatar, acharCampo } from "@/lib/campos-recebidos";
import { leadDeFormulario } from "@/lib/lead-de-formulario";

/**
 * O link da integração. É este endereço que a gente cola no formulário.
 *
 * `POST /api/receber/<token>` — o token nasce junto com a integração, na tela
 * de Integrações de lead. O caminho inteiro é: o formulário posta aqui, o lead
 * é guardado no portal, e daqui segue pro CRM já com o mapeamento, as tags, a
 * etapa e o status daquela integração.
 *
 * Aceita JSON, formulário comum e o formato do Elementor, porque o link vai ser
 * colado em lugares diferentes. Exigir um formato só faria ele funcionar apenas
 * onde a gente mesmo montou o formulário — e aí não serve de webhook.
 *
 * CORS liberado: o formulário que posta pode estar em outro domínio, e sem isso
 * o navegador bloqueia antes de sair.
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

  const integracao = await acharIntegracao(token);
  // Mesma resposta pra link errado e link desligado: quem sonda não descobre
  // se o endereço existe.
  if (!integracao || !integracao.ativo) {
    return NextResponse.json({ ok: false, erro: "Integração não encontrada" }, { status: 404, headers: CORS });
  }

  try {
    const recebido = await lerCorpo(req);
    const campos = aplicarMapeamento(recebido, integracao.mapeamento);

    // Identificação: procura no que JÁ foi mapeado; se a pessoa não mapeou
    // nada, cai no reconhecimento automático pelo nome/formato do campo.
    const nome = campos.nome || acharCampo(recebido, "nome");
    const email = campos.email || acharCampo(recebido, "email");
    const telefone = campos.telefone || acharCampo(recebido, "telefone");

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
      origem: integracao.nome,
      url: campos.url || recebido.url || req.headers.get("referer") || undefined,
      extras: campos,
      tags: integracao.tags,
    });

    // Guarda ANTES de repassar: se o CRM estiver fora do ar, o lead já é nosso.
    await addSubmission({
      id: leadId,
      formId: `wh:${integracao.id}`,
      name: nome || "(sem nome)",
      whatsapp: telefone,
      email,
      submittedAt: lead.enviado_em,
      lead,
    });

    const repasse = await mandarProCrm(integracao, lead, campos);
    await registrarEntrada(integracao.id, repasse ? repasse.ok : null);

    if (repasse) {
      await addSubmission({
        id: leadId,
        formId: `wh:${integracao.id}`,
        name: nome || "(sem nome)",
        whatsapp: telefone,
        email,
        submittedAt: lead.enviado_em,
        lead,
        entregas: [
          {
            destinoId: "crm",
            destinoNome: "JAY.O CRM",
            status: repasse.ok ? "ok" : "falhou",
            erro: repasse.motivo,
            em: new Date().toISOString(),
            tentativas: 1,
          },
        ],
      });
    }

    await logAnonymousActivity(
      "form.submission",
      nome || email || telefone || "anônimo",
      integracao.nome,
      !repasse
        ? "guardado no portal (sem chave do CRM)"
        : repasse.ok
        ? "enviado pro CRM"
        : `CRM recusou: ${repasse.motivo ?? "erro"}`
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

/**
 * Repassa pro CRM do Lucas. `null` = ainda não tem chave configurada.
 *
 * Não gasta a requisição quando o telefone não presta: sem telefone com DDD o
 * CRM devolve 422 e não cria nada — e a gente ainda queimaria uma das 20
 * chamadas por hora que ele permite por IP.
 */
async function mandarProCrm(
  integracao: NonNullable<Awaited<ReturnType<typeof acharIntegracao>>>,
  lead: Parameters<typeof corpoParaOCrm>[1],
  campos: Record<string, string>
): Promise<{ ok: boolean; motivo?: string } | null> {
  const crm = await getCrm();
  const url = crm?.chave ? urlDoCrm(crm.chave) : null;
  if (!url) return null;

  const corpo = corpoParaOCrm(integracao, lead, campos);
  if (!temTelefone(corpo)) {
    return { ok: false, motivo: "Sem telefone com DDD — o CRM recusaria (422)." };
  }
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) return { ok: true };
    const texto = await r.text().catch(() => "");
    return { ok: false, motivo: explicarResposta(r.status, texto) };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : "Erro de rede" };
  }
}
