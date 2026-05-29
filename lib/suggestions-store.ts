import "server-only";
import { kvGet, kvSet } from "./storage";

export type SuggestionStatus =
  | "open"
  | "planned"
  | "in-progress"
  | "done"
  | "rejected";

export type Suggestion = {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  createdBy: string;
  createdById: string;
  createdAt: string;
  /** IDs dos usuários que apoiaram. Não permite voto duplicado. */
  upvotes: string[];
  /** Resposta pública de admin quando muda status. */
  adminNote?: string;
};

const KEY = "suggestions:all";

const SEED: Suggestion[] = [
  {
    id: "seed-1",
    title: "Subir HTML/CSS direto, sem passar por WordPress",
    description:
      "Hoje só conseguimos editar páginas que vieram do WP. Seria útil colar HTML/CSS de uma LP comprada ou gerada por IA direto no portal, ter URL pública /p/[slug] e poder editar pelo editor visual igual nas páginas WP.",
    status: "open",
    createdBy: "James Olaya",
    createdById: "admin-1",
    createdAt: "2026-05-29T00:00:00.000Z",
    upvotes: [],
  },
  {
    id: "seed-2",
    title: "Editor visual no /forms (campos arrastáveis)",
    description:
      "Forms nativos hoje têm só 3 campos fixos (nome, whatsapp, email). Quero poder arrastar campos novos (radio, select, textarea, checkbox), trocar cores do botão e do background, e personalizar texto do sucesso/erro.",
    status: "open",
    createdBy: "James Olaya",
    createdById: "admin-1",
    createdAt: "2026-05-29T00:00:00.000Z",
    upvotes: [],
  },
  {
    id: "seed-3",
    title: "Páginas do zero estilo Webflow (blocos pré-feitos)",
    description:
      "Criar uma LP nova SEM depender de WordPress nem de código React. Blocos prontos (hero, depoimentos, FAQ, CTA, pricing) que arrasto e configuro só preenchendo texto e trocando imagem. A LP entra em /p/[slug] pronta pra usar.",
    status: "open",
    createdBy: "James Olaya",
    createdById: "admin-1",
    createdAt: "2026-05-29T00:00:00.000Z",
    upvotes: [],
  },
];

export async function listSuggestions(): Promise<Suggestion[]> {
  const stored = await kvGet<Suggestion[]>(KEY);
  if (stored && stored.length > 0) return stored;
  // Seed inicial — só persiste se KV ainda não tem nada
  await kvSet(KEY, SEED);
  return SEED;
}

export async function getSuggestion(id: string): Promise<Suggestion | null> {
  const all = await listSuggestions();
  return all.find((s) => s.id === id) ?? null;
}

export async function addSuggestion(
  s: Omit<Suggestion, "id" | "createdAt" | "upvotes" | "status">
): Promise<Suggestion> {
  const all = await listSuggestions();
  const created: Suggestion = {
    ...s,
    id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    upvotes: [],
    status: "open",
  };
  all.unshift(created);
  await kvSet(KEY, all);
  return created;
}

export async function toggleUpvote(
  id: string,
  userId: string
): Promise<void> {
  const all = await listSuggestions();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const sug = all[idx];
  const has = sug.upvotes.includes(userId);
  all[idx] = {
    ...sug,
    upvotes: has
      ? sug.upvotes.filter((u) => u !== userId)
      : [...sug.upvotes, userId],
  };
  await kvSet(KEY, all);
}

export async function setSuggestionStatus(
  id: string,
  status: SuggestionStatus,
  adminNote?: string
): Promise<void> {
  const all = await listSuggestions();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return;
  all[idx] = { ...all[idx], status, adminNote };
  await kvSet(KEY, all);
}

export async function deleteSuggestion(id: string): Promise<void> {
  const all = await listSuggestions();
  await kvSet(KEY, all.filter((s) => s.id !== id));
}
