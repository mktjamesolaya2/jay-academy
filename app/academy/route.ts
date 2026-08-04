import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// LP de apresentação do Jay Academy. Servida de lp-html/academy.html —
// edito o arquivo e dou push → vai pro ar. (Em construção: por ora só a hero.)

export const dynamic = "force-static";

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "lp-html", "academy.html"),
    "utf8"
  );
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
