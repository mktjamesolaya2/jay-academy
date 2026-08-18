import { NextResponse } from "next/server";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { lerUsoIA } from "@/lib/suporte-store";
import { listarReenvios } from "@/lib/reenvio-store";
import { limiteDoDia } from "@/lib/uso-ia";

/**
 * Os números da coluna da esquerda do suporte.
 *
 * ⚠️ Exige login de quem edita: a contagem de e-mails pendentes conta quantas
 * alunas estão sem acesso, e isso é informação de dentro de casa.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  if (!canEdit(me)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  const [uso, reenvios] = await Promise.all([
    lerUsoIA().catch(() => ({ usadas: 0, estourou: false })),
    listarReenvios().catch(() => []),
  ]);
  return NextResponse.json({
    usadas: uso.usadas,
    paradaPorCota: uso.estourou,
    limite: limiteDoDia(),
    emails: reenvios.length,
  });
}
