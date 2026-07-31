import { serveLp } from "@/lib/serve-lp";

// Prévia isolada da nova LP. Permanece fora do sitemap e com noindex no HTML
// até a aprovação para substituir /fio-a-fio-realista-by-james-olaya.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "fio-a-fio-realista-v2.html" });
}
