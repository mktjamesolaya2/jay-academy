import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Cópia recriada (limpa e editável) do site Wix jamesolaya.com.br — pra modificar.
// Servida a partir de lp-html/jamesolaya.html. Edito o arquivo e dou push → vai pro ar.

export const dynamic = "force-static";

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "lp-html", "jamesolaya.html"),
    "utf8"
  );
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
