import { serveLp } from "@/lib/serve-lp";

// Cursos presenciais do James na Espanha, fev/2027 (página em espanhol). Sem
// checkout: os botões vão pro WhatsApp de cursos. Prévia com noindex no HTML.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "jamesespanhafev2027.html" });
}
