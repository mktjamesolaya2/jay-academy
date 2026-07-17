import { serveLp } from "@/lib/serve-lp";

// Inmersión Pelo a Pelo — LP reconstruída, servida de lp-html/ como está (sem
// de-lazy) + tracking canônico via serveLp(). Rota estática tem prioridade
// sobre o [slug] dinâmico.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "inmersion-pelo-a-pelo.html" });
}
