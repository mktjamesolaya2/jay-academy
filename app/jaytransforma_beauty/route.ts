import { NextResponse, type NextRequest } from "next/server";

// O endereço com underscore foi o primeiro divulgado. O canônico segue o padrão
// de hífen do resto do repo, então aqui fica o redirect (308 permanente).

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/jaytransforma-beauty", req.url), 308);
}
