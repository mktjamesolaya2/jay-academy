import "server-only";
import { kvGet, kvSet } from "./storage";
import { chaveDoDia } from "./uso-ia";
import type { SituacaoGravada } from "./resumo-conversa";

/**
 * Base de conhecimento e conversas do suporte.
 *
 * Fase 1 do projeto: **sem WhatsApp**. O James conversa com a IA pela tela do
 * portal e vai corrigindo o que ela sabe até as respostas ficarem boas. Só
 * depois disso vale conectar um número — se as respostas não prestarem,
 * conectar só espalha o problema.
 */

const CHAVE_CONHECIMENTO = "suporte:conhecimento";
const CHAVE_CONVERSAS = "suporte:conversas";
/**
 * Quantas conversas a caixa guarda.
 *
 * ⚠️ Era 200. Com movimento de verdade isso vira semanas — e a 201ª empurrava
 * a mais antiga pra fora, levando junto o PROTOCOLO dela. Como o protocolo é o
 * que a aluna leva pro WhatsApp, sumir com ele quebra exatamente o que a gente
 * prometeu pra ela.
 *
 * ⚠️ Não é infinito porque tudo isso mora numa chave só no banco: cada leitura
 * e cada escrita mexem na lista inteira. Se um dia passar de mil, o certo é
 * separar cada conversa na sua própria chave, não aumentar este número de novo.
 */
const MAX_CONVERSAS = 1000;
const MAX_MENSAGENS = 60;

export type Mensagem = {
  de: "aluno" | "ia" | "pessoa";
  texto: string;
  em: string;
};

export type Conversa = {
  id: string;
  /** Nome ou telefone de quem está falando. Na fase 1, "Teste". */
  quem: string;
  mensagens: Mensagem[];
  /** IA calada, esperando alguém do time assumir. */
  aguardandoPessoa: boolean;
  /**
   * Já perguntou o nome antes de encaminhar.
   *
   * ⚠️ Existe pra NÃO perguntar duas vezes. Sem esta marca, quem não quer dizer
   * o nome ficaria preso num laço: pede pessoa → "qual seu nome?" → pede pessoa
   * de novo → "qual seu nome?".
   */
  pediuNome?: boolean;
  /**
   * E-mails que a gente já disse a ela que não foram encontrados.
   *
   * ⚠️ É o que quebra o laço "não achei / será que foi outro? / usei esse
   * mesmo / não achei". Guardado por e-mail, e não como um sim/não, porque
   * se ela mandar OUTRO e-mail a busca tem que valer de novo pra ele.
   */
  naoAchados?: string[];
  /**
   * O encaminhamento é assunto DELA, ou trabalho nosso?
   *
   * ⚠️ Reenvio de acesso é trabalho nosso: ela já ouviu que vai receber e não
   * tem nada a fazer. Mostrar protocolo e botão de WhatsApp nessa hora manda
   * ela procurar atendimento por uma coisa que já está resolvida.
   *
   * Os dois casos aparecem na caixa do time — a diferença é só o que ela vê.
   */
  encaminharPraConversa?: boolean;
  /**
   * Ela mesma encerrou o atendimento.
   *
   * ⚠️ Fecha o assunto do lado dela sem tirar a conversa da caixa do time —
   * o reenvio do acesso ainda precisa ser feito à mão.
   */
  encerradaPelaAluna?: boolean;
  /**
   * O que a consulta de acesso concluiu na última vez.
   *
   * ⚠️ James: *"muitas vezes a gente abre o protocolo e tem só o e-mail pra
   * reenviar; seria interessante o chatbot gravar — ah, esse aqui o acesso
   * venceu"*. Guardado no momento da consulta, porque depois não dá pra
   * refazer: a resposta da Hotmart pode mudar, e o que importa é o que a
   * aluna ouviu.
   */
  situacaoAcesso?: SituacaoGravada;
  /** A data que vai no resumo: até quando vale, ou quando venceu. */
  acessoEm?: string;
  /**
   * O e-mail que a aluna deu — fica guardado na conversa.
   *
   * ⚠️ Sem isto, ela teria que repetir o e-mail a cada mensagem: a consulta
   * roda a cada volta, e a mensagem seguinte ("e agora?") não traz e-mail
   * nenhum.
   */
  emailAluna?: string;
  /**
   * Veio do chat de treino do painel, não de uma aluna.
   *
   * ⚠️ É uma MARCA no dado, não o nome "Teste". Filtrar pelo nome quebraria
   * no dia em que alguém se chamasse Teste — e faria a conversa de uma pessoa
   * de verdade sumir da lista sem ninguém entender por quê.
   */
  teste?: boolean;
  /** A conversa é sobre não conseguir acessar o curso. */
  assuntoAcesso?: boolean;
  criadaEm: string;
  atualizadaEm: string;
};

/**
 * O que a IA sabe. Começa com o catálogo, mas quem manda aqui é o James — ele
 * edita direto na tela, e é assim que ela é treinada.
 */
const CONHECIMENTO_INICIAL = `ONDE VOCÊ TRABALHA
- Você é do suporte da JAY ACADEMY, a escola de micropigmentação do James Olaya.
- A PMU CLASS é a nossa plataforma de cursos ONLINE. Sim, é nossa — se alguém
  perguntar se somos responsáveis por ela, confirme e siga ajudando.
- A Jay Academy também tem FORMAÇÕES PRESENCIAIS, e existe a CLÍNICA JAMES
  OLAYA, onde são feitos os procedimentos.
- ⚠️ Isto serve pra você se situar e responder "sim, é aqui mesmo". Qualquer
  coisa ALÉM de dizer o que cada um é — preço, vaga, data, agendamento — não é
  com você: chame uma pessoa.

CURSOS ONLINE
- São 4 em português: Basic Nanofios, Basic Magic Shadow, Fio a Fio Realista e
  Lips Sense. Cada um tem 13 módulos.
- Em espanhol: Pelo a Pelo e Basic Magic Shadow ES.
- ⚠️ Preço NÃO se fala aqui. Quem quer conhecer ou comprar, você passa pra uma
  pessoa do time.

ACESSO
- O acesso vale 12 meses a partir da compra. Não é vitalício.
- Quem quiser estender o acesso precisa falar com uma pessoa do time.

MATERIAL DE APOIO
- A apostila e todo o material de apoio ficam na PRIMEIRA AULA DO PRIMEIRO
  MÓDULO. Vale para todos os cursos.

DESCONTO
- Normalmente não temos desconto. Quem insistir, passe para uma pessoa.

LIBERAÇÃO DO ACESSO
- Não tem prazo: o acesso libera na hora, assim que a compra é aprovada na
  Hotmart. Se a pessoa comprou e não recebeu, veja "acesso vencido" e encaminhe.

REEMBOLSO
- ⚠️ Você NÃO conversa sobre reembolso. Nem explica, nem confirma, nem nega, nem
  diz prazo. Passe para uma pessoa na hora.

CERTIFICADO
- Qualquer dúvida sobre certificado vai para uma pessoa do time.

O QUE AINDA NÃO ESTÁ AQUI
Enquanto uma informação não estiver escrita aqui, chame uma pessoa em vez de
supor.`;


export async function getConhecimento(): Promise<string> {
  const salvo = await kvGet<string>(CHAVE_CONHECIMENTO);
  return salvo ?? CONHECIMENTO_INICIAL;
}

export async function setConhecimento(texto: string): Promise<void> {
  await kvSet(CHAVE_CONHECIMENTO, texto);
}

export async function listarConversas(): Promise<Conversa[]> {
  return (await kvGet<Conversa[]>(CHAVE_CONVERSAS)) ?? [];
}

export async function getConversa(id: string): Promise<Conversa | null> {
  return (await listarConversas()).find((c) => c.id === id) ?? null;
}

export async function salvarConversa(conversa: Conversa): Promise<void> {
  const todas = await listarConversas();
  const i = todas.findIndex((c) => c.id === conversa.id);
  const limpa: Conversa = {
    ...conversa,
    mensagens: conversa.mensagens.slice(-MAX_MENSAGENS),
    atualizadaEm: new Date().toISOString(),
  };
  if (i === -1) todas.unshift(limpa);
  else todas[i] = limpa;
  await kvSet(CHAVE_CONVERSAS, aparar(todas));
}

/**
 * Corta a lista quando ela passa do teto — sacrificando o que menos importa.
 *
 * ⚠️ Cortar pela ponta (a mais antiga sai) jogaria fora uma aluna esperando
 * atendimento só porque ela chegou primeiro. Aqui sai primeiro quem NÃO deixou
 * rastro: conversa sem e-mail, que ninguém está esperando, e que já acabou. Na
 * prática é quem abriu a página, escreveu "oi" e foi embora.
 */
function aparar(todas: Conversa[]): Conversa[] {
  if (todas.length <= MAX_CONVERSAS) return todas;

  const importa = (c: Conversa) =>
    c.aguardandoPessoa || !!c.emailAluna || c.mensagens.length > 2;

  const guardar = todas.filter(importa);
  if (guardar.length >= MAX_CONVERSAS) return guardar.slice(0, MAX_CONVERSAS);

  // Ainda cabe: completa com as descartáveis mais recentes.
  const resto = todas.filter((c) => !importa(c));
  return [...guardar, ...resto].slice(0, MAX_CONVERSAS);
}

export async function apagarConversa(id: string): Promise<void> {
  const todas = await listarConversas();
  await kvSet(
    CHAVE_CONVERSAS,
    todas.filter((c) => c.id !== id)
  );
}

/**
 * As perguntas que ela NÃO soube responder.
 *
 * ⚠️ É assim que ela fica mais esperta — e não sozinha, de propósito.
 *
 * James pediu que "a cada resposta ela vá ficando mais esperta, tudo adicionado
 * no banco". Deixar uma IA aprender das próprias respostas é justamente como se
 * estraga um suporte: ela erra uma vez, grava o erro como verdade e passa a
 * repetir com mais confiança — e ninguém percebe até um aluno agir em cima.
 *
 * Então o que entra aqui é a PERGUNTA, nunca a resposta dela. Vira uma fila de
 * lacunas na tela: o James escreve a resposta certa, ela vai pra base, e daí em
 * diante a IA sabe. Aprende igual, só que sem inventar.
 */
const CHAVE_LACUNAS = "suporte:lacunas";
const MAX_LACUNAS = 100;

export type Lacuna = {
  pergunta: string;
  vezes: number;
  ultimaEm: string;
};

export async function listarLacunas(): Promise<Lacuna[]> {
  return (await kvGet<Lacuna[]>(CHAVE_LACUNAS)) ?? [];
}

/** Registra uma pergunta sem resposta. Repetida, só soma no contador. */
export async function anotarLacuna(pergunta: string): Promise<void> {
  const texto = pergunta.trim().slice(0, 300);
  if (!texto) return;
  const todas = await listarLacunas();
  const chave = texto.toLowerCase();
  const existente = todas.find((l) => l.pergunta.toLowerCase() === chave);
  if (existente) {
    existente.vezes += 1;
    existente.ultimaEm = new Date().toISOString();
  } else {
    todas.unshift({ pergunta: texto, vezes: 1, ultimaEm: new Date().toISOString() });
  }
  // As mais pedidas primeiro: é por elas que vale começar a preencher.
  todas.sort((a, b) => b.vezes - a.vezes);
  await kvSet(CHAVE_LACUNAS, todas.slice(0, MAX_LACUNAS));
}

export async function removerLacuna(pergunta: string): Promise<void> {
  const todas = await listarLacunas();
  await kvSet(
    CHAVE_LACUNAS,
    todas.filter((l) => l.pergunta !== pergunta)
  );
}

/* ── quanto da cota grátis já foi hoje ───────────────────────────────────── */

type UsoDoDia = { usadas: number; estourou: boolean };

/**
 * Soma uma resposta da IA no contador do dia.
 *
 * ⚠️ Isto é um velocímetro, não uma contabilidade. Se duas mensagens chegarem
 * no mesmo instante, uma pode não ser contada (ler-somar-gravar não é atômico
 * no arquivo local). Tudo bem: o número existe pra alguém olhar e pensar
 * "opa, tá acabando", e um a menos não muda essa conclusão. Quem diz a verdade
 * sobre a cota ter acabado é o 429 do fornecedor, não esta conta.
 */
export async function contarUsoIA(agora = new Date()): Promise<void> {
  const chave = chaveDoDia(agora);
  const atual = (await kvGet<UsoDoDia>(chave)) ?? { usadas: 0, estourou: false };
  // ⚠️ Uma resposta que deu certo DESMARCA a cota estourada. É prova viva de
  // que a IA voltou — e sem isso o vermelho ficaria na tela até a meia-noite,
  // mesmo com ela respondendo, e aí ninguém mais acreditaria nele.
  await kvSet(chave, { usadas: atual.usadas + 1, estourou: false });
}

/** O fornecedor devolveu 429 — a cota de hoje acabou de verdade. */
export async function marcarLimiteEstourado(agora = new Date()): Promise<void> {
  const chave = chaveDoDia(agora);
  const atual = (await kvGet<UsoDoDia>(chave)) ?? { usadas: 0, estourou: false };
  if (atual.estourou) return;
  await kvSet(chave, { ...atual, estourou: true });
}

export async function lerUsoIA(agora = new Date()): Promise<UsoDoDia> {
  return (await kvGet<UsoDoDia>(chaveDoDia(agora))) ?? { usadas: 0, estourou: false };
}
