import { NextResponse } from "next/server";
import { getCurrentUser, canEdit } from "@/lib/auth";
import {
  listSaved,
  loadContent,
  saveContent,
  setPublished,
  unsetPublished,
  getPublishedBySlug,
  type WpDomain,
} from "@/lib/wp-content-storage";
import { fetchPageContent } from "@/lib/wp-fetch-page";
import { revalidatePath } from "next/cache";
import {
  localizePage,
  relocatePage,
  buildSlugToPublic,
  organizeImportedMediaByPage,
} from "@/lib/wp-localize";
import { listMedia } from "@/lib/media-store";
import { listPages } from "@/lib/media-pages-store";
import { blobUpload } from "@/lib/storage";

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

  // ── Teste de upload no storage (confirma config do Supabase/S3) ──
  if (url.searchParams.get("testupload") === "1") {
    try {
      const stamp = url.searchParams.get("t") || "x";
      const { url: uploaded } = await blobUpload(
        `test/ping-${stamp}.txt`,
        Buffer.from("supabase ok"),
        "text/plain"
      );
      return NextResponse.json({ ok: true, url: uploaded });
    } catch (e) {
      return NextResponse.json({
        ok: false,
        error: e instanceof Error ? e.message : "erro",
      });
    }
  }

  // ── Exclui da biblioteca as imagens quebradas (que estão no Blob bloqueado) ──
  if (url.searchParams.get("deletebroken") === "1") {
    const { removeMediaByUrlSubstring } = await import("@/lib/media-store");
    const removed = await removeMediaByUrlSubstring(
      "blob.vercel-storage.com"
    );
    revalidatePath("/midia");
    return NextResponse.json({ ok: true, removed });
  }

  // ── Despublica uma página: ?unpub=1&slug=X&domain=Y ──
  if (url.searchParams.get("unpub") === "1") {
    const slug = url.searchParams.get("slug") || "";
    const domain = (url.searchParams.get("domain") as WpDomain) || "lp";
    const c = await loadContent(domain, slug);
    if (!c) return NextResponse.json({ ok: false, error: "página não encontrada" });
    if (!c.published) return NextResponse.json({ ok: false, error: "não estava publicada" });
    const ps = c.publicSlug || c.slug;
    await unsetPublished(c);
    revalidatePath(`/${ps}`);
    revalidatePath("/dashboard");
    return NextResponse.json({ ok: true, unpublished: slug, era: `/${ps}` });
  }

  // ── Importa FRESCO do WP a Fio a Fio (id 27) → Supabase → publica /fio-a-fio-realista ──
  if (url.searchParams.get("freshfiofio") === "1") {
    const steps: string[] = [];
    // Permite escolher outro id/domínio: ?freshfiofio=1&wpid=27&wpdomain=main
    const wpid = parseInt(url.searchParams.get("wpid") || "27", 10);
    const wpdomain = (url.searchParams.get("wpdomain") as WpDomain) || "main";

    const fresh = await fetchPageContent(wpdomain, wpid);
    if (!fresh || !(fresh.fullHtml || fresh.content)) {
      return NextResponse.json({
        ok: false,
        error: `não consegui buscar a página WP id ${wpid} (${wpdomain})`,
      });
    }
    steps.push(`baixei do WP: "${fresh.title}" (slug ${fresh.slug}, ${fresh.link})`);
    await saveContent(fresh);

    const broken = await loadContent("lp", "fio-a-fio-realista");
    if (broken?.published) {
      await unsetPublished(broken);
      steps.push("despubliquei a quebrada (lp/fio-a-fio-realista)");
    }

    const st = await localizePage(wpdomain, fresh.slug, { force: true });
    steps.push(`localizei ${st.localized} assets pro Supabase (falhas: ${st.failed})`);

    const good = await loadContent(wpdomain, fresh.slug);
    if (good) {
      try {
        await setPublished(good, "fio-a-fio-realista");
        revalidatePath("/fio-a-fio-realista");
        revalidatePath("/dashboard");
        steps.push("publiquei em /fio-a-fio-realista");
      } catch (e) {
        steps.push("ERRO ao publicar: " + (e instanceof Error ? e.message : "?"));
      }
    }
    return NextResponse.json({
      ok: st.localized > 0,
      title: fresh.title,
      slug: fresh.slug,
      assets: st.localized,
      steps,
    });
  }

  // ── Conserta Fio a Fio: usa a página com WP vivo, publica em /fio-a-fio-realista ──
  if (url.searchParams.get("fixfiofio") === "1") {
    const steps: string[] = [];
    // 1. Despublica a quebrada (libera o slug + tira do ar)
    const broken = await loadContent("lp", "fio-a-fio-realista");
    if (broken?.published) {
      await unsetPublished(broken);
      steps.push("despubliquei a quebrada (lp/fio-a-fio-realista)");
    } else {
      steps.push("a quebrada já não estava publicada");
    }
    // 2. Baixa imagens da que tem WP vivo
    const slugToPublic = await buildSlugToPublic();
    const runCache = new Map<string, Promise<string | null>>();
    let assets = 0;
    try {
      const st = await relocatePage(
        "main",
        "fio-a-fio-realista-by-james-olaya",
        slugToPublic,
        runCache
      );
      assets = st.localized;
      steps.push(`baixei ${assets} assets pro Supabase`);
    } catch (e) {
      steps.push("ERRO ao baixar: " + (e instanceof Error ? e.message : "?"));
    }
    // 3. Publica a boa na URL limpa /fio-a-fio-realista
    const good = await loadContent("main", "fio-a-fio-realista-by-james-olaya");
    if (good) {
      try {
        await setPublished(good, "fio-a-fio-realista");
        revalidatePath("/fio-a-fio-realista");
        revalidatePath("/dashboard");
        steps.push("publiquei em /fio-a-fio-realista");
      } catch (e) {
        steps.push("ERRO ao publicar: " + (e instanceof Error ? e.message : "?"));
      }
    } else {
      steps.push("não achei a página boa (main/fio-a-fio-realista-by-james-olaya)");
    }
    return NextResponse.json({ ok: assets > 0, assets, steps });
  }

  // ── Migra imagens pro Supabase + publica as 5 LPs de produto (1 por vez) ──
  if (url.searchParams.get("relocateproducts") === "1") {
    const targets: Array<{ domain: WpDomain; slug: string }> = [
      { domain: "main", slug: "basic-magic-shadow" },
      { domain: "main", slug: "basic-nanofios" },
      { domain: "main", slug: "pdv-lips-sense-technique" },
      { domain: "main", slug: "curso-online-profissao-remove" },
      { domain: "lp", slug: "fio-a-fio-realista" },
    ];
    const loaded = [];
    for (const t of targets) {
      const c = await loadContent(t.domain, t.slug);
      if (c) loaded.push({ t, c });
    }
    const total = loaded.length;
    const done = loaded.filter((x) => x.c.relocatedAt).length;
    const next = loaded.find((x) => !x.c.relocatedAt);

    if (!next) {
      // Tudo migrado → garante publicação das 5
      const urls: string[] = [];
      for (const x of loaded) {
        const ps = x.c.publicSlug || x.c.slug;
        if (!x.c.published) {
          try {
            await setPublished(x.c, ps);
          } catch {}
        }
        urls.push(`/${ps}`);
        revalidatePath(`/${ps}`);
      }
      revalidatePath("/dashboard");
      return page(
        `<h1>✅ 5 LPs prontas</h1>
         <div class="big">${total}/${total}</div>
         <p class="muted">Imagens no Supabase + páginas publicadas com os links e
         preços certos. URLs:</p>
         <p class="muted">${urls
           .map((u) => `<code>${u}</code>`)
           .join("<br>")}</p>`
      );
    }

    const slugToPublic = await buildSlugToPublic();
    const runCache = new Map<string, Promise<string | null>>();
    let assets = 0;
    try {
      const st = await relocatePage(
        next.t.domain,
        next.t.slug,
        slugToPublic,
        runCache
      );
      assets = st.localized;
      const fresh = await loadContent(next.t.domain, next.t.slug);
      if (fresh && !fresh.published) {
        const ps = fresh.publicSlug || fresh.slug;
        try {
          await setPublished(fresh, ps);
          revalidatePath(`/${ps}`);
        } catch {}
      }
    } catch {
      // segue; tenta de novo no próximo refresh
    }
    const doneAfter = done + 1;
    const pct = Math.round((doneAfter / total) * 100);
    return page(
      `<h1>Preparando as LPs de produto…</h1>
       <div class="big">${doneAfter}/${total}</div>
       <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
       <p class="muted">Migrando imagens pro Supabase + publicando.
       Acabei de fazer <strong>${next.t.slug}</strong> (${assets} assets).
       Esta tela se atualiza sozinha.</p>`,
      true
    );
  }

  // ── Publica as 5 páginas de produto (links + preços já conferidos) ──
  if (url.searchParams.get("publishproducts") === "1") {
    const targets: Array<{ domain: WpDomain; slug: string }> = [
      { domain: "main", slug: "basic-magic-shadow" },
      { domain: "main", slug: "basic-nanofios" },
      { domain: "main", slug: "pdv-lips-sense-technique" },
      { domain: "main", slug: "curso-online-profissao-remove" },
      { domain: "lp", slug: "fio-a-fio-realista" },
    ];
    const done: Array<{ slug: string; status: string; url?: string }> = [];
    for (const t of targets) {
      const c = await loadContent(t.domain, t.slug);
      if (!c) {
        done.push({ slug: t.slug, status: "não encontrada" });
        continue;
      }
      const publicSlug = c.publicSlug || c.slug;
      if (c.published) {
        done.push({ slug: t.slug, status: "já publicada", url: `/${publicSlug}` });
        continue;
      }
      try {
        await setPublished(c, publicSlug);
        revalidatePath(`/${publicSlug}`);
        done.push({ slug: t.slug, status: "PUBLICADA", url: `/${publicSlug}` });
      } catch (e) {
        done.push({
          slug: t.slug,
          status: "erro: " + (e instanceof Error ? e.message : "?"),
        });
      }
    }
    revalidatePath("/wp-pages");
    revalidatePath("/dashboard");
    return NextResponse.json(done);
  }

  // ── Contexto de preço: pras 5 páginas de produto, mostra cada R$ + o texto em volta ──
  if (url.searchParams.get("pricecontext") === "1") {
    const targets: Array<{ domain: WpDomain; slug: string; produto: string }> = [
      { domain: "main", slug: "basic-magic-shadow", produto: "Basic Magic Shadow (R$97)" },
      { domain: "main", slug: "basic-nanofios", produto: "Basic Nano Fios (R$297)" },
      { domain: "main", slug: "pdv-lips-sense-technique", produto: "Lips Sense (R$597)" },
      { domain: "main", slug: "curso-online-profissao-remove", produto: "Profissão Remove (R$997)" },
      { domain: "lp", slug: "fio-a-fio-realista", produto: "Fio a Fio Realista (R$197)" },
    ];
    const result: Array<{
      produto: string;
      slug: string;
      published: boolean;
      precos: Array<{ valor: string; contexto: string }>;
    }> = [];
    for (const t of targets) {
      const c = await loadContent(t.domain, t.slug);
      if (!c) {
        result.push({ produto: t.produto, slug: t.slug, published: false, precos: [] });
        continue;
      }
      const text = `${c.fullHtml || ""}\n${c.content || ""}`
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&#0?38;|&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ");
      const precos: Array<{ valor: string; contexto: string }> = [];
      const re = /R\$\s?[0-9][0-9.]*,?[0-9]{0,2}/g;
      const seen = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) && precos.length < 12) {
        const ctx = text.slice(Math.max(0, m.index - 50), m.index + 50).trim();
        if (seen.has(ctx)) continue;
        seen.add(ctx);
        precos.push({ valor: m[0], contexto: ctx });
      }
      result.push({
        produto: t.produto,
        slug: t.slug,
        published: !!c.published,
        precos,
      });
    }
    return NextResponse.json(result);
  }

  // ── Scan Hotmart: páginas com link pay.hotmart.com + preços que aparecem ──
  if (url.searchParams.get("hotmartscan") === "1") {
    const saved = (await listSaved()).filter((s) => !s.trashed);
    const out: Array<{
      slug: string;
      domain: string;
      title: string;
      published: boolean;
      hotmart: string[];
      prices: string[];
    }> = [];
    for (const s of saved) {
      const c = await loadContent(s.domain, s.slug);
      if (!c) continue;
      const html = `${c.fullHtml || ""}\n${c.content || ""}`.replace(
        /&#0?38;|&amp;/g,
        "&"
      );
      const hotmart = [
        ...new Set(
          (html.match(/pay\.hotmart\.com\/[A-Za-z0-9]+(?:\?[^"'\s<)]*)?/g) || []).map(
            (l) => l.replace(/\\$/, "")
          )
        ),
      ];
      if (hotmart.length === 0) continue;
      const prices = [
        ...new Set(html.match(/R\$\s?[0-9][0-9.]*,[0-9]{2}/g) || []),
      ].slice(0, 8);
      out.push({
        slug: c.slug,
        domain: c.domain,
        title: (c.title || "").replace(/<[^>]*>/g, ""),
        published: !!c.published,
        hotmart,
        prices,
      });
    }
    return NextResponse.json({ count: out.length, pages: out });
  }

  // ── Diagnóstico da biblioteca de mídia ──
  if (url.searchParams.get("mediastats") === "1") {
    const [media, pages] = [await listMedia(), await listPages()];
    const byHost: Record<string, number> = {};
    let withPage = 0;
    const sampleUrls: string[] = [];
    for (const m of media) {
      let host: string;
      if (m.url.startsWith("/")) host = "(relativo /uploads)";
      else {
        try {
          host = new URL(m.url).host;
        } catch {
          host = "(inválido)";
        }
      }
      byHost[host] = (byHost[host] || 0) + 1;
      if (m.pageId) withPage++;
      if (sampleUrls.length < 6) sampleUrls.push(m.url);
    }
    const counts: Record<string, number> = {};
    for (const m of media) if (m.pageId) counts[m.pageId] = (counts[m.pageId] || 0) + 1;
    const emptyPages = pages.filter((p) => !counts[p.id]).length;
    return NextResponse.json({
      totalMedia: media.length,
      withPage,
      withoutPage: media.length - withPage,
      byHost,
      totalPages: pages.length,
      emptyPages,
      sampleUrls,
    });
  }

  // ── Migração one-shot: organiza imagens já importadas em páginas (por origem) ──
  if (url.searchParams.get("organize") === "1") {
    const res = await organizeImportedMediaByPage();
    return NextResponse.json({ ok: true, ...res });
  }

  // ── Migração Blob→Supabase (re-baixa do WP pro storage novo, em lotes) ──
  if (url.searchParams.get("relocate") === "1") {
    const saved = (await listSaved()).filter((s) => !s.trashed);
    const total = saved.length;
    const pending = saved.filter((s) => !s.relocatedAt);
    const done = total - pending.length;

    if (pending.length === 0) {
      return page(
        `<h1>✅ Imagens migradas pro Supabase</h1>
         <div class="big">${total}/${total}</div>
         <p class="muted">Todas as páginas foram re-baixadas do WordPress pro
         storage novo (Supabase). As imagens já carregam de novo — independente
         do Blob bloqueado.</p>`
      );
    }

    const slugToPublic = await buildSlugToPublic();
    const runCache = new Map<string, Promise<string | null>>();
    const batch = pending.slice(0, 1); // 1 por vez (re-baixa tudo, é pesado)
    let justDone = 0;
    let assetsNow = 0;
    for (const s of batch) {
      try {
        const st = await relocatePage(s.domain, s.slug, slugToPublic, runCache);
        justDone++;
        assetsNow += st.localized;
      } catch {
        // segue; a página continua pendente e pode ser tentada de novo
      }
    }
    const doneAfter = done + justDone;
    const pct = Math.round((doneAfter / total) * 100);
    return page(
      `<h1>Migrando imagens pro Supabase…</h1>
       <div class="big">${doneAfter}/${total}</div>
       <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
       <p class="muted">Re-baixando do WordPress pro storage novo. Acabei de
       migrar uma página (${assetsNow} assets). Esta tela se atualiza sozinha
       até terminar — pode deixar aberta.</p>
       <p class="muted">Faltam <strong>${pending.length - justDone}</strong>.</p>`,
      true
    );
  }

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
      const st = await localizePage(s.domain, s.slug, { slugToPublic });
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
