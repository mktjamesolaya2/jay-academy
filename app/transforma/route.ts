import { serveLp } from "@/lib/serve-lp";

// JAY TRANSFORMA — evento online gratuito de 3 dias. LP escrita à mão (não vem do
// WP, então sem de-lazy), servida de lp-html/ com tracking canônico via serveLp().
// A captação é o formulário .elementor-form em #inscricao: a ponte injetada pelo
// serveLp manda o submit pro /api/elementor-form (CRM + inbox /leads).
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "transforma.html" });
}
