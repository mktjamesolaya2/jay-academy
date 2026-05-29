import { NextResponse } from "next/server";
import { resolveEmbeddedHtml } from "@/lib/embedded-html-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const html = await resolveEmbeddedHtml("magicshadow");
  if (!html) {
    return new NextResponse("Página não encontrada", { status: 404 });
  }
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=15, s-maxage=15",
    },
  });
}
