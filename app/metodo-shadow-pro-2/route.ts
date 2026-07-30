import { NextResponse, type NextRequest } from "next/server";

// O "-2" veio de acidente: a página WP original foi excluída e a LP recriada
// nasceu neste slug. Em 30/07 assumiu o slug limpo /metodo-shadow-pro, então
// aqui fica o redirect (308 permanente) pra não quebrar link já divulgado.

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/metodo-shadow-pro", req.url), 308);
}
