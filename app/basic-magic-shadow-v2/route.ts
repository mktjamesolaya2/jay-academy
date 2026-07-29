import { NextResponse, type NextRequest } from "next/server";

// A "v2" foi aprovada e assumiu o slug oficial /basic-magic-shadow (29/07).
// Este slug de teste circulou enquanto ela era validada, então redireciona
// (308 permanente) pra não quebrar link já compartilhado.

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/basic-magic-shadow", req.url), 308);
}
