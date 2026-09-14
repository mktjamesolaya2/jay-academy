import { serveLp } from "@/lib/serve-lp";

// Oferta de fechamento do JAY TRANSFORMA (JAY Start: Brows Shadow & Nano e
// Nano Brows & Lips, 5 dias presenciais cada).
// Página de condição exclusiva: não entra no sitemap e o HTML leva noindex.

export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "jaytransforma-start.html" });
}
