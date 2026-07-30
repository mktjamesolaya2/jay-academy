import { NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import {
  rateLimit,
  tooManyRequests,
  payloadTooLarge,
  isSameOrigin,
} from "@/lib/rate-limit";

// Reforço server-side de eventos disparados pelo NOSSO front (o PageView por
// visita das LPs, ver lib/meta-tracking.ts). É público por necessidade (o
// browser chama), então blindado contra envenenamento de conversão:
//  - só eventos da allowlist (nada de Purchase falso arbitrário)
//  - só do mesmo site (Origin/Referer batem com o host)
//  - rate-limit por IP
const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Lead",
  "InitiateCheckout",
  "WhatsApp",
]);

// O corpo vem do browser, então o user_data também é allowlist: só os cookies
// do próprio Pixel. Sem isso alguém poderia injetar em/ph/external_id falsos e
// envenenar o público de correspondência da conta.
const ALLOWED_USER_DATA = ["fbp", "fbc"] as const;

export async function POST(req: Request) {
  if (payloadTooLarge(req, 16 * 1024)) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await rateLimit("meta-capi", req, 60, 60)).ok) {
    return tooManyRequests() as NextResponse;
  }

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
  if (!ALLOWED_EVENTS.has(body.eventName)) {
    return NextResponse.json({ error: "event not allowed" }, { status: 400 });
  }

  const userData: Record<string, string> = {};
  for (const k of ALLOWED_USER_DATA) {
    const v = body.userData?.[k];
    if (typeof v === "string" && v) userData[k] = v.slice(0, 256);
  }

  await sendMetaCapiEvent({
    eventName: body.eventName,
    eventId: body.eventId,
    eventSourceUrl: body.eventSourceUrl,
    req,
    userData,
  });

  return NextResponse.json({ ok: true });
}
