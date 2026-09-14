import { serveLp } from "@/lib/serve-lp";

// Oferta de fechamento do JAY TRANSFORMA (JAY Beauty, 4 dias presenciais).
// Página de condição exclusiva: não entra no sitemap e o HTML leva noindex.

export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "jaytransforma-beauty.html" });
}
