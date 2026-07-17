import { serveLp } from "@/lib/serve-lp";

// Jayo Laser — HTML editável no KV (via /lps/laser/edit-visual) + tracking
// canônico via serveLp(). Cache curto (60s) pra edições aparecerem rápido.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return serveLp(req, { embedded: "laser" });
}
