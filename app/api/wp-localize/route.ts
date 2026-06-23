import { NextResponse } from "next/server";
import { getCurrentUser, canEdit } from "@/lib/auth";
import {
  listSaved,
  loadContent,
  getPublishedBySlug,
  type WpDomain,
} from "@/lib/wp-content-storage";
import { localizePage, buildSlugToPublic } from "@/lib/wp-localize";

// Backfill de localização: baixa os assets do WP das páginas já copiadas.
// Abra ESTE link no navegador (logado como admin):
//   /api/wp-localize           → processa as páginas em lotes, auto-avançando
//   /api/wp-localize?slug=X&domain=lp  → localiza só uma página (JSON)
//
// Não é um botão permanente na interface — é uma URL one-shot que se auto-atualiza
// até terminar. Resumível: páginas já localizadas são puladas.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Quantas páginas por requisição (cada uma baixa ~dezenas de assets). Baixo o
// suficiente pra caber no teto de 60s; o meta-refresh continua de onde parou.
const BATCH = 2;

function page(body: string, refresh = false): NextResponse {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${refresh ? '<meta http-equiv="refresh" content="1">' : ""}
<title>Desconectar do WP</title>
<style>
  body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e8e8e8;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center}
  .card{max-width:560px;padding:40px;text-align:center}
  h1{font-size:20px;font-weight:700;margin:0 0 8px}
  .bar{height:10px;background:#1c1c1c;border-radius:99px;overflow:hidden;margin:20px 0}
  .fill{height:100%;background:linear-gradient(90deg,#ec4899,#f97316);transition:width .4s}
  .muted{color:#888;font-size:14px;line-height:1.6}
  .big{font-size:34px;font-weight:800;margin:4px 0}
  code{background:#161616;padding:2px 6px;border-radius:6px;font-size:13px}
</style></head><body><div class="card">${body}</div></body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!canEdit(me)) {
    return page(
      `<h1>Acesso restrito</h1><p class="muted">Faça login como admin e abra este link de novo.</p>`
    );
  }

  const url = new URL(req.url);
  const oneSlug = url.searchParams.get("slug");
  const oneDomain = url.searchParams.get("domain") as WpDomain | null;

  // ── Modo 1 página (JSON, reprocessa à força) ────────────────────
  // Aceita o slug interno (com ?domain) OU o slug público (resolve sozinho).
  // localizePage sempre reprocessa, então serve pra re-testar uma página.
  if (oneSlug) {
    let target: { domain: WpDomain; slug: string } | null = null;
    if (oneDomain && (await loadContent(oneDomain, oneSlug))) {
      target = { domain: oneDomain, slug: oneSlug };
    }
    if (!target) target = await getPublishedBySlug(oneSlug);
    if (!target) {
      return NextResponse.json(
        { error: "página não encontrada", slug: oneSlug },
        { status: 404 }
      );
    }
    const stats = await localizePage(target.domain, target.slug);
    return NextResponse.json({ ...target, ...stats });
  }

  // ── Modo backfill em lote (HTML auto-avançando) ─────────────────
  const saved = (await listSaved()).filter((s) => !s.trashed);
  const total = saved.length;
  // Pendente = nunca localizada OU localizada mas com falha total (0 baixados) —
  // pega as que o código antigo marcou como "pronta" sem ter baixado nada.
  const pending = saved.filter(
    (s) =>
      !s.localizedAt ||
      (s.localizeStats != null &&
        s.localizeStats.localized === 0 &&
        s.localizeStats.total > 0)
  );
  const done = total - pending.length;

  if (pending.length === 0) {
    return page(
      `<h1>✅ Tudo desconectado do WP</h1>
       <div class="big">${total}/${total}</div>
       <p class="muted">Todas as páginas copiadas baixaram seus assets pro storage local.
       Já pode desligar o WordPress sem quebrar nenhuma.</p>`
    );
  }

  // Processa o próximo lote. Mapa de slugs montado UMA vez pra todo o lote.
  const slugToPublic = await buildSlugToPublic();
  const batch = pending.slice(0, BATCH);
  let justLocalized = 0;
  let assetsNow = 0;
  for (const s of batch) {
    try {
      const st = await localizePage(s.domain, s.slug, slugToPublic);
      justLocalized++;
      assetsNow += st.localized;
    } catch {
      // se uma página falhar, segue; ela continuará pendente e pode ser
      // tentada de novo numa próxima passada
    }
  }

  const doneAfter = done + justLocalized;
  const pct = Math.round((doneAfter / total) * 100);

  return page(
    `<h1>Desconectando do WordPress…</h1>
     <div class="big">${doneAfter}/${total}</div>
     <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
     <p class="muted">Baixando imagens, CSS e JS pro storage local.
     Acabei de processar <strong>${justLocalized}</strong> página(s)
     (${assetsNow} assets). Esta tela se atualiza sozinha até terminar —
     pode deixar aberta.</p>
     <p class="muted">Faltam <strong>${pending.length - justLocalized}</strong>.</p>`,
    true
  );
}
