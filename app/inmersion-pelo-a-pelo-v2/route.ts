import { serveLp } from "@/lib/serve-lp";

// Inmersión Pelo a Pelo v2 — copy da skill de evento pago (10/10) na identidade
// da Fio a Fio v3. Imagens: /recriadas/inmersion-pelo-a-pelo/ e /lp/fio-a-fio-realista-v2/.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "inmersion-pelo-a-pelo-v2.html" });
}
