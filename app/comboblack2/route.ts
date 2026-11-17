import { serveLp } from "@/lib/serve-lp";

// Combo Nano + Shadow (17/11): Basic Nano Fios + Shadow PRO com acesso vitalício,
// a oferta menor da Black Friday. Fora do sitemap e com noindex no HTML.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "comboblack2.html" });
}
