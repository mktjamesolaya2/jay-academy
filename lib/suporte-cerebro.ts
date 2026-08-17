import "server-only";
import { randomUUID } from "node:crypto";
import {
  MODEL_CHAIN,
  MODEL_CHAIN_VISAO,
  MODEL_CHAIN_AUDIO,
} from "./chat-models";
import { montarConteudo, tipoDeConversa, type Anexo } from "./suporte-anexo";
import {
  getConhecimento,
  getConversa,
  salvarConversa,
  anotarLacuna,
  type Conversa,
} from "./suporte-store";
import {
  montarPrompt,
  lerResposta,
  pediuHumano,
  resumoPraAtendente,
  pareceRaciocinio,
} from "./suporte-prompt";
import { logAnonymousActivity } from "./activity-log";
import {
  acharEmail,
  ehProblemaDeAcesso,
  avaliarAcesso,
  fatosDoAcesso,
  saudacao,
  primeiroNome,
} from "./suporte-acesso";
import { todasAsCompras } from "./hotmart-store";
import { pedirReenvio } from "./reenvio-store";
import { escolherProvedor, recadoDeLimite } from "./ia-provedor";
import { nomeDaMensagem, SEM_NOME } from "./nome-no-chat";
import {
  paraGeminiNativo,
  urlNativa,
  lerRespostaNativa,
  erroNativo,
} from "./gemini-nativo";

/**
 * O cérebro do suporte, num lugar só.
 *
 * ⚠️ Mora aqui, e não dentro de uma rota, porque **duas telas usam o mesmo
 * atendimento**: a página pública da aluna (`/ajuda`) e o chat de teste do
 * painel (`/suporte`). Se cada rota tivesse a sua cópia, uma regra corrigida
 * num lado continuaria errada no outro — e o lado errado seria justamente o que
 * fala com aluna.
 *
 * Quem chama cuida do que é da porta: login, limite de uso, tamanho do corpo.
 * Daqui pra dentro é só atendimento.
 */

const TEMPERATURA = 0.4;
/**
 * ⚠️ Folga de propósito: o raciocínio interno do modelo consome deste mesmo
 * teto, mesmo sendo descartado — com 400 a resposta visível cortava no meio
 * ("Vou pedir ao").
 */
const TETO = 900;

export type PedidoSuporte = {
  conversaId?: string;
  texto: string;
  anexos: Anexo[];
  /** Nome de quem está falando. No chat de teste do painel, "Teste". */
  quem?: string;
  /**
   * E-mail informado na entrada da página pública.
   *
   * ⚠️ Vale ouro: com ele a consulta na Hotmart roda **já na primeira
   * mensagem**. Sem, a IA precisa pedir o e-mail e a aluna espera uma volta
   * inteira pra descobrir algo que a gente já podia ter olhado.
   */
  email?: string;
};

export type RespostaSuporte =
  | { tipo: "calada"; conversaId: string }
  | {
      tipo: "ok";
      conversaId: string;
      reply: string;
      precisaHumano: boolean;
      model?: string;
      provedor?: string;
    }
  | { tipo: "erro"; status: number; erro: string; conversaId?: string };

const FRASE_CHAMANDO = "Claro, já estou chamando alguém do time pra falar com você.";

export async function responder(p: PedidoSuporte): Promise<RespostaSuporte> {
  const texto = p.texto.trim();
  const anexos = p.anexos.slice(0, 3);
  if (!texto && !anexos.length) {
    return { tipo: "erro", status: 400, erro: "Sem mensagem" };
  }

  // ⚠️ **O id da conversa é a chave dela.** Na página pública a aluna não tem
  // login: quem tem o id lê a conversa — e dentro dela vão o e-mail e os dados
  // de compra. Com `c-${Date.now()}` daria pra adivinhar os ids vizinhos e ler
  // o atendimento de outra pessoa. `randomUUID` não é adivinhável.
  const id = p.conversaId || randomUUID();
  const agora = new Date().toISOString();
  const conversa: Conversa = (await getConversa(id)) ?? {
    id,
    quem: p.quem?.trim() || SEM_NOME,
    mensagens: [],
    aguardandoPessoa: false,
    criadaEm: agora,
    atualizadaEm: agora,
  };
  if (p.email && !conversa.emailAluna) conversa.emailAluna = p.email.toLowerCase();

  // ⚠️ A conversa abre com a saudação perguntando o nome, então a PRIMEIRA
  // mensagem costuma ser a resposta disso. Se não for — se ela já chegar
  // contando o problema — `nomeDaMensagem` devolve null e a gente segue sem
  // nome, sem insistir. James: não vale travar a pessoa num formulário.
  const primeiraDaAluna = !conversa.mensagens.some((m) => m.de === "aluno");
  const nomeDito = primeiraDaAluna ? nomeDaMensagem(texto) : null;
  if (nomeDito && conversa.quem === SEM_NOME) conversa.quem = nomeDito;

  conversa.mensagens.push({
    de: "aluno",
    texto: texto || (tipoDeConversa(anexos) === "audio" ? "(áudio)" : "(imagem)"),
    em: agora,
  });

  // ⚠️ A IA fica CALADA depois que a conversa foi passada pra uma pessoa. Quem
  // reativa é o time, na tela. Se ela voltasse a responder sozinha, atropelaria
  // o atendimento humano no meio — e a aluna veria duas vozes se contradizendo.
  if (conversa.aguardandoPessoa) {
    await salvarConversa(conversa);
    return { tipo: "calada", conversaId: id };
  }

  // Pedido explícito de pessoa nem chega no modelo.
  if (pediuHumano(texto)) {
    conversa.aguardandoPessoa = true;
    conversa.mensagens.push({ de: "ia", texto: FRASE_CHAMANDO, em: new Date().toISOString() });
    await salvarConversa(conversa);
    await avisarOTime(conversa, id);
    return { tipo: "ok", conversaId: id, reply: FRASE_CHAMANDO, precisaHumano: true };
  }

  const provedor = escolherProvedor(process.env, {
    texto: MODEL_CHAIN,
    imagem: MODEL_CHAIN_VISAO,
    audio: MODEL_CHAIN_AUDIO,
  });
  if (!provedor) {
    await salvarConversa(conversa);
    return {
      tipo: "erro",
      status: 503,
      conversaId: id,
      erro: "Nenhuma chave de IA configurada. Coloque GEMINI_API_KEY (recomendado) ou OPENROUTER_API_KEY.",
    };
  }

  // ── O caso mais comum: "não consigo acessar" ────────────────────────────
  //
  // ⚠️ A decisão é tomada AQUI, em código, e não pelo modelo. Ele recebe a
  // conclusão pronta e só escreve a frase. Data de compra e prazo de 12 meses
  // são conta — se um modelo gratuito errasse essa conta, diria "seu acesso
  // está ativo" pra quem não tem, e a aluna ficaria tentando entrar.
  const emailNaMensagem = acharEmail(texto);
  if (emailNaMensagem) conversa.emailAluna = emailNaMensagem;
  if (ehProblemaDeAcesso(texto)) conversa.assuntoAcesso = true;

  let fatos = "";
  let humanoPorRegra = false;
  if (conversa.assuntoAcesso) {
    const compras = conversa.emailAluna
      ? await todasAsCompras(conversa.emailAluna).catch(() => [])
      : [];
    const situacao = avaliarAcesso(
      conversa.emailAluna ?? null,
      compras.map((c) => ({
        produto: c.produto,
        compradaEm: c.compradaEm,
        situacao: c.situacao,
        nome: c.nome,
      }))
    );
    fatos = fatosDoAcesso(situacao);

    // ⚠️ Quem não disse o nome no chat ganha o nome da COMPRA. É o melhor nome
    // que existe: veio da Hotmart, não de adivinhação — e é o que faz a caixa
    // do time parar de ter conversa sem dono.
    const nomeDaCompra = compras.find((c) => c.nome)?.nome;
    if (conversa.quem === SEM_NOME && nomeDaCompra) {
      conversa.quem = primeiroNome(nomeDaCompra) ?? nomeDaCompra;
    }

    // Acesso válido = só falta reenviar o e-mail, e isso é clique humano na
    // Hotmart (não tem API). Entra na fila pra não se perder na conversa.
    if (situacao.tipo === "no-prazo") {
      await pedirReenvio({
        email: situacao.email,
        nome: compras.find((c) => c.nome)?.nome,
        produtos: [...new Set(situacao.compras.map((c) => c.produto))],
        venceEm: situacao.venceEm,
        pedidoEm: new Date().toISOString(),
      }).catch(() => {});
    }
    // Quem decide chamar uma pessoa aqui é a regra, não o modelo.
    humanoPorRegra =
      situacao.tipo === "no-prazo" ||
      situacao.tipo === "vencido" ||
      situacao.tipo === "cancelado";
  }

  const conhecimento = await getConhecimento();
  const anteriores = conversa.mensagens.slice(-16, -1).map((m) => ({
    role: m.de === "aluno" ? "user" : "assistant",
    content: m.texto as string | Array<Record<string, unknown>>,
  }));
  // ⚠️ A tela da aluna JÁ mostrou "Boa tarde! Como você se chama?" antes de ela
  // escrever. Sem avisar isso aqui, a IA cumprimenta de novo e a conversa abre
  // com dois "boa tarde" seguidos — o jeito mais rápido de parecer robô.
  const abertura = !primeiraDaAluna
    ? ""
    : nomeDito
      ? `

A conversa já foi aberta por nós com "${saudacao()}" e a pergunta do nome — NÃO cumprimente de novo. Ela acabou de dizer que se chama ${nomeDito}: chame pelo nome e pergunte, em uma frase, no que pode ajudar.`
      : `

A conversa já foi aberta por nós com "${saudacao()}" e a pergunta do nome — NÃO cumprimente de novo. Ela não disse o nome, foi direto ao assunto: ajude no que ela pediu e NÃO insista em perguntar o nome.`;
  const messages = [
    {
      role: "system",
      content:
        montarPrompt(conhecimento) +
        abertura +
        (fatos
          ? `

O QUE JÁ SABEMOS DESTA ALUNA (use, não invente)
${fatos}`
          : ""),
    },
    ...anteriores,
    // A última mensagem é a que carrega o print ou o áudio.
    { role: "user", content: montarConteudo(texto, anexos) },
  ];

  // ⚠️ Fila por tipo: na OpenRouter só alguns modelos enxergam imagem e só UM
  // ouve áudio, então mandar print pro modelo de texto faz ele responder no
  // escuro. No Gemini as três filas são o mesmo modelo.
  const tipo = tipoDeConversa(anexos);
  const fila =
    tipo === "audio"
      ? provedor.filas.audio
      : tipo === "imagem"
        ? provedor.filas.imagem
        : provedor.filas.texto;

  // ⚠️ **Áudio no Gemini fala o formato NATIVO dele**, não o compatível: áudio
  // de WhatsApp é `.ogg` e o compatível recusa ogg com 400 (medido nos dois).
  const nativo = provedor.nome === "gemini" && tipo === "audio";

  let limiteDiario = false;
  for (const model of fila) {
    try {
      const r = await fetch(nativo ? urlNativa(model) : provedor.endpoint, {
        method: "POST",
        headers: nativo
          ? {
              "Content-Type": "application/json",
              // O nativo não usa Bearer — quer a chave neste cabeçalho. Bearer
              // aqui dá 401 falando de OAuth, que manda procurar problema de
              // permissão onde é só o cabeçalho errado.
              "x-goog-api-key": provedor.chave,
            }
          : {
              "Content-Type": "application/json",
              Authorization: `Bearer ${provedor.chave}`,
              ...provedor.cabecalhos,
            },
        body: JSON.stringify(
          nativo
            ? paraGeminiNativo(messages, {
                temperature: TEMPERATURA,
                maxOutputTokens: TETO,
              })
            : {
                model,
                messages,
                temperature: TEMPERATURA,
                max_tokens: TETO,
                // Campos que só um dos fornecedores entende (ex.: `reasoning`,
                // da OpenRouter). Mandar pro outro derruba o pedido inteiro.
                ...provedor.extras,
              }
        ),
        signal: AbortSignal.timeout(30000),
      });

      if (!r.ok) {
        const corpoErro = await r.text().catch(() => "");
        if (r.status === 400 || r.status === 404) {
          console.error(
            `[suporte] modelo "${model}" recusado por ${provedor.nome}${nativo ? " (nativo)" : ""} (${r.status}): ${erroNativo(corpoErro)}`
          );
        } else if (r.status === 429) {
          // ⚠️ Cota diária estourada. Sem esta distinção o erro sai como
          // "modelos indisponíveis", que manda procurar problema onde não tem.
          console.error(
            `[suporte] limite diário de ${provedor.nome} atingido: ${corpoErro.slice(0, 200)}`
          );
          limiteDiario = true;
        } else {
          console.warn(`[suporte] ${model} falhou: ${r.status} ${corpoErro.slice(0, 120)}`);
        }
        continue;
      }

      const data = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      // Os dois formatos guardam a resposta em lugares diferentes.
      const bruta = nativo
        ? lerRespostaNativa(data)
        : data?.choices?.[0]?.message?.content;
      if (!bruta) continue;

      // ⚠️ Rascunho do modelo NUNCA chega na aluna. Aconteceu uma vez: veio
      // "We need to follow instructions. The user gave email..." em inglês, com
      // o nome dos nossos blocos internos no meio. Quando isso acontece o prompt
      // já foi ignorado — não adianta pedir de novo, troca de modelo.
      if (pareceRaciocinio(bruta)) {
        console.warn(`[suporte] ${model} devolveu raciocínio em vez de resposta — trocando de modelo.`);
        continue;
      }

      const { texto: resposta, precisaHumano } = lerResposta(bruta);
      conversa.mensagens.push({
        de: "ia",
        texto: resposta,
        em: new Date().toISOString(),
      });
      if (precisaHumano || humanoPorRegra) {
        conversa.aguardandoPessoa = true;
        // A pergunta vai pra fila de lacunas — é o que ela ainda não sabe.
        await anotarLacuna(texto).catch(() => {});
        await avisarOTime(conversa, id);
      }
      await salvarConversa(conversa);

      return {
        tipo: "ok",
        conversaId: id,
        reply: resposta,
        precisaHumano: precisaHumano || humanoPorRegra,
        model,
        provedor: provedor.nome,
      };
    } catch (e) {
      // ⚠️ NÃO engolir em silêncio. Um `catch {}` vazio aqui escondeu por meia
      // hora um erro banal (traço longo num cabeçalho): os 4 modelos falhavam em
      // milissegundos e a mensagem dizia "modelos indisponíveis", mandando
      // procurar no fornecedor em vez de no nosso código.
      console.error(`[suporte] ${model} falhou:`, e instanceof Error ? e.message : e);
      continue;
    }
  }

  // ⚠️ Nenhum modelo respondeu. Do lado da aluna isso não pode virar silêncio:
  // ela fica olhando a tela sem saber se mandou. A conversa vai pra uma pessoa.
  conversa.aguardandoPessoa = true;
  await salvarConversa(conversa);
  await avisarOTime(conversa, id);

  return {
    tipo: "erro",
    status: 503,
    conversaId: id,
    erro: limiteDiario
      ? recadoDeLimite(provedor.nome)
      : tipo === "audio"
        ? "Não consegui ouvir esse áudio agora. Vou passar pra uma pessoa."
        : "Todos os modelos gratuitos estão indisponíveis agora.",
  };
}

/**
 * Toca o sino do portal.
 *
 * ⚠️ Tem gente parada esperando resposta do outro lado — se ficasse só marcado
 * numa tela que ninguém abriu, a aluna esperaria pra sempre. O resumo é pra
 * pessoa chegar na conversa já sabendo o que houve, em vez de ler tudo.
 */
async function avisarOTime(conversa: Conversa, id: string): Promise<void> {
  await logAnonymousActivity(
    "suporte.humano",
    conversa.quem,
    id,
    resumoPraAtendente(conversa.mensagens)
  ).catch(() => {});
}
