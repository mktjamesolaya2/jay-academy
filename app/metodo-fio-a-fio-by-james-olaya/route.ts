import { NextResponse, type NextRequest } from "next/server";

// A LP do Fio a Fio Realista agora é servida no slug oficial do WordPress
// /fio-a-fio-realista-by-james-olaya (o portal vai substituir o site e as URLs
// precisam bater). Este slug foi usado em anúncios/links já divulgados, então
// redireciona (308 permanente) em vez de sumir.

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return NextResponse.redirect(
    new URL("/fio-a-fio-realista-by-james-olaya", req.url),
    308
  );
}
