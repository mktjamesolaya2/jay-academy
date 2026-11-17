import { serveLp } from "@/lib/serve-lp";

// Combo Black (17/11): 5 cursos online do James com 5 anos de acesso, oferta de
// Black Friday. Fora do sitemap e com noindex no HTML: o tráfego é de anúncio e lista.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "comboblack.html" });
}
