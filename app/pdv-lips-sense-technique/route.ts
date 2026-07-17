import { serveLp } from "@/lib/serve-lp";

// Lips Sense Technique — LP servida de lp-html/ com de-lazy + tracking canônico
// via serveLp(). Editar o HTML e dar push → vai pro ar. Rota estática tem
// prioridade sobre o [slug] dinâmico (substitui a versão do KV).
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "pdv-lips-sense-technique.html", delazy: true });
}
