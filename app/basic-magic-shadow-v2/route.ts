import { serveLp } from "@/lib/serve-lp";

// Basic Magic Shadow v2 — cópia fiel da LP do WordPress reconstruída em HTML/CSS/JS
// vanilla self-contained (lp-html/basic-magic-shadow-v2.html). Sem `delazy`: esse
// pipeline existe só pro export do Elementor, que tem os atributos do WP-Rocket.
// Roda em paralelo com a v1 até ser aprovada e virar a oficial.
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "basic-magic-shadow-v2.html" });
}
