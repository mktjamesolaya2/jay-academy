import { NextResponse } from "next/server";
import { resolveEmbeddedHtml } from "@/lib/embedded-html-store";
import { withGoogleTag } from "@/lib/google-tag";

export const dynamic = "force-dynamic";

export async function GET() {
  const raw = await resolveEmbeddedHtml("magicshadow");
  if (!raw) {
    return new NextResponse("Página não encontrada", { status: 404 });
  }
  const html = withGoogleTag(raw);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
