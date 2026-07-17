import { serveLp } from "@/lib/serve-lp";

// PMU CLASS — skeleton estático (SPA); conteúdo editável (whatsappLink,
// hotmartUrl etc.) é puxado em runtime via /api/lp-content/pmuclass. Servida de
// lp-html/ como está (sem de-lazy) + tracking canônico via serveLp() — o
// listener de WhatsApp/Hotmart é delegado no document (capture), cobrindo os
// links que a SPA insere depois do load.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "pmuclass.html" });
}
