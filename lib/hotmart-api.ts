import "server-only";

/**
 * Conversa com a API da Hotmart.
 *
 * ⚠️ Isto é o complemento do webhook, e resolve o que ele não cobre: o webhook
 * só conta o que acontece **de agora em diante**. Quem comprou antes de a gente
 * conectar não existe pro portal — e é justamente a aluna com acesso prestes a
 * vencer que mais aparece no suporte. A API alcança o histórico.
 *
 * ⚠️ Só LEITURA. O portal consulta compra; não libera, não cancela e não
 * estorna nada. Se um dia precisar agir, que seja uma decisão consciente e não
 * um efeito colateral de já estar conectado.
 */

const TOKEN_URL = "https://api-sec-vlc.hotmart.com/security/oauth/token";
const API = "https://developers.hotmart.com/payments/api/v1";

type Token = { valor: string; expiraEm: number };
let cache: Token | null = null;

export function temCredenciais(): boolean {
  return !!(
    process.env.HOTMART_CLIENT_ID &&
    process.env.HOTMART_CLIENT_SECRET &&
    process.env.HOTMART_BASIC
  );
}

/**
 * O `Basic` da Hotmart vem com a palavra "Basic" na frente na tela dela.
 * Aceita dos dois jeitos pra não depender de quem copiou lembrar disso.
 */
function cabecalhoBasic(): string {
  const b = (process.env.HOTMART_BASIC ?? "").trim();
  return /^basic\s/i.test(b) ? b : `Basic ${b}`;
}

async function pegarToken(): Promise<string> {
  // Reaproveita enquanto vale — com 60s de folga pra não usar um que expira
  // no meio da requisição seguinte.
  if (cache && cache.expiraEm > Date.now() + 60_000) return cache.valor;

  const url = new URL(TOKEN_URL);
  url.searchParams.set("grant_type", "client_credentials");
  url.searchParams.set("client_id", process.env.HOTMART_CLIENT_ID ?? "");
  url.searchParams.set("client_secret", process.env.HOTMART_CLIENT_SECRET ?? "");

  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: cabecalhoBasic() },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Hotmart recusou as credenciais (${r.status}): ${t.slice(0, 200)}`);
  }
  const d = (await r.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) throw new Error("Hotmart não devolveu token.");
  cache = {
    valor: d.access_token,
    expiraEm: Date.now() + (d.expires_in ?? 3600) * 1000,
  };
  return cache.valor;
}

export type VendaHotmart = {
  produto: string;
  compradaEm: string;
  situacao: string;
  comprador: string;
};

/** As compras de um e-mail, direto da Hotmart (inclui histórico antigo). */
export async function vendasDoEmail(email: string): Promise<VendaHotmart[]> {
  const token = await pegarToken();
  const url = new URL(`${API}/sales/history`);
  url.searchParams.set("buyer_email", email.trim().toLowerCase());
  url.searchParams.set("max_results", "50");

  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Consulta falhou (${r.status}): ${t.slice(0, 200)}`);
  }
  const d = (await r.json()) as { items?: any[] };

  return (d.items ?? []).map((i) => ({
    produto: String(i?.product?.name ?? "curso"),
    compradaEm: new Date(
      i?.purchase?.order_date ?? i?.purchase?.approved_date ?? Date.now()
    ).toISOString(),
    situacao: String(i?.purchase?.status ?? "").toLowerCase(),
    comprador: String(i?.buyer?.name ?? ""),
  }));
}

/** Só confere se as credenciais funcionam, sem consultar dado de ninguém. */
export async function testarCredenciais(): Promise<{ ok: boolean; erro?: string }> {
  try {
    if (!temCredenciais()) {
      return { ok: false, erro: "Faltam HOTMART_CLIENT_ID, SECRET ou BASIC." };
    }
    await pegarToken();
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro" };
  }
}
