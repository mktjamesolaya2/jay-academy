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

export async function sondar(): Promise<Achado[]> {
  const token = await pegarTokenPublico();
  const achados: Achado[] = [];
  for (const endereco of CANDIDATOS) {
    try {
      const r = await fetch(endereco, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(12000),
      });
      achados.push({ endereco, status: r.status, leitura: traduzir(r.status) });
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
