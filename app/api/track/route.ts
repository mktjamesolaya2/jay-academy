import { NextResponse } from "next/server";
import { recordVisit } from "@/lib/analytics-store";
import { rateLimit, tooManyRequests, isSameOrigin } from "@/lib/rate-limit";

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Descobre a origem do tráfego a partir do utm_source ou do referrer. */
function classifySource(referrer: string, utm: string, host: string): string {
  const u = (utm || "").toLowerCase().trim();
  if (u) {
    if (u.includes("whats")) return "WhatsApp";
    if (u.includes("insta") || u === "ig") return "Instagram";
    if (u.includes("face") || u === "fb" || u === "meta") return "Facebook";
    if (u.includes("google")) return "Google";
    if (u.includes("youtube") || u === "yt") return "YouTube";
    if (u.includes("tiktok")) return "TikTok";
    return cap(u);
  }
  const r = (referrer || "").trim();
  if (!r) return "Direto";
  try {
    const h = new URL(r).hostname.replace(/^www\./, "").toLowerCase();
    if (h.includes(host)) return "Direto";
    if (h.includes("google")) return "Google";
    if (h.includes("instagram")) return "Instagram";
    if (h.includes("facebook") || h.includes("fb.")) return "Facebook";
    if (h.includes("whatsapp") || h.includes("wa.me") || h.includes("l.wl.co"))
      return "WhatsApp";
    if (h.includes("youtube") || h.includes("youtu.be")) return "YouTube";
    if (h.includes("tiktok")) return "TikTok";
    if (h.includes("t.co") || h.includes("twitter") || h.includes("x.com"))
      return "Twitter/X";
    if (h.includes("bing")) return "Bing";
    return h;
  } catch {
    return "Outros";
  }
}

export async function POST(req: Request) {
  try {
    // Beacon de visita — permissivo, mas trava flood óbvio por IP.
    if (!(await rateLimit("track", req, 60, 60)).ok) {
      return tooManyRequests() as NextResponse;
    }
    // Só conta visita vinda das nossas próprias páginas: sem isso, qualquer
    // site inflava o analytics de qualquer slug. `allowEmpty` porque o beacon
    // usa fetch keepalive, que às vezes vai sem Origin/Referer.
    if (!isSameOrigin(req, true)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const body = (await req.json().catch(() => ({}))) as {
      slug?: string;
      referrer?: string;
      utm?: string;
    };
    const slug = (body.slug || "").toString().slice(0, 200).trim();
    if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

    const host = new URL(req.url).hostname.replace(/^www\./, "");
    const source = classifySource(body.referrer || "", body.utm || "", host);
    await recordVisit(slug, source, new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
