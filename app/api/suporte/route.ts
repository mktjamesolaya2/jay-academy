import { NextResponse } from "next/server";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { anexoValido, type Anexo } from "@/lib/suporte-anexo";
import { rateLimit, tooManyRequests, payloadTooLarge } from "@/lib/rate-limit";
import { responder } from "@/lib/suporte-cerebro";

/**
 * O chat de **teste** do painel — onde o James treina a IA.
 *
 * ⚠️ O atendimento em si mora em `lib/suporte-cerebro.ts`, compartilhado com a
 * página pública da aluna (`/api/ajuda`). Duas cópias do mesmo atendimento
 * significaria corrigir uma regra num lado e deixar o outro errado — e o outro
 * lado é o que fala com aluna.
 *
 * Esta rota cuida só da porta: **exige login de quem edita**.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!canEdit(me)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  if (payloadTooLarge(req, 14 * 1024 * 1024)) {
    return NextResponse.json({ error: "Mensagem muito grande" }, { status: 413 });
  }
  if (!(await rateLimit("suporte", req, 30, 60)).ok) {
    return tooManyRequests() as NextResponse;
  }

  const body = (await req.json().catch(() => null)) as {
    conversaId?: string;
    texto?: string;
    anexos?: Anexo[];
  } | null;

  const anexos = (body?.anexos ?? []).slice(0, 3);
  for (const a of anexos) {
    const v = anexoValido(a);
    if (!v.ok) return NextResponse.json({ error: v.erro }, { status: 400 });
  }

  const r = await responder({
    conversaId: body?.conversaId,
    texto: body?.texto ?? "",
    anexos,
    // Marca a conversa como treino, pra não se misturar com aluna de verdade
    // na caixa de entrada do time.
    quem: "Teste",
    teste: true,
  });

  if (r.tipo === "erro") {
    return NextResponse.json(
      { error: r.erro, conversaId: r.conversaId },
      { status: r.status }
    );
  }
  if (r.tipo === "calada") {
    return NextResponse.json({ calada: true, conversaId: r.conversaId });
  }
  return NextResponse.json({
    reply: r.reply,
    precisaHumano: r.precisaHumano,
    conversaId: r.conversaId,
    model: r.model,
    provedor: r.provedor,
  });
}
