import { NextResponse } from "next/server";
import { registrarCompra } from "@/lib/hotmart-store";
import { logAnonymousActivity } from "@/lib/activity-log";
import { payloadTooLarge } from "@/lib/rate-limit";

/**
 * Onde a Hotmart avisa o portal a cada compra, reembolso ou cancelamento.
 *
 * ⚠️ Esta URL fica aberta pra internet (a Hotmart chama de fora, sem login),
 * então ela exige o **hottok** — a senha que a própria Hotmart mostra na tela
 * de configuração do webhook. Sem conferir isso, qualquer um poderia inventar
 * compras no nosso sistema e a IA passaria a dizer pra aluna que ela tem
 * acesso quando não tem.
 *
 * Guarda só o que responde "essa aluna ainda tem acesso?": quem, qual produto,
 * quando e a situação. Nada de pagamento.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (payloadTooLarge(req, 256 * 1024)) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  const esperado = process.env.HOTMART_HOTTOK;
  if (!esperado) {
    console.error("[hotmart] HOTMART_HOTTOK não configurada — aviso recusado.");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  // A Hotmart manda o hottok no cabeçalho; versões antigas mandavam no corpo.
  const corpo = (await req.json().catch(() => null)) as Record<string, any> | null;
  const recebido =
    req.headers.get("x-hotmart-hottok") ||
    req.headers.get("hottok") ||
    corpo?.hottok ||
    "";
  if (recebido !== esperado) {
    console.warn("[hotmart] aviso com hottok inválido — ignorado.");
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!corpo) return NextResponse.json({ ok: false }, { status: 400 });

  // O formato mudou entre as versões da API: procura nos dois lugares.
  const dados = corpo.data ?? corpo;
  const comprador = dados.buyer ?? dados.subscriber ?? {};
  const produto = dados.product ?? {};
  const compra = dados.purchase ?? {};

  const email = String(comprador.email ?? dados.email ?? "").trim();
  if (!email) {
    console.warn("[hotmart] aviso sem e-mail do comprador — ignorado.");
    return NextResponse.json({ ok: true, ignorado: "sem e-mail" });
  }

  const evento = String(corpo.event ?? dados.event ?? "").toUpperCase();
  const situacao =
    String(compra.status ?? dados.status ?? "").toLowerCase() ||
    (evento.includes("REFUND")
      ? "reembolsada"
      : evento.includes("CANCEL")
        ? "cancelada"
        : "aprovada");

  const quando =
    compra.order_date ??
    compra.approved_date ??
    dados.purchase_date ??
    Date.now();

  await registrarCompra({
    email,
    nome: comprador.name ? String(comprador.name) : undefined,
    produto: String(produto.name ?? dados.prod_name ?? "curso"),
    compradaEm: new Date(
      typeof quando === "number" ? quando : String(quando)
    ).toISOString(),
    situacao,
    atualizadaEm: new Date().toISOString(),
  });

  await logAnonymousActivity(
    "form.submission",
    comprador.name ? String(comprador.name) : email,
    "Hotmart",
    `${situacao} — ${produto.name ?? "curso"}`
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
