import { NextResponse } from "next/server";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { testarCredenciais, vendasDoEmail } from "@/lib/hotmart-api";

/**
 * Confere se as credenciais da Hotmart funcionam.
 *
 * ⚠️ Existe porque as credenciais só vivem na Vercel — não dá pra testar da
 * máquina do dev. O James abre esta URL logado e me conta o que apareceu.
 *
 * Exige login de admin: mesmo sendo só leitura, `?email=` devolve compra de
 * cliente, e isso não pode ficar aberto na internet.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!canEdit(me)) {
    return NextResponse.json({ error: "Precisa estar logado" }, { status: 403 });
  }

  const teste = await testarCredenciais();
  if (!teste.ok) {
    return NextResponse.json(
      {
        credenciais: "NÃO funcionaram",
        motivo: teste.erro,
        formato: teste.formato,
        tentativas: teste.tentativas,
      },
      { status: 200 }
    );
  }

  const email = new URL(req.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({
      credenciais: "OK — a Hotmart aceitou",
      dica: "Pra ver as compras de alguém, acrescente ?email=alguem@email.com",
    });
  }

  try {
    const vendas = await vendasDoEmail(email);
    return NextResponse.json({
      credenciais: "OK — a Hotmart aceitou",
      email,
      compras: vendas.length,
      itens: vendas,
    });
  } catch (e) {
    return NextResponse.json({
      credenciais: "OK — a Hotmart aceitou",
      email,
      erroNaConsulta: e instanceof Error ? e.message : "Erro",
    });
  }
}
