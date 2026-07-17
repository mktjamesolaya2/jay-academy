import { serveLp } from "@/lib/serve-lp";

// Basic Magic Shadow — LP migrada do WordPress, servida de lp-html/ com de-lazy
// (assets no wpmirror) + tracking canônico via serveLp(). Editar o HTML e dar
// push → vai pro ar. Rota estática tem prioridade sobre o [slug] dinâmico.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "basic-magic-shadow.html", delazy: true });
}
