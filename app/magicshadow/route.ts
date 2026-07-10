import { NextResponse } from "next/server";
import { resolveEmbeddedHtml } from "@/lib/embedded-html-store";
import { withTracking } from "@/lib/meta-tracking";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const raw = await resolveEmbeddedHtml("magicshadow");
  if (!raw) {
    return new NextResponse("Página não encontrada", { status: 404 });
  }
  const html = await withTracking(raw, {
    isProductPage: true,
    eventSourceUrl: req.url,
    req,
  });
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
