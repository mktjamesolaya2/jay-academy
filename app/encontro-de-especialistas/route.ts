import { serveLp } from "@/lib/serve-lp";

// Encontro de Especialistas — LP de captação lida por QR Code. O formulário
// (.elementor-form) é interceptado pela ponte que o serveLp injeta e vai pro
// /api/elementor-form: CRM + inbox /leads, e depois o grupo de WhatsApp
// (GRUPO_WHATSAPP_POR_LP, em lib/lp-funil.ts).
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "encontro-de-especialistas.html" });
}
