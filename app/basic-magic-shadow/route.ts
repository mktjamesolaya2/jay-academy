import { serveLp } from "@/lib/serve-lp";

// Basic Magic Shadow — LP reconstruída em HTML/CSS/JS vanilla self-contained
// (nasceu como "v2" e foi promovida ao slug oficial em 29/07, aposentando o
// export do Elementor). Sem `delazy`: esse pipeline existe só pro HTML do WP,
// que tem os atributos do WP-Rocket. Tracking canônico via serveLp(). Editar o
// HTML e dar push → vai pro ar. Rota estática tem prioridade sobre o [slug]
// dinâmico. Assets ficam em public/lp/basic-magic-shadow-v2/ (nome mantido pra
// não reescrever as 42 referências do HTML).
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "basic-magic-shadow.html" });
}
