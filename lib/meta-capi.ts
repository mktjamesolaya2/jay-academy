// Meta Conversions API (server-side). Espelha o que o Pixel Cat do WordPress
// já fazia via admin-ajax.php (fca_pc_capi_event) — precisa continuar existindo
// pra não regredir o volume de PageView "servidor" que já roda hoje no WP.
// No-op silencioso se META_ACCESS_TOKEN não estiver configurada (não pode
// quebrar build/preview sem a env).

import { clientIp } from "./rate-limit-core";
// ⚠️ IMPORTADO, não copiado. Este id já morou aqui como uma segunda constante
// igual à de lib/meta-tracking.ts — e duas constantes iguais por coincidência
// é uma bomba-relógio: trocar o pixel e esquecer uma manda o navegador pra um
// pixel e o servidor pra outro. A dedup por event_id morre e os números ficam
// errados sem nenhum sintoma. O teste de lib/tracking-clean.test.ts trava isso.
import { META_CAPI_URL } from "./meta-pixel";


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
    // clientIp cobre x-forwarded-for E x-real-ip; devolve "unknown" quando não
    // acha nenhum dos dois — nesse caso é melhor omitir do que mandar lixo,
    // que a Meta rejeitaria como IP inválido.
    const ip = clientIp(evt.req);
    if (ip && ip !== "unknown") userData.client_ip_address = ip;
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
    const res = await fetch(`${META_CAPI_URL}?access_token=${encodeURIComponent(token)}`, {
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
