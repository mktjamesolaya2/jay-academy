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
 * As formas de pedir o token. A Hotmart aceita uma ou outra dependendo da
 * versão da credencial, então tentamos em ordem.
 *
 * ⚠️ O diagnóstico e a consulta de verdade usam ESTA MESMA lista. Elas já
 * ficaram diferentes uma vez: o teste passava (porque tentava três jeitos) e a
 * consulta falhava (porque usava só um) — "funciona no teste e quebra no uso"
 * é exatamente o tipo de armadilha que some sem ninguém ver.
 */
/**
 * Qual jogo de credenciais usar.
 *
 * ⚠️ O sufixo `_2` existe pra TESTAR uma credencial nova sem tocar na que está
 * em produção. O suporte da Hotmart afirma que criar uma credencial já dá
 * acesso às APIs de Sales e Club — a nossa não tem, e a única forma de saber
 * quem está certo é experimentar com uma segunda, em paralelo.
 *
 * Credencial nova não invalida a antiga, então isso não derruba nada. E o
 * segredo continua onde tem que estar: em variável de ambiente, nunca na URL
 * (que ia parar em log de acesso).
 */
export type JogoDeCredenciais = "principal" | "segunda";

function credenciais(jogo: JogoDeCredenciais) {
  const sufixo = jogo === "segunda" ? "_2" : "";
  return {
    id: (process.env[`HOTMART_CLIENT_ID${sufixo}`] ?? "").trim(),
    secret: (process.env[`HOTMART_CLIENT_SECRET${sufixo}`] ?? "").trim(),
    basic: (process.env[`HOTMART_BASIC${sufixo}`] ?? "").trim().replace(/^basic\s+/i, ""),
  };
}

function formasDePedirToken(jogo: JogoDeCredenciais = "principal") {
  const { id, secret, basic: basicVar } = credenciais(jogo);
  const calculado = Buffer.from(`${id}:${secret}`).toString("base64");
  const params = { grant_type: "client_credentials", client_id: id, client_secret: secret };
  return [
    { como: "parametros na URL + Basic da variavel", naUrl: true, basic: basicVar, params },
    { como: "parametros no corpo + Basic da variavel", naUrl: false, basic: basicVar, params },
    { como: "parametros na URL + Basic calculado por nos", naUrl: true, basic: calculado, params },
  ];
}

async function tentarForma(f: ReturnType<typeof formasDePedirToken>[number]) {
  const url = new URL(TOKEN_URL);
  const corpo = new URLSearchParams(f.params);
  if (f.naUrl) for (const [k, v] of corpo) url.searchParams.set(k, v);
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${f.basic}`,
      ...(f.naUrl ? {} : { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    body: f.naUrl ? undefined : corpo,
    signal: AbortSignal.timeout(15000),
  });
  return r;
}

async function pegarToken(jogo: JogoDeCredenciais = "principal"): Promise<string> {
  // ⚠️ O cache é só da principal. A segunda é de teste, roda pouco, e cachear
  // ela abriria a porta pra devolver o token errado pra consulta de verdade.
  if (jogo === "principal" && cache && cache.expiraEm > Date.now() + 60_000) {
    return cache.valor;
  }

  const erros: string[] = [];
  for (const f of formasDePedirToken(jogo)) {
    try {
      const r = await tentarForma(f);
      if (!r.ok) {
        erros.push(`${f.como}: ${r.status}`);
        continue;
      }
      const d = (await r.json()) as { access_token?: string; expires_in?: number };
      if (!d.access_token) {
        erros.push(`${f.como}: sem token na resposta`);
        continue;
      }
      if (jogo !== "principal") return d.access_token;
      cache = {
        valor: d.access_token,
        expiraEm: Date.now() + (d.expires_in ?? 3600) * 1000,
      };
      return cache.valor;
    } catch (e) {
      erros.push(`${f.como}: ${e instanceof Error ? e.message : "erro"}`);
    }
  }
  throw new Error(`Hotmart recusou as credenciais — ${erros.join(" | ")}`);
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

/**
 * Diagnóstico das credenciais, sem imprimir segredo nenhum.
 *
 * ⚠️ Só o formato: tamanho, se parece base64, se o BASIC bate com
 * `base64(client_id:client_secret)`. Um 401 seco não diz qual das três chaves
 * está errada — e ficar chutando, com o James copiando e colando de novo a cada
 * tentativa, é o pior jeito de descobrir.
 *
 * Também tenta as duas formas de mandar os parâmetros (na URL e no corpo),
 * porque a Hotmart aceita uma delas dependendo da versão.
 */
export async function testarCredenciais(): Promise<{
  ok: boolean;
  erro?: string;
  formato?: Record<string, unknown>;
  tentativas?: Array<{ como: string; status: number; resposta: string }>;
}> {
  if (!temCredenciais()) {
    return {
      ok: false,
      erro: "Faltam HOTMART_CLIENT_ID, SECRET ou BASIC.",
      formato: {
        temClientId: !!process.env.HOTMART_CLIENT_ID,
        temSecret: !!process.env.HOTMART_CLIENT_SECRET,
        temBasic: !!process.env.HOTMART_BASIC,
      },
    };
  }

  const id = (process.env.HOTMART_CLIENT_ID ?? "").trim();
  const secret = (process.env.HOTMART_CLIENT_SECRET ?? "").trim();
  const basicBruto = (process.env.HOTMART_BASIC ?? "").trim();
  const basicSoValor = basicBruto.replace(/^basic\s+/i, "");
  const calculado = Buffer.from(`${id}:${secret}`).toString("base64");

  const formato = {
    clientIdTamanho: id.length,
    secretTamanho: secret.length,
    basicComecaComPalavraBasic: /^basic\s/i.test(basicBruto),
    basicTamanho: basicSoValor.length,
    basicPareceBase64: /^[A-Za-z0-9+/=]+$/.test(basicSoValor),
    basicBateComIdESecret: basicSoValor === calculado,
  };

  const tentativas: Array<{ como: string; status: number; resposta: string }> = [];
  for (const f of formasDePedirToken()) {
    try {
      const r = await tentarForma(f);
      const texto = await r.text().catch(() => "");
      tentativas.push({ como: f.como, status: r.status, resposta: texto.slice(0, 160) });
      if (r.ok) return { ok: true, formato, tentativas };
    } catch (e) {
      tentativas.push({
        como: f.como,
        status: 0,
        resposta: e instanceof Error ? e.message : "erro",
      });
    }
  }

  return { ok: false, erro: "Nenhuma forma funcionou", formato, tentativas };
}

/** O token, pra sonda de endereços usar o mesmo caminho de autenticação. */
export async function pegarTokenPublico(
  jogo: JogoDeCredenciais = "principal"
): Promise<string> {
  return await pegarToken(jogo);
}

/** Existe uma segunda credencial configurada pra testar? */
export function temSegundaCredencial(): boolean {
  const c = credenciais("segunda");
  return !!(c.id && c.secret && c.basic);
}
