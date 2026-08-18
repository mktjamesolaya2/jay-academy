import "server-only";
import { pegarTokenPublico } from "./hotmart-api";

/**
 * Sonda quais endereços da API da Hotmart existem.
 *
 * ⚠️ **Só GET.** Nada aqui executa ação — não libera, não reenvia, não cancela.
 * A pergunta é "esse endereço existe?", e a resposta vem do próprio código HTTP:
 *
 * - `404` → não existe
 * - `405` → **existe**, mas pede outro método (POST/PUT). É o sinal que
 *   interessa pra descobrir uma ação sem executá-la.
 * - `200`/`400`/`403` → existe
 *
 * Existe porque a documentação da Hotmart carrega por JavaScript e veio vazia
 * na leitura automática. Sondar é chute educado — o que der 405 ou 200 é
 * pista, o resto é silêncio, e isso vai dito no resultado.
 */

const CANDIDATOS = [
  // Club (área de membros) — onde um "reenviar acesso" faria sentido
  "https://developers.hotmart.com/club/api/v1/users",
  "https://developers.hotmart.com/club/api/v1/modules",
  "https://developers.hotmart.com/club/api/v1/users/resend-access",
  "https://developers.hotmart.com/club/api/v1/users/access",
  "https://developers.hotmart.com/club/api/v1/access",
  // Payments — onde vive o histórico de vendas que já usamos
  "https://developers.hotmart.com/payments/api/v1/sales/history",
  "https://developers.hotmart.com/payments/api/v1/sales/users",
  "https://developers.hotmart.com/payments/api/v1/subscriptions",
  "https://developers.hotmart.com/payments/api/v1/sales/resend-access",
  "https://developers.hotmart.com/payments/api/v1/purchases/resend",
  "https://developers.hotmart.com/payments/api/v1/access/resend",
];

export type Achado = {
  endereco: string;
  status: number;
  leitura: string;
  /** O que a Hotmart respondeu — é o que desempata 403 de parâmetro faltando. */
  resposta?: string;
};

function traduzir(status: number): string {
  if (status === 404) return "não existe";
  if (status === 405) return "EXISTE — mas pede outro método (seria uma ação)";
  if (status === 200) return "EXISTE e respondeu";
  if (status === 400) return "EXISTE — faltou parâmetro";
  if (status === 403) return "EXISTE — sem permissão nesta credencial";
  if (status === 401) return "token não aceito aqui";
  return `respondeu ${status}`;
}

/**
 * Põe o `subdomain` nos endereços do Club.
 *
 * ⚠️ A API do Club exige saber **qual área de membros**: o subdomain é o
 * pedaço que aparece na URL pública (`hotmart.com/club/<subdomain>`). Sem ele
 * a primeira sondagem devolveu 403 em `/users`, e 403 se lê como "sem
 * permissão" — o que mandaria alguém caçar um escopo que não existe (as
 * credenciais da Hotmart são de conta inteira, não têm tela de permissão).
 * Antes de concluir qualquer coisa sobre permissão, é preciso perguntar
 * direito.
 */
function comSubdominio(endereco: string, subdomain?: string): string {
  if (!subdomain || !endereco.includes("/club/")) return endereco;
  const u = new URL(endereco);
  u.searchParams.set("subdomain", subdomain);
  return u.toString();
}

export async function sondar(subdomain?: string): Promise<Achado[]> {
  const token = await pegarTokenPublico();
  const achados: Achado[] = [];
  for (const bruto of CANDIDATOS) {
    const endereco = comSubdominio(bruto, subdomain);
    try {
      const r = await fetch(endereco, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(12000),
      });
      // ⚠️ O corpo importa: é ele que separa "sem permissão" de "faltou
      // parâmetro" quando os dois chegam como 403. Cortado, porque não é pra
      // despejar resposta inteira numa tela de diagnóstico.
      const corpo = (await r.text().catch(() => "")).replace(/s+/g, " ").slice(0, 220);
      achados.push({
        endereco,
        status: r.status,
        leitura: traduzir(r.status),
        ...(corpo ? { resposta: corpo } : {}),
      });
    } catch (e) {
      achados.push({
        endereco,
        status: 0,
        leitura: e instanceof Error ? e.message : "erro de rede",
      });
    }
  }
  return achados;
}

/* ── por que a consulta de vendas dá 400 ─────────────────────────────────── */

/**
 * Descobre qual combinação de parâmetros o `sales/history` aceita.
 *
 * ⚠️ Existe porque a consulta respondia **400 `invalid_parameter`** pra todo
 * e-mail — e o erro era engolido, virava lista vazia, e o suporte dizia
 * "procurei e não achei compra com esse e-mail". Ou seja: negava a compra de
 * quem pagou, por causa de um parâmetro nosso.
 *
 * ⚠️ Cada tentativa é um GET de leitura. Nada aqui muda nada na conta.
 *
 * ⚠️ O e-mail é passado por quem chama, e a resposta só devolve **quantos
 * itens vieram**, nunca o conteúdo — a tela de diagnóstico não é lugar de
 * despejar dado de aluna.
 */
export async function sondarVendas(email: string): Promise<Achado[]> {
  const token = await pegarTokenPublico();
  const base = "https://developers.hotmart.com/payments/api/v1/sales/history";

  const agora = Date.now();
  const doisAnos = agora - 1000 * 60 * 60 * 24 * 730;

  const tentativas: Array<[string, Record<string, string>]> = [
    ["só o e-mail (o que a gente faz hoje)", { buyer_email: email }],
    ["e-mail + max_results", { buyer_email: email, max_results: "50" }],
    ["e-mail + janela de 2 anos", {
      buyer_email: email,
      start_date: String(doisAnos),
      end_date: String(agora),
    }],
    ["só a janela de 2 anos", { start_date: String(doisAnos), end_date: String(agora) }],
    ["sem nenhum parâmetro", {}],
    ["transaction_status=APPROVED + janela", {
      buyer_email: email,
      transaction_status: "APPROVED",
      start_date: String(doisAnos),
      end_date: String(agora),
    }],
  ];

  const achados: Achado[] = [];
  for (const [nome, params] of tentativas) {
    const u = new URL(base);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    try {
      const r = await fetch(u, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      });
      const cru = await r.text().catch(() => "");
      let leitura = traduzir(r.status);
      if (r.ok) {
        // Só a contagem. O que veio é dado de aluna e não sai daqui.
        try {
          const itens = (JSON.parse(cru)?.items ?? []).length;
          leitura = `FUNCIONOU — ${itens} ${itens === 1 ? "compra" : "compras"}`;
        } catch {
          leitura = "FUNCIONOU — resposta não era o JSON esperado";
        }
      }
      achados.push({
        endereco: nome,
        status: r.status,
        leitura,
        ...(r.ok ? {} : { resposta: cru.replace(/\s+/g, " ").slice(0, 180) }),
      });
    } catch (e) {
      achados.push({
        endereco: nome,
        status: 0,
        leitura: e instanceof Error ? e.message : "erro de rede",
      });
    }
  }
  return achados;
}
