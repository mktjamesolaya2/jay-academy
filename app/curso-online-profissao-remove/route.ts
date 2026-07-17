import { serveLp } from "@/lib/serve-lp";

// Profissão Remove — LP servida de lp-html/ com de-lazy + tracking canônico via
// serveLp(). Editar o HTML e dar push → vai pro ar. Rota estática tem
// prioridade sobre o [slug] dinâmico (que serviria a versão antiga do KV).
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "curso-online-profissao-remove.html", delazy: true });
}
