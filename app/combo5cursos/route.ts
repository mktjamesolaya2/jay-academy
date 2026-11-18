import { serveLp } from "@/lib/serve-lp";

// Combo 5 Cursos (17/11): a mesma oferta da /comboblack fora da Black Friday
// (preço normal, sem data nem contador). Fora do sitemap e com noindex no HTML.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "combo5cursos.html" });
}
