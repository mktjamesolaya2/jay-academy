import { NextResponse, type NextRequest } from "next/server";

// A página Fio a Fio Realista foi movida para a URL oficial
// /metodo-fio-a-fio-by-james-olaya. Esta rota antiga redireciona
// (308 permanente) pra não quebrar links já divulgados.

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return NextResponse.redirect(
    new URL("/metodo-fio-a-fio-by-james-olaya", req.url),
    308
  );
}
