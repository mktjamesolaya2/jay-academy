import "server-only";
import { kvGet, kvSet } from "./storage";

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
const MAX_CONVERSAS = 200;
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
  criadaEm: string;
  atualizadaEm: string;
};

/**
 * O que a IA sabe. Começa com o catálogo, mas quem manda aqui é o James — ele
 * edita direto na tela, e é assim que ela é treinada.
 */
const CONHECIMENTO_INICIAL = `CURSOS ONLINE
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

O QUE AINDA NÃO ESTÁ AQUI
Política de reembolso, prazo de liberação depois da compra e certificado.
Enquanto não estiver escrito aqui, chame uma pessoa.`;


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
  await kvSet(CHAVE_CONVERSAS, todas.slice(0, MAX_CONVERSAS));
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
