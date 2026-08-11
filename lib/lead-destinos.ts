import "server-only";
import { kvGet, kvSet } from "./storage";
import type { Lead } from "./lead-campos";
import {
  aceita,
  cabecalhos,
  corpoPara,
  urlSegura,
  type Destino,
  type Entrega,
} from "./lead-destinos-core";

export type { Destino, Entrega } from "./lead-destinos-core";

const KEY = "leads:destinos";
const TIMEOUT_MS = 8000;

export async function listarDestinos(): Promise<Destino[]> {
  const d = (await kvGet<Destino[]>(KEY)) ?? [];
  return [...d].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.nome.localeCompare(b.nome));
}

export async function salvarDestino(destino: Destino): Promise<void> {
  const todos = (await kvGet<Destino[]>(KEY)) ?? [];
  const i = todos.findIndex((d) => d.id === destino.id);
  if (i >= 0) todos[i] = destino;
  else todos.push(destino);
  await kvSet(KEY, todos);
}

export async function excluirDestino(id: string): Promise<void> {
  const todos = (await kvGet<Destino[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    todos.filter((d) => d.id !== id)
  );
}

/** Dispara pra UM destino. Nunca lança — o erro vira status. */
export async function entregarEm(
  destino: Destino,
  lead: Lead,
  tentativa = 1
): Promise<Entrega> {
  const base = {
    destinoId: destino.id,
    destinoNome: destino.nome,
    em: new Date().toISOString(),
    tentativas: tentativa,
  };
  try {
    const r = await fetch(destino.url, {
      method: "POST",
      headers: cabecalhos(destino),
      body: JSON.stringify(corpoPara(destino, lead)),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (r.ok) return { ...base, status: "ok", http: r.status };
    const corpo = await r.text().catch(() => "");
    return { ...base, status: "falhou", http: r.status, erro: corpo.slice(0, 300) };
  } catch (e) {
    return {
      ...base,
      status: "falhou",
      erro: e instanceof Error ? e.message : "Erro de rede",
    };
  }
}

/**
 * Entrega o lead em TODOS os destinos que o aceitam, em paralelo.
 *
 * Em paralelo de propósito: são chamadas de rede, e o visitante está esperando
 * a tela de obrigado. Em série, dois CRMs lentos viram 16 segundos de espera.
 *
 * Nunca lança. Lead que falha em um destino não pode derrubar o envio nos
 * outros nem quebrar a página pra quem preencheu — o lead já está guardado no
 * portal antes disto rodar.
 */
export async function entregarLead(
  lead: Lead,
  origem: string
): Promise<Entrega[]> {
  const destinos = (await listarDestinos()).filter((d) => aceita(d, origem));
  if (destinos.length === 0) return [];
  return await Promise.all(destinos.map((d) => entregarEm(d, lead)));
}

/** Reenvia só onde falhou. É o conserto de lead perdido. */
export async function reenviarFalhas(
  lead: Lead,
  entregas: Entrega[]
): Promise<Entrega[]> {
  const todos = await listarDestinos();
  const refeitas = await Promise.all(
    entregas.map(async (e) => {
      if (e.status === "ok") return e;
      const destino = todos.find((d) => d.id === e.destinoId);
      if (!destino) return e;
      return await entregarEm(destino, lead, e.tentativas + 1);
    })
  );
  return refeitas;
}

/** Teste manual: dispara um lead de mentira e devolve a resposta crua. */
export async function testarDestino(
  destino: Destino
): Promise<{ entrega: Entrega; enviado: Record<string, unknown>; url: string }> {
  const lead: Lead = {
    id: `teste-${Date.now()}`,
    nome: "Teste Jay Academy",
    email: "teste@jayacademy.com.br",
    telefone: "11999999999",
    enviado_em: new Date().toISOString(),
    tags: ["teste"],
    campos: { pagina: "teste-da-integracao", url: "https://jayacademy.com.br/teste" },
  };
  return {
    entrega: await entregarEm(destino, lead),
    enviado: corpoPara(destino, lead),
    url: urlSegura(destino.url),
  };
}
