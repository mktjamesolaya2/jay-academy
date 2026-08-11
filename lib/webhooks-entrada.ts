import "server-only";
import { randomBytes } from "node:crypto";
import { kvGet, kvSet } from "./storage";

/**
 * Webhook de ENTRADA: o endereço que é NOSSO.
 *
 * ⚠️ Direção. Existem dois tipos de webhook e eles são opostos:
 *
 *   ENTRADA (isto aqui)  página/ferramenta  →  portal
 *   SAÍDA (lead-destinos.ts)      portal    →  CRM
 *
 * O que existia era só a saída, e ela dependia de o Clint gerar o link. Como a
 * ideia é justamente SAIR do Clint, o link tem que nascer aqui: a gente cria,
 * cola nas páginas, e o lead cai no portal. Nenhum lead precisa mais passar
 * por serviço de terceiro pra ser recebido.
 *
 * O token é a senha: quem tem o link consegue mandar lead. Por isso ele é
 * grande, aleatório, e dá pra desligar ou apagar sem mexer em mais nada.
 */

export type WebhookEntrada = {
  /** também é o token da URL — não é sequencial, é sorteado */
  id: string;
  nome: string;
  ativo: boolean;
  criadoEm: string;
  /** tags que todo lead que entrar por aqui recebe */
  tags?: string[];
  /** contadores, pra dar pra ver na tela se está chegando coisa */
  recebidos?: number;
  ultimoEm?: string;
};

const KEY = "webhooks:entrada";

export function novoToken(): string {
  return "wh_" + randomBytes(18).toString("hex");
}

export async function listarWebhooks(): Promise<WebhookEntrada[]> {
  const todos = (await kvGet<WebhookEntrada[]>(KEY)) ?? [];
  return [...todos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function acharWebhook(id: string): Promise<WebhookEntrada | null> {
  const todos = (await kvGet<WebhookEntrada[]>(KEY)) ?? [];
  return todos.find((w) => w.id === id) ?? null;
}

export async function salvarWebhook(w: WebhookEntrada): Promise<void> {
  const todos = (await kvGet<WebhookEntrada[]>(KEY)) ?? [];
  const i = todos.findIndex((x) => x.id === w.id);
  if (i >= 0) todos[i] = w;
  else todos.push(w);
  await kvSet(KEY, todos);
}

export async function excluirWebhook(id: string): Promise<void> {
  const todos = (await kvGet<WebhookEntrada[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    todos.filter((w) => w.id !== id)
  );
}

/** Marca que chegou lead — é o que mostra na tela que o link está vivo. */
export async function registrarRecebimento(id: string): Promise<void> {
  const todos = (await kvGet<WebhookEntrada[]>(KEY)) ?? [];
  const i = todos.findIndex((w) => w.id === id);
  if (i < 0) return;
  todos[i] = {
    ...todos[i],
    recebidos: (todos[i].recebidos ?? 0) + 1,
    ultimoEm: new Date().toISOString(),
  };
  await kvSet(KEY, todos);
}
