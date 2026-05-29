import { NextResponse } from "next/server";
import {
  loadLpContent,
  PMU_CLASS_DEFAULT,
} from "@/lib/lp-content-store";

type Params = Promise<{ slug: string }>;

const FALLBACKS: Record<string, unknown> = {
  pmuclass: PMU_CLASS_DEFAULT,
};

export async function GET(_req: Request, { params }: { params: Params }) {
  const { slug } = await params;
  const fallback = FALLBACKS[slug] ?? {};
  const content = await loadLpContent<unknown>(slug, fallback);

  return NextResponse.json(content, {
    headers: {
      // CORS aberto: o app embutido em /pmuclass faz fetch deste endpoint
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      // Cache curto pra mudanças refletirem rápido
      "Cache-Control": "public, max-age=15, s-maxage=15",
    },
  });
}
