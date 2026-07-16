import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { withTracking } from "@/lib/meta-tracking";

// Página redesenhada da Fio a Fio Realista, agora servida na URL oficial
// /metodo-fio-a-fio-by-james-olaya (substitui /fio-a-fio-realista, que redireciona
// pra cá). Lê o HTML do repositório (lp-html/metodo-fio-a-fio-by-james-olaya.html).
// Rota estática tem prioridade sobre o dinâmico [slug].
// Edito o arquivo aqui no código e dou push → vai pro ar.

export const dynamic = "force-static";

export async function GET(req: Request) {
  const raw = await readFile(
    path.join(process.cwd(), "lp-html", "metodo-fio-a-fio-by-james-olaya.html"),
    "utf8"
  );
  const html = await withTracking(raw, {
    isProductPage: true,
    eventSourceUrl: req.url,
    req,
  });
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
