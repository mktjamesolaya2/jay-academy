"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  listarDestinos,
  salvarDestino,
  excluirDestino,
  testarDestino,
  type Destino,
} from "@/lib/lead-destinos";
import { mapeamentoSugerido } from "@/lib/lead-campos";
import { urlSegura } from "@/lib/lead-destinos-core";

function novoId(): string {
  return "dst-" + Math.random().toString(36).slice(2, 10);
}

/** Aceita só http(s) — evita file://, javascript: e afins vindos do formulário. */
function urlValida(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
}

function lerMapeamento(fd: FormData): Record<string, string> {
  const m: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    const campo = k.match(/^map\[(.+)\]$/)?.[1];
    if (!campo) continue;
    const nome = v.toString().trim();
    // vazio = "não mande este campo pra este destino"
    if (nome) m[campo] = nome;
  }
  return m;
}

function lerExtras(fd: FormData): Record<string, string> {
  const extras: Record<string, string> = {};
  const chaves = fd.getAll("extraChave").map((v) => v.toString().trim());
  const valores = fd.getAll("extraValor").map((v) => v.toString().trim());
  chaves.forEach((c, i) => {
    if (c && valores[i]) extras[c] = valores[i];
  });
  return extras;
}

export async function salvarDestinoAction(
  fd: FormData
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const nome = (fd.get("nome")?.toString() ?? "").trim();
    const url = (fd.get("url")?.toString() ?? "").trim();
    if (!nome) return { ok: false, error: "Dê um nome pra integração" };
    if (!urlValida(url)) return { ok: false, error: "Link inválido — tem que começar com https://" };

    const tipoAuth = fd.get("authTipo")?.toString() ?? "nenhuma";
    const valorAuth = (fd.get("authValor")?.toString() ?? "").trim();
    const headerAuth = (fd.get("authHeader")?.toString() ?? "").trim();

    const destino: Destino = {
      id: fd.get("id")?.toString() || novoId(),
      nome,
      url,
      ativo: fd.get("ativo") === "on",
      auth:
        tipoAuth === "bearer" && valorAuth
          ? { tipo: "bearer", valor: valorAuth }
          : tipoAuth === "header" && headerAuth && valorAuth
          ? { tipo: "header", header: headerAuth, valor: valorAuth }
          : { tipo: "nenhuma" },
      mapeamento: lerMapeamento(fd),
      tagsFixas: (fd.get("tags")?.toString() ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      extras: lerExtras(fd),
      somenteDe: (fd.get("somenteDe")?.toString() ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    await salvarDestino(destino);
    await logActivity("wp.edit", destino.nome, `integração salva (${urlSegura(destino.url)})`);
    revalidatePath("/settings/integracoes");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao salvar" };
  }
}

export async function excluirDestinoAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = fd.get("id")?.toString() ?? "";
  if (id) {
    await excluirDestino(id);
    await logActivity("wp.edit", id, "integração excluída");
  }
  revalidatePath("/settings/integracoes");
}

/**
 * Dispara um lead de mentira e devolve a resposta crua.
 *
 * É o que evita usar lead de verdade como cobaia no dia que o Lucas mandar o
 * endpoint: dá pra ver na hora se o token está certo e se ele aceitou o
 * formato, antes de qualquer campanha estar no ar.
 */
export async function testarDestinoAction(
  id: string
): Promise<{
  ok: boolean;
  status?: string;
  http?: number;
  erro?: string;
  enviado?: string;
  url?: string;
}> {
  await requireAdmin();
  const destino = (await listarDestinos()).find((d) => d.id === id);
  if (!destino) return { ok: false, erro: "Integração não encontrada" };
  const r = await testarDestino(destino);
  return {
    ok: r.entrega.status === "ok",
    status: r.entrega.status,
    http: r.entrega.http,
    erro: r.entrega.erro,
    enviado: JSON.stringify(r.enviado, null, 2),
    url: r.url,
  };
}

/** Mapeamento inicial pra um destino novo (a tela começa preenchida). */
export async function sugestaoDeMapeamentoAction(): Promise<Record<string, string>> {
  await requireAdmin();
  return mapeamentoSugerido();
}
