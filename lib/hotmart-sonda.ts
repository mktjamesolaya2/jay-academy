import "server-only";
import { pegarTokenPublico, type JogoDeCredenciais } from "./hotmart-api";

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
  // ⚠️ A FAMÍLIA DO QUE FUNCIONA. O /subscriptions responde 200 com a mesma
  // credencial, então o que estiver perto dele tem chance de responder
  // também — e assinatura tem compra pendurada. Se um destes abrir, a gente
  // alcança dado de compra sem depender do /sales/.
  "https://developers.hotmart.com/payments/api/v1/subscriptions",
  "https://developers.hotmart.com/payments/api/v1/subscriptions/summary",
  "https://developers.hotmart.com/payments/api/v1/subscriptions/purchases",
  "https://developers.hotmart.com/payments/api/v1/subscriptions/transactions",
  // Outros vizinhos do Payments, pra desenhar o contorno do que é permitido.
  "https://developers.hotmart.com/payments/api/v1/sales/commissions",
  "https://developers.hotmart.com/payments/api/v1/sales/price-details",
  "https://developers.hotmart.com/payments/api/v1/products",
  "https://developers.hotmart.com/payments/api/v1/coupon",
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

export async function sondar(
  subdomain?: string,
  jogo: JogoDeCredenciais = "principal"
): Promise<Achado[]> {
  const token = await pegarTokenPublico(jogo);
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
export async function sondarVendas(
  email: string,
  jogo: JogoDeCredenciais = "principal"
): Promise<Achado[]> {
  const token = await pegarTokenPublico(jogo);
  const base = "https://developers.hotmart.com/payments/api/v1/sales/history";

  /**
   * ⚠️ A primeira rodada testou só PARÂMETRO, e todas as seis deram 400 —
   * inclusive a requisição sem parâmetro nenhum. Isso descarta a hipótese: um
   * GET pelado com token válido não dá 400 por causa de parâmetro.
   *
   * Então esta rodada mexe na ESTRUTURA: cabeçalho (o cliente de referência do
   * Pipedream manda `Content-Type: application/json`, a gente não mandava),
   * versão da API e endereço vizinho. O `subscriptions` responde 200 com o
   * mesmo token, então o problema é deste endereço, não da credencial.
   */

  const agora = Date.now();
  const doisAnos = agora - 1000 * 60 * 60 * 24 * 730;

  type Tentativa = {
    nome: string;
    url?: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  };

  const JSON_H = { "Content-Type": "application/json" };

  const tentativas: Tentativa[] = [
    { nome: "1) com Content-Type: application/json (como o Pipedream faz)", params: { buyer_email: email }, headers: JSON_H },
    { nome: "2) com Accept: application/json", params: { buyer_email: email }, headers: { Accept: "application/json" } },
    { nome: "3) v2 em vez de v1", url: "https://developers.hotmart.com/payments/api/v2/sales/history", params: { buyer_email: email }, headers: JSON_H },
    { nome: "4) sales/users (o endereço vizinho)", url: "https://developers.hotmart.com/payments/api/v1/sales/users", params: { buyer_email: email }, headers: JSON_H },
    { nome: "5) sales/summary", url: "https://developers.hotmart.com/payments/api/v1/sales/summary", params: {}, headers: JSON_H },
    { nome: "6) subscriptions (este a gente SABE que funciona — é o controle)", url: "https://developers.hotmart.com/payments/api/v1/subscriptions", params: {}, headers: JSON_H },
    { nome: "7) só transaction_status, sem e-mail", params: { transaction_status: "APPROVED" }, headers: JSON_H },
  ];

  const antigas: Array<[string, Record<string, string>]> = [
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

  const todas: Tentativa[] = [
    ...tentativas,
    ...antigas.map(([nome, params]) => ({ nome, params })),
  ];

  const achados: Achado[] = [];
  for (const t of todas) {
    const nome = t.nome;
    const u = new URL(t.url ?? base);
    for (const [k, v] of Object.entries(t.params ?? {})) u.searchParams.set(k, v);
    try {
      const r = await fetch(u, {
        headers: { Authorization: `Bearer ${token}`, ...(t.headers ?? {}) },
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

/* ── o que o próprio token diz que pode ──────────────────────────────────── */

/**
 * Abre o token e mostra o que a Hotmart concedeu.
 *
 * ⚠️ O `access_token` da Hotmart é um JWT: o miolo dele é só base64, e lá
 * dentro costuma vir a lista de permissões (`scope`, `authorities`) que a
 * credencial recebeu. Se "sales" não estiver na lista, o 400 dos endereços de
 * venda para de ser mistério e vira uma frase que dá pra levar pro suporte:
 * *"minha credencial não recebeu esse escopo"*.
 *
 * ⚠️ **O token NUNCA é mostrado** — só o miolo decodificado, e sem a
 * assinatura. Quem tiver o token entra na conta; quem tiver a lista de
 * permissões não faz nada com ela.
 */
export async function permissoesDoToken(
  jogo: JogoDeCredenciais = "principal"
): Promise<Record<string, unknown>> {
  const token = await pegarTokenPublico(jogo);
  const partes = token.split(".");
  if (partes.length !== 3) {
    // Não é JWT: aí não dá pra ler nada de dentro, e isso também é resposta.
    return { formato: "não é um JWT — não dá pra ler as permissões", pedacos: partes.length };
  }

  try {
    const miolo = JSON.parse(
      Buffer.from(partes[1]!.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as Record<string, unknown>;

    // ⚠️ Lista branca: só o que ajuda a diagnosticar. Um JWT pode carregar
    // identificadores da conta que não têm por que aparecer numa tela.
    const interessa = [
      "scope",
      "scopes",
      "authorities",
      "roles",
      "client_id",
      "resource",
      "aud",
      "iss",
      "exp",
    ];
    const lido: Record<string, unknown> = {};
    for (const c of interessa) if (c in miolo) lido[c] = miolo[c];

    return {
      permissoes: lido,
      camposQueExistemNoToken: Object.keys(miolo).sort(),
      dica: "Se 'sales' não aparecer nas permissões, o 400 é falta de escopo — e isso é o que o suporte precisa liberar.",
    };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "não deu pra ler o token" };
  }
}

/* ── a porta que abriu: assinaturas ──────────────────────────────────────── */

/**
 * Descobre se dá pra procurar uma pessoa pela família de assinaturas.
 *
 * ⚠️ Achado de 19/08: enquanto todo `/sales/` responde 400, três endereços de
 * assinatura respondem **200 com dado real** — inclusive nome do produto
 * ("FIO A FIO REALISTA - JAMES OLAYA [2.0] [2024]") e data. Ou seja: existe uma
 * porta aberta pro dado de compra que não é a que a gente vinha tentando.
 *
 * Falta só uma coisa pra ela servir ao suporte: **filtrar por e-mail**. Sem
 * filtro, a lista vem inteira e não dá pra responder "a compra da Fulana".
 *
 * ⚠️ Cada tentativa é GET. A resposta mostra só **quantos itens vieram** —
 * nunca o conteúdo, que é dado de aluna.
 */
export async function sondarAssinaturas(
  email: string,
  jogo: JogoDeCredenciais = "principal"
): Promise<Achado[]> {
  const token = await pegarTokenPublico(jogo);
  const base = "https://developers.hotmart.com/payments/api/v1";

  const enderecos = [
    ["assinaturas", `${base}/subscriptions`],
    ["resumo", `${base}/subscriptions/summary`],
    ["transações", `${base}/subscriptions/transactions`],
  ] as const;

  // Os nomes que uma API costuma usar pro e-mail de quem comprou. Testar todos
  // é mais rápido que procurar numa documentação que carrega por JavaScript.
  const filtros = [
    "subscriber_email",
    "buyer_email",
    "email",
    "subscriber",
    "user_email",
  ];

  const achados: Achado[] = [];

  for (const [nome, url] of enderecos) {
    for (const filtro of filtros) {
      const u = new URL(url);
      u.searchParams.set(filtro, email);
      try {
        const r = await fetch(u, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(15000),
        });
        const cru = await r.text().catch(() => "");
        let leitura = traduzir(r.status);
        if (r.ok) {
          try {
            const itens = (JSON.parse(cru)?.items ?? []).length;
            // ⚠️ 0 item também é resposta ÚTIL: quer dizer que o filtro foi
            // aceito e essa pessoa não tem assinatura. O que não serve é o
            // filtro ser ignorado e vir a lista inteira.
            leitura = `ACEITOU o filtro — ${itens} ${itens === 1 ? "item" : "itens"}`;
          } catch {
            leitura = "200, mas a resposta não era o JSON esperado";
          }
        }
        achados.push({
          endereco: `${nome} ?${filtro}=`,
          status: r.status,
          leitura,
          ...(r.ok ? {} : { resposta: cru.replace(/\s+/g, " ").slice(0, 140) }),
        });
      } catch (e) {
        achados.push({
          endereco: `${nome} ?${filtro}=`,
          status: 0,
          leitura: e instanceof Error ? e.message : "erro de rede",
        });
      }
    }
  }

  // ⚠️ O controle: a MESMA chamada sem filtro nenhum. Se o número de itens for
  // igual ao das tentativas acima, o filtro foi ignorado — e "aceitou" seria
  // uma leitura falsa. Sem esta linha, a gente sairia daqui comemorando.
  for (const [nome, url] of enderecos) {
    try {
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15000),
      });
      const cru = await r.text().catch(() => "");
      let leitura = traduzir(r.status);
      if (r.ok) {
        try {
          const d = JSON.parse(cru);
          const itens = (d?.items ?? []).length;
          const total = d?.page_info?.total_results;
          leitura = `SEM filtro — ${itens} itens${total != null ? ` (total ${total})` : ""}`;
        } catch {}
      }
      achados.push({ endereco: `${nome} (controle, sem filtro)`, status: r.status, leitura });
    } catch {
      /* o controle falhar não invalida o resto */
    }
  }

  return achados;
}

/**
 * O FORMATO da resposta de assinaturas — nomes dos campos, não os valores.
 *
 * ⚠️ Existe pra eu parar de adivinhar. Já perdi tempo hoje montando código
 * contra um formato imaginado; o arquivo de vendas derrubou três suposições
 * minhas de uma vez. Aqui a API diz o nome dos campos dela.
 *
 * ⚠️ **Valor só de campo que não é da pessoa**: nome de produto, data e
 * situação saem inteiros porque preciso conferir o formato (milissegundos ou
 * segundos? "APPROVED" ou "aprovado"?). Qualquer coisa que cheire a
 * identificação — e-mail, nome, documento, telefone, código de assinante — sai
 * como o TIPO apenas.
 */
export async function formatoDeAssinaturas(
  email: string,
  jogo: JogoDeCredenciais = "principal"
): Promise<Record<string, unknown>> {
  const token = await pegarTokenPublico(jogo);
  const u = new URL("https://developers.hotmart.com/payments/api/v1/subscriptions/transactions");
  u.searchParams.set("subscriber_email", email);

  const r = await fetch(u, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) return { status: r.status, erro: (await r.text().catch(() => "")).slice(0, 200) };

  const d = (await r.json()) as { items?: Array<Record<string, unknown>> };
  const itens = d.items ?? [];
  if (!itens.length) return { status: 200, itens: 0, aviso: "Sem itens — tente outro e-mail." };

  const PESSOAL = /email|name|nome|document|cpf|phone|telefone|address|subscriber_code|buyer/i;

  const descrever = (o: Record<string, unknown>, prefixo = ""): Record<string, unknown> => {
    const saida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      const caminho = prefixo ? `${prefixo}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        Object.assign(saida, descrever(v as Record<string, unknown>, caminho));
      } else if (PESSOAL.test(caminho)) {
        saida[caminho] = `<${typeof v}> (escondido: é dado da pessoa)`;
      } else {
        saida[caminho] = v;
      }
    }
    return saida;
  };

  return {
    status: 200,
    itens: itens.length,
    campos: descrever(itens[0]!),
    // O segundo item ajuda a ver o que varia entre uma compra e outra.
    segundoItem: itens[1] ? descrever(itens[1]) : null,
  };
}

/* ── de onde veio a resposta ─────────────────────────────────────────────── */

/**
 * Mostra o que CADA fonte sabe sobre um e-mail, separadamente.
 *
 * ⚠️ Existe porque a resposta do suporte não denuncia a origem: a planilha
 * importada e o aviso automático gravam no MESMO lugar, e a API entra por
 * fora. Olhando só o atendimento, não dá pra saber se a consulta ao vivo está
 * funcionando ou se é a planilha respondendo por ela — e essa diferença decide
 * se o sistema continua funcionando quando ninguém exportar planilha no mês
 * que vem.
 */
export async function fontesDoEmail(email: string): Promise<Record<string, unknown>> {
  const alvo = email.trim().toLowerCase();

  const guardadas = await (async () => {
    try {
      const { comprasDoEmail } = await import("./hotmart-store");
      const c = await comprasDoEmail(alvo);
      return {
        quantas: c.length,
        // Só o que é da compra, não da pessoa.
        compras: c.map((x) => ({
          produto: x.produto,
          compradaEm: x.compradaEm.slice(0, 10),
          situacao: x.situacao,
        })),
      };
    } catch (e) {
      return { erro: e instanceof Error ? e.message : "falhou" };
    }
  })();

  const historico = await (async () => {
    try {
      const { temCredenciais, vendasDoEmail } = await import("./hotmart-api");
      if (!temCredenciais()) return { estado: "sem credenciais configuradas" };
      const v = await vendasDoEmail(alvo);
      return { estado: "RESPONDEU", quantas: v.length };
    } catch (e) {
      return { estado: "falhou", motivo: (e instanceof Error ? e.message : "").slice(0, 160) };
    }
  })();

  const assinaturas = await (async () => {
    try {
      const { temCredenciais, assinaturasDoEmail } = await import("./hotmart-api");
      if (!temCredenciais()) return { estado: "sem credenciais configuradas" };
      const v = await assinaturasDoEmail(alvo);
      return {
        estado: "RESPONDEU",
        quantas: v.length,
        compras: v.map((x) => ({
          produto: x.produto,
          compradaEm: x.compradaEm.slice(0, 10),
          situacao: x.situacao,
        })),
      };
    } catch (e) {
      return { estado: "falhou", motivo: (e instanceof Error ? e.message : "").slice(0, 160) };
    }
  })();

  return {
    email: alvo,
    "1_guardado_aqui": {
      ...guardadas,
      oQueE: "webhook de vendas novas + planilhas importadas (mesmo lugar)",
    },
    "2_api_historico_de_vendas": {
      ...historico,
      oQueE: "/payments/api/v1/sales/history — barrado pra nossa credencial",
    },
    "3_api_assinaturas_ao_vivo": {
      ...assinaturas,
      oQueE: "/payments/api/v1/subscriptions/transactions?subscriber_email=",
    },
  };
}
