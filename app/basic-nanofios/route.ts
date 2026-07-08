import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { withGoogleTag } from "@/lib/google-tag";

// Página Basic NanoFios recriada como LP custom (antes era servida do KV via
// [slug] dinâmico e não dava pra editar por código). Agora servida a partir de
// um arquivo HTML no repo (lp-html/basic-nanofios.html). Rota estática tem
// prioridade sobre o [slug] dinâmico. Edito o arquivo aqui e dou push → vai pro ar.

export const dynamic = "force-static";

export async function GET() {
  const raw = await readFile(
    path.join(process.cwd(), "lp-html", "basic-nanofios.html"),
    "utf8"
  );
  const html = withGoogleTag(raw);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
