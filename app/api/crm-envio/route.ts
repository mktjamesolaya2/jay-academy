import { NextResponse } from "next/server";
import { kvSet } from "@/lib/storage";
import { rateLimit, tooManyRequests, payloadTooLarge } from "@/lib/rate-limit";
import { chaveLog, logsDaPagina, type EnvioCrm } from "@/lib/webhook-log";

/**
 * Leva o lead até o CRM, pelo NOSSO servidor.
 *
 * ⚠️ Por que não mandar direto do navegador: um POST com JSON dispara a
 * verificação prévia do navegador (preflight). Se o CRM não responder essa
 * verificação liberando o domínio da página, o navegador **barra antes de
 * sair** — e o lead some sem erro nenhum na tela. Foi exatamente o que
 * aconteceu: "não veio pro CRM o cadastro". Servidor não tem essa regra: sai
 * sempre.
 *
 * De quebra, a resposta do CRM fica registrada aqui (`webhook-log:<pagina>`) e
 * aparece na tela da página, em vez de morrer no navegador de quem preencheu.
 */

export const dynamic = "force-dynamic";

const BASE = "https://www.sistemajayo.com/api/integrations/site/lead/";
const MAX_LOG = 10;

export async function POST(req: Request) {
  if (payloadTooLarge(req, 32 * 1024)) {
    return NextResponse.json({ ok: false, erro: "Envio muito grande" }, { status: 413 });
  }
  // Teto por IP de quem preenche — o do CRM é por chave, este é anti-flood.
  if (!(await rateLimit("crm-envio", req, 20, 60)).ok) {
    return tooManyRequests() as NextResponse;
  }

  const corpo = (await req.json().catch(() => null)) as {
    chave?: string;
    pagina?: string;
    dados?: Record<string, string>;
  } | null;

  const chave = corpo?.chave ?? "";
  if (!/^pk_[A-Za-z0-9_-]{8,}$/.test(chave)) {
    return NextResponse.json({ ok: false, erro: "Chave inválida" }, { status: 400 });
  }
  const dados = corpo?.dados ?? {};
  const pagina = (corpo?.pagina ?? "").replace(/^\/+|\/+$/g, "").slice(0, 120);

  let status = 0;
  let erro = "";
  try {
    const r = await fetch(BASE + chave, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
      signal: AbortSignal.timeout(8000),
    });
    status = r.status;
    const texto = await r.text().catch(() => "");
    let ok = r.ok;
    try {
      ok = ok && JSON.parse(texto || "{}").ok !== false;
    } catch {}
    if (!ok) erro = texto.slice(0, 300);
    if (pagina) await registrar(pagina, { em: new Date().toISOString(), status, erro: erro || undefined });
    return NextResponse.json({ ok, status });
  } catch (e) {
    erro = e instanceof Error ? e.message : "Erro de rede";
    if (pagina) await registrar(pagina, { em: new Date().toISOString(), status: 0, erro });
    return NextResponse.json({ ok: false, status: 0, erro }, { status: 502 });
  }
}

async function registrar(pagina: string, envio: EnvioCrm): Promise<void> {
  try {
    const anteriores = await logsDaPagina(pagina);
    await kvSet(chaveLog(pagina), [envio, ...anteriores].slice(0, MAX_LOG));
  } catch {}
}
