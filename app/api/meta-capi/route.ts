import { NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/meta-capi";

// Endpoint genérico pra reforço server-side de eventos disparados pelo cliente
// (fora do fluxo de PageView, que já é enviado direto por withMetaPixelBootstrap
// no momento da renderização — ver lib/meta-tracking.ts).
export async function POST(req: Request) {
  let body: {
    eventName?: string;
    eventId?: string;
    eventSourceUrl?: string;
    userData?: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!body.eventName || !body.eventId || !body.eventSourceUrl) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await sendMetaCapiEvent({
    eventName: body.eventName,
    eventId: body.eventId,
    eventSourceUrl: body.eventSourceUrl,
    req,
    userData: body.userData,
  });

  return NextResponse.json({ ok: true });
}
