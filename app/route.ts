import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Home pública provisória do novo domínio. Por enquanto reutiliza o site
// institucional editável que também está disponível em /jamesolaya.
// O login administrativo continua exclusivamente em /login.
export const dynamic = "force-static";

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "lp-html", "jamesolaya.html"),
    "utf8"
  );

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
