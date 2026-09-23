import { serveLp } from "@/lib/serve-lp";

// Prévia da v3 (copy da auditoria de 22/09). Fora do sitemap e com noindex no
// HTML; os assets são os mesmos da v2 (/lp/fio-a-fio-realista-v2/).
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "fio-a-fio-realista-v3.html" });
}
