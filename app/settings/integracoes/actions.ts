"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  novoToken,
  mapeamentoInicial,
  listarIntegracoes,
  acharIntegracao,
  salvarIntegracao,
  excluirIntegracao,
  getCrm,
  setCrm,
  type Integracao,
  type ParDeCampo,
} from "@/lib/integracoes";
import { corpoParaOCrm } from "@/lib/integracoes-core";

/** Lê as linhas do mapeamento (pares campo-do-formulário → campo-do-CRM). */
function lerMapeamento(fd: FormData): ParDeCampo[] {
  const de = fd.getAll("mapDe").map((v) => v.toString().trim());
  const para = fd.getAll("mapPara").map((v) => v.toString().trim());
  return de
    .map((d, i) => ({ doFormulario: d, paraOCrm: para[i] ?? "" }))
    .filter((p) => p.doFormulario && p.paraOCrm);
}

function lerTags(fd: FormData): string[] {
  return (fd.get("tags")?.toString() ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Cria ou salva a integração. O link nasce junto com ela — igual ao Clint, onde
 * dar o nome já devolve o "Link de integração".
 */
export async function salvarIntegracaoAction(
  fd: FormData
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    await requireAdmin();
    const nome = (fd.get("nome")?.toString() ?? "").trim();
    if (!nome) return { ok: false, error: "Dê um nome pra integração" };

    const id = fd.get("id")?.toString() || novoToken();
    const anterior = await acharIntegracao(id);
    const mapeamento = lerMapeamento(fd);

    const integracao: Integracao = {
      id,
      nome,
      tipo: fd.get("tipo")?.toString() === "contato" ? "contato" : "negocio",
      acao:
        fd.get("acao")?.toString() === "criar"
          ? "criar"
          : fd.get("acao")?.toString() === "atualizar"
          ? "atualizar"
          : "criar_ou_atualizar",
      mapeamento: mapeamento.length ? mapeamento : mapeamentoInicial(),
      tags: lerTags(fd),
      etapaCriacao: (fd.get("etapaCriacao")?.toString() ?? "").trim() || undefined,
      etapaAtualizacao: (fd.get("etapaAtualizacao")?.toString() ?? "").trim() || undefined,
      status: (fd.get("status")?.toString() ?? "").trim() || undefined,
      ativo: anterior ? anterior.ativo : true,
      criadoEm: anterior?.criadoEm ?? new Date().toISOString(),
      recebidos: anterior?.recebidos,
      ultimoEm: anterior?.ultimoEm,
      // salvar reabilita: se foi desligada por 3 falhas, mexer nela é a chance
      // de ter consertado o que estava errado
      falhasSeguidas: 0,
    };

    await salvarIntegracao({ ...integracao, ativo: true });
    await logActivity("wp.edit", nome, anterior ? "integração salva" : "integração criada");
    revalidatePath("/settings/integracoes");
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function alternarIntegracaoAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = fd.get("id")?.toString() ?? "";
  const i = await acharIntegracao(id);
  if (i) await salvarIntegracao({ ...i, ativo: !i.ativo, falhasSeguidas: 0 });
  revalidatePath("/settings/integracoes");
}

export async function excluirIntegracaoAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = fd.get("id")?.toString() ?? "";
  if (id) {
    await excluirIntegracao(id);
    await logActivity("wp.edit", id, "integração excluída");
  }
  revalidatePath("/settings/integracoes");
}

/** Onde fica o CRM — um só pra casa inteira. */
export async function salvarCrmAction(
  fd: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const url = (fd.get("crmUrl")?.toString() ?? "").trim();
    if (!url) {
      await setCrm(null);
      revalidatePath("/settings/integracoes");
      return { ok: true };
    }
    try {
      const p = new URL(url);
      if (p.protocol !== "https:" && p.protocol !== "http:") throw new Error();
    } catch {
      return { ok: false, error: "Endereço inválido — tem que começar com https://" };
    }
    await setCrm({
      url,
      header: (fd.get("crmHeader")?.toString() ?? "").trim() || undefined,
      token: (fd.get("crmToken")?.toString() ?? "").trim() || undefined,
    });
    await logActivity("wp.edit", "CRM", "endereço do CRM salvo");
    revalidatePath("/settings/integracoes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

/**
 * Manda um lead de mentira pelo caminho inteiro e devolve a resposta crua.
 * É o que evita usar lead de verdade como cobaia quando o CRM chegar.
 */
export async function testarIntegracaoAction(id: string): Promise<{
  ok: boolean;
  http?: number;
  erro?: string;
  enviado?: string;
  semCrm?: boolean;
}> {
  await requireAdmin();
  const integracao = (await listarIntegracoes()).find((i) => i.id === id);
  if (!integracao) return { ok: false, erro: "Integração não encontrada" };

  const campos = { nome: "Teste Jay Academy", email: "teste@jayacademy.com.br", telefone: "11999999999" };
  const corpo = corpoParaOCrm(
    integracao,
    {
      id: `teste-${Date.now()}`,
      nome: campos.nome,
      email: campos.email,
      telefone: campos.telefone,
      enviado_em: new Date().toISOString(),
      tags: [],
      campos: {},
    },
    campos
  );

  const crm = await getCrm();
  if (!crm?.url) {
    return { ok: true, semCrm: true, enviado: JSON.stringify(corpo, null, 2) };
  }
  try {
    const cabecalhos: Record<string, string> = { "Content-Type": "application/json" };
    if (crm.header && crm.token) cabecalhos[crm.header] = crm.token;
    const r = await fetch(crm.url, {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(8000),
    });
    const texto = await r.text().catch(() => "");
    return {
      ok: r.ok,
      http: r.status,
      erro: r.ok ? undefined : texto.slice(0, 300),
      enviado: JSON.stringify(corpo, null, 2),
    };
  } catch (e) {
    return {
      ok: false,
      erro: e instanceof Error ? e.message : "Erro de rede",
      enviado: JSON.stringify(corpo, null, 2),
    };
  }
}
