import { serveLp } from "@/lib/serve-lp";

// Método Shadow PRO — LP recriada (a original do WP foi excluída), servida de
// lp-html/ como está (sem de-lazy) + tracking canônico via serveLp(). Rota
// estática tem prioridade sobre o [slug] dinâmico.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "metodo-shadow-pro.html" });
}
