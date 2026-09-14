import { NextResponse } from "next/server";
import { logAnonymousActivity } from "@/lib/activity-log";
import { getPublishedBySlug, loadContent } from "@/lib/wp-content-storage";
import { addSubmission, type FormSubmission } from "@/lib/forms-store";
import { chaveDoSlug } from "@/lib/crm-chave";
import { corpoParaOCrm } from "@/lib/crm-envio";
import { destinoDaEscolha } from "@/lib/redirect-escolha";
import { normalizarTelefone, mensagemDeErro } from "@/lib/telefone";
import { chaveLog, logsDaPagina } from "@/lib/webhook-log";
import { kvSet } from "@/lib/storage";
import { rateLimit, tooManyRequests, payloadTooLarge } from "@/lib/rate-limit";
import { getLpFormConfig } from "@/lib/lp-form-config";

// Substituto local do admin-ajax.php do WordPress para os formulários Elementor Pro
// embutidos nas LPs estáticas (lp-html/). O ajaxurl dos HTMLs aponta pra cá; o JS do
// Elementor envia action=elementor_pro_forms_send_form com form_fields[...] e espera
// o envelope {success, data:{message}} de volta. Leads caem no mesmo store das
// páginas WP (form-submissions:wp:<slug>) e reaproveitam webhook/redirect da página
// gêmea no KV, se configurados no painel.

export const dynamic = "force-dynamic";
// O CRM cria contato, negócio e anotação antes de responder — já foi
// medido levando mais de 8s. A função precisa de folga pra esperar.
export const maxDuration = 30;

const REDIRECT_PADRAO_POR_LP: Record<string, string> = {
  transforma: "https://chat.whatsapp.com/I4fpwbQWJl84p9M2aL6mQz?mode=gi_t",
  // Checkout da oferta do JAY Beauty (link de pagamento Cielo). Fica aqui como
  // PADRÃO pra a página funcionar sem depender de configuração; o campo do
  // painel (/lps/<slug>) continua vencendo, então trocar de link a cada turma
  // não exige deploy.
  "jaytransforma-beauty": "https://cielolink.com.br/4xAzXCw",
};

/**
 * As LPs com funil próprio, onde o lead é a conversão que a campanha paga e um
 * envio que não chega ao CRM é prejuízo. Nelas valem três coisas que NÃO valem
 * nas outras páginas: validação estrita antes de mandar, telefone normalizado em
 * E.164 (com o "+") e recusa explícita quando o CRM diz não.
 *
 * Era um `slug === "transforma"` espalhado em dois pontos do arquivo. Virou mapa
 * quando chegou a segunda LP — que, diferente da primeira, não pede e-mail.
 */
const REGRAS_POR_LP: Record<string, { exigeEmail: boolean; mensagemOk: string }> = {
  transforma: {
    exigeEmail: true,
    mensagemOk: "Inscrição confirmada! Você será direcionada ao grupo do evento.",
  },
  "jaytransforma-beauty": {
    // O formulário pede só nome e telefone — quem chega aqui já deu o e-mail na
    // inscrição do evento, e cada campo a mais é gente que desiste na oferta.
    exigeEmail: false,
    mensagemOk: "Tudo certo! Você será direcionada para garantir sua vaga.",
  },
  "jaytransforma-remove": {
    // Mesma razão do Beauty: quem chega aqui já deu o e-mail na inscrição do
    // evento, e cada campo a mais é gente que desiste na hora da oferta.
    exigeEmail: false,
    mensagemOk: "Tudo certo! Você será direcionada para garantir sua vaga.",
  },
};

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

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
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
    //
    // ⚠️ Aceita TAMBÉM nome de campo simples (`nome`, `whatsapp`). Nem todo
    // formulário das páginas usa o prefixo do Elementor, e quando não usava, o
    // lead chegava aqui vazio e era recusado com "Preencha ao menos um campo" —
    // do lado de quem preencheu, só "não conseguimos enviar agora".
    const IGNORAR = new Set([
      "action",
      "post_id",
      "form_id",
      "referer",
      "referer_title",
      "queried_id",
      "form_slug",
      "_gotcha",
    ]);
    const fields: Record<string, string> = {};
    for (const [k, v] of form.entries()) {
      if (typeof v !== "string") continue;
      const m = k.match(/^form_fields\[(.+)\]$/);
      if (m) fields[m[1]] = v;
      else if (!IGNORAR.has(k) && v.trim()) fields[k] = v;
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

    // A mesma conferência existe no navegador; aqui ela impede dado inválido
    // enviado direto na API de chegar ao CRM. O telefone que segue daqui pra
    // frente é o normalizado (só dígitos, com DDI): sem máscara e sem dúvida
    // sobre o DDD, que é o formato que o CRM não recusa.
    let whatsappEnvio = whatsapp;
    // hasOwn: o slug vem da URL, não pode alcançar o Object.prototype.
    const regras = Object.hasOwn(REGRAS_POR_LP, slug) ? REGRAS_POR_LP[slug] : null;
    if (regras) {
      if (regras.exigeEmail && !emailValido(email)) {
        return NextResponse.json(
          { success: false, data: { message: "Digite um e-mail válido." } },
          { status: 400 }
        );
      }
      const tel = normalizarTelefone(whatsapp);
      if (!tel.ok) {
        return NextResponse.json(
          { success: false, data: { message: mensagemDeErro(tel.motivo) } },
          { status: 400 }
        );
      }
      // O "+" não é enfeite: é ele que faz o CRM respeitar o país. Sem o
      // sinal, um telefone de Portugal (351...) é guardado lá como
      // +55 51..., ou seja, vira um número brasileiro que não existe.
      whatsappEnvio = tel.e164;
    }

    // Webhook/redirect: config explícita por LP (lp-form-config) tem prioridade;
    // senão cai na página gêmea no KV (se publicada e configurada no painel).
    let webhookStatus: FormSubmission["webhookStatus"] = "skipped";
    let webhookError: string | undefined;
    let redirectUrl: string | null = null;
    const index = await getPublishedBySlug(slug).catch(() => null);
    const content = index ? await loadContent(index.domain, index.slug).catch(() => null) : null;
    const lpCfg = await getLpFormConfig(slug).catch(() => null);
    const webhookUrl = lpCfg?.formWebhookUrl || content?.formWebhookUrl;
    // O destino pode depender do que a pessoa escolheu, não só do slug: ver
    // lib/redirect-escolha.ts. Quando ela responde, a escolha passa na frente
    // do campo do painel (que é um só e não expressa dois checkouts); quando
    // não dá pra saber, cai na cascata de sempre e a página não fica sem rumo.
    redirectUrl =
      destinoDaEscolha(slug, fields) ||
      lpCfg?.formRedirectUrl ||
      content?.formRedirectUrl ||
      REDIRECT_PADRAO_POR_LP[slug] ||
      null;
    if (webhookUrl) {
      try {
        const r = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone: whatsappEnvio,
            whatsapp: whatsappEnvio,
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

    // Webhook do CRM (a chave colada no painel). Vai daqui, do SERVIDOR: do
    // navegador, a verificação prévia do POST com JSON barra o envio quando o
    // domínio não está liberado na chave, e o lead some sem erro nenhum.
    // Chave da página, ou a padrão do site (ver lib/crm-chave.ts).
    const chaveCrm = await chaveDoSlug(slug).catch(() => null);
    let crmStatus: FormSubmission["crmStatus"] = "sem-chave";
    // Recusa e silêncio são coisas diferentes — ver o desfecho lá embaixo.
    let crmRespondeu = false;
    let crmErro: string | undefined;
    if (chaveCrm) {
      let status = 0;
      let motivo = "";
      try {
        // ⚠️ Origin e Referer vão de propósito. O CRM tem "Domínios liberados"
        // por chave, e ele decide olhando de qual site veio o envio. Como quem
        // manda agora é o NOSSO servidor, sem esses cabeçalhos a requisição
        // chega sem site nenhum — e uma chave com a lista preenchida recusa.
        // Não é disfarce: o envio é da página mesmo, e é ela que anunciamos.
        const origem = new URL(
          referer || `https://www.jayacademy.com.br/${slug}`,
          "https://www.jayacademy.com.br"
        );
        const r = await fetch(
          `https://www.sistemajayo.com/api/integrations/site/lead/${chaveCrm}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: origem.origin,
              Referer: origem.href,
            },
            // O corpo é montado por uma função pura e testada (lib/crm-envio).
            // ⚠️ Foi aqui que a tag sumiu sem ninguém ver, em 13/08 — por isso
            // agora existe teste olhando o objeto que sai.
            body: JSON.stringify(
              corpoParaOCrm({ fields, name, email, whatsapp: whatsappEnvio, slug })
            ),
            signal: AbortSignal.timeout(20000),
          }
        );
        crmRespondeu = true;
        status = r.status;
        const texto = await r.text().catch(() => "");
        let ok = r.ok;
        try {
          ok = ok && JSON.parse(texto || "{}").ok !== false;
        } catch {}
        if (!ok) motivo = texto.slice(0, 300);
        crmStatus = ok ? "ok" : "falhou";
      } catch (e) {
        motivo = e instanceof Error ? e.message : "Erro de rede";
        crmStatus = "falhou";
      }
      if (crmStatus === "falhou") crmErro = motivo || undefined;
      // O resultado aparece na tela da página, em "Últimos envios".
      try {
        const anteriores = await logsDaPagina(slug);
        await kvSet(
          chaveLog(slug),
          [
            { em: new Date().toISOString(), status, erro: motivo || undefined },
            ...anteriores,
          ].slice(0, 10)
        );
      } catch {}
    }

    await addSubmission({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      formId: `wp:${slug}`,
      name: name || "(sem nome)",
      whatsapp: whatsappEnvio || "",
      email: email || "",
      submittedAt: new Date().toISOString(),
      webhookStatus,
      webhookError,
      crmStatus,
      crmErro,
      paginaSlug: slug,
      respostas: fields,
    });

    await logAnonymousActivity(
      "form.submission",
      name || email || whatsapp || "anônimo",
      slug,
      `popup Elementor na LP${webhookStatus === "sent" ? " — webhook ok" : ""}`
    );

    // Nas LPs de REGRAS_POR_LP o próximo passo mora fora da página (o grupo do
    // evento, o checkout da oferta). Não confirmamos nem redirecionamos quando o
    // CRM RECUSA o lead: assim o comercial não perde uma inscrição silenciosamente. O contato já ficou salvo no painel com o
    // motivo para recuperação/reenvio.
    //
    // ⚠️ Estourar o tempo é diferente de recusar. Aconteceu de verdade: o CRM
    // cadastrou o contato e o negócio, demorou mais que o limite pra dizer
    // isso, e a pessoa levou "não conseguimos confirmar" e nunca entrou no
    // grupo — inscrita no CRM e perdida na jornada. Sem resposta, a gente
    // segue com ela e registra o ocorrido em "Últimos envios".
    if (regras && crmStatus !== "ok" && crmRespondeu) {
      return NextResponse.json(
        {
          success: false,
          data: {
            message:
              "Não conseguimos confirmar sua inscrição agora. Tente novamente em instantes.",
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: redirectUrl
          ? regras?.mensagemOk ||
            "Inscrição confirmada! Você será direcionada ao grupo do evento."
          : "Recebido com sucesso!",
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
