import { serveLp } from "@/lib/serve-lp";

// Magic Shadow — HTML editável no KV (via /lps/magic-shadow/edit-visual) +
// tracking canônico via serveLp(). Cache curto (60s) pra edições aparecerem
// rápido — antes era no-store, que forçava KV + CAPI em série a cada visita.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return serveLp(req, { embedded: "magicshadow" });
}
