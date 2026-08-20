import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * A página da Jay Clinic — servida de `lp-html/clinica.html`.
 *
 * Edito o arquivo e dou push → vai pro ar. Mesmo caminho da /academy e da
 * /jamesolaya, de propósito: as três são da mesma casa e mudam juntas.
 *
 * ⚠️ Em construção. O `noindex` está no HTML e sai no dia de publicar.
 */

export const dynamic = "force-static";

export async function GET() {
  const html = await readFile(
    path.join(process.cwd(), "lp-html", "clinica.html"),
    "utf8"
  );
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
