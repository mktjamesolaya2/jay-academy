import "server-only";
import { loadContent, saveContent } from "./wp-content-storage";
import { generatePageSummary } from "./ai-summary";
import type { WpDomain } from "./wp-api";

/**
 * Gera e salva o resumo IA da página. Best-effort: NUNCA lança erro
 * (não pode quebrar a publicação se a IA estiver indisponível).
 * Por padrão só gera se ainda não houver resumo; use force pra regenerar.
 */
export async function ensurePageSummary(
  domain: WpDomain,
  slug: string,
  opts?: { force?: boolean }
): Promise<void> {
  try {
    const content = await loadContent(domain, slug);
    if (!content) return;
    if (content.summary && !opts?.force) return;

    const summary = await generatePageSummary({
      title: content.title,
      body: content.content || content.fullHtml || content.excerpt || "",
      kind: content.placed,
    });

    content.summary = summary;
    content.summaryAt = new Date().toISOString();
    await saveContent(content);
  } catch (e) {
    console.warn(
      "[ensurePageSummary] não gerou agora:",
      e instanceof Error ? e.message : e
    );
  }
}
