import { serveLp } from "@/lib/serve-lp";

// Encontro de Especialistas — por enquanto só um "Em breve" pra reservar o
// endereço divulgado. Quando a LP do evento existir, é só trocar o conteúdo de
// lp-html/encontro-de-especialistas.html (e tirar o noindex de lá).
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "encontro-de-especialistas.html" });
}
