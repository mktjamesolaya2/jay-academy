import { NextResponse, type NextRequest } from "next/server";

// A página Fio a Fio Realista é servida no slug oficial do WordPress
// /fio-a-fio-realista-by-james-olaya (o portal vai substituir o site e as URLs
// precisam bater). Esta rota antiga redireciona (308 permanente) pra não
// quebrar links já divulgados.

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return NextResponse.redirect(
    new URL("/fio-a-fio-realista-by-james-olaya", req.url),
    308
  );
}
