import { serveLp } from "@/lib/serve-lp";

// Evento pago "Protocolo Labial: do Escuro ao Rosado" (24/09). Prévia: fora do
// sitemap e com noindex no HTML até ter data e checkout.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "protocolo-labial.html" });
}
