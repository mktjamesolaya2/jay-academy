// Meta Conversions API (server-side). Espelha o que o Pixel Cat do WordPress
// já fazia via admin-ajax.php (fca_pc_capi_event) — precisa continuar existindo
// pra não regredir o volume de PageView "servidor" que já roda hoje no WP.
// No-op silencioso se META_ACCESS_TOKEN não estiver configurada (não pode
// quebrar build/preview sem a env).

const META_PIXEL_ID = "1841776429524244";
const GRAPH_URL = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;

type CapiUserData = Record<string, string | undefined>;

export async function sendMetaCapiEvent(evt: {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  req?: Request;
  userData?: CapiUserData;
}): Promise<void> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return;

  const userData: CapiUserData = { ...evt.userData };
  if (evt.req) {
    const fwd = evt.req.headers.get("x-forwarded-for");
    if (fwd) userData.client_ip_address = fwd.split(",")[0].trim();
    const ua = evt.req.headers.get("user-agent");
    if (ua) userData.client_user_agent = ua;
  }

  const payload = {
    data: [
      {
        event_name: evt.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: evt.eventId,
        event_source_url: evt.eventSourceUrl,
        action_source: "website",
        user_data: userData,
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  try {
    const res = await fetch(`${GRAPH_URL}?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("meta-capi: request failed", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("meta-capi: fetch error", err);
  }
}
