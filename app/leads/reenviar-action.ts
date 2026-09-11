"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { listAllSubmissions, atualizarSubmissao } from "@/lib/forms-store";
import { chaveDoSlug } from "@/lib/crm-chave";
import { corpoParaOCrm } from "@/lib/crm-envio";
import { logActivity } from "@/lib/activity-log";

/**
 * Manda de novo pro CRM um lead que não chegou lá.
 *
 * ⚠️ Existe porque o CRM pode estar fora do ar, com a chave errada ou com o
 * domínio bloqueado — e nesses casos o lead ficava só no portal, sem nenhum
 * jeito de recuperar sem digitar tudo à mão no CRM. O lead já está guardado;
 * o que faltava era o botão.
 */
export async function reenviarProCrmAction(
  leadId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();

    const { submissions } = await listAllSubmissions();
    const lead = submissions.find((l) => l.id === leadId);
    if (!lead) return { ok: false, error: "Lead não encontrado" };

    // O slug da página é quem sabe qual chave usar.
    const slug = lead.paginaSlug || lead.formId.replace(/^wp:/, "");
    const chave = await chaveDoSlug(slug).catch(() => null);
    if (!chave) {
      return {
        ok: false,
        error:
          "Não há chave do CRM — nem nesta página, nem a padrão em Configurações.",
      };
    }

    const origem = `https://www.jayacademy.com.br/${slug}`;
    let status = 0;
    let motivo = "";
    try {
      const r = await fetch(
        `https://www.sistemajayo.com/api/integrations/site/lead/${chave}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://www.jayacademy.com.br",
            Referer: origem,
          },
          // ⚠️ O MESMO corpo da captura. Antes era um objeto montado à mão aqui,
          // só com contato — o reenvio chegava no CRM sem as respostas de
          // qualificação e sem a etiqueta do Transforma. As respostas estavam
          // guardadas em `lead.respostas` o tempo todo; era só usar.
          body: JSON.stringify(
            corpoParaOCrm({
              fields: lead.respostas ?? {},
              name: lead.name,
              email: lead.email,
              whatsapp: lead.whatsapp,
              slug,
            })
          ),
          // 20s, igual à captura: o CRM já foi medido acima de 8s, e é
          // justamente quando ele está lento que alguém aperta "Reenviar".
          signal: AbortSignal.timeout(20000),
        }
      );
      status = r.status;
      const texto = await r.text().catch(() => "");
      let ok = r.ok;
      try {
        ok = ok && JSON.parse(texto || "{}").ok !== false;
      } catch {}
      if (!ok) motivo = texto.slice(0, 200) || `O CRM respondeu ${status}`;
    } catch (e) {
      motivo = e instanceof Error ? e.message : "Erro de rede";
    }

    const deuCerto = !motivo;
    await atualizarSubmissao(lead.id, {
      crmStatus: deuCerto ? "ok" : "falhou",
      crmErro: deuCerto ? undefined : motivo,
    });
    await logActivity(
      "form.submission",
      lead.name || lead.whatsapp,
      deuCerto ? "reenviado pro CRM" : `reenvio falhou: ${motivo}`
    );
    revalidatePath("/leads");

    return deuCerto ? { ok: true } : { ok: false, error: motivo };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro" };
  }
}
