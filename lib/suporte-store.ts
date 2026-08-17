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
const CONHECIMENTO_INICIAL = `CURSOS ONLINE (Hotmart, acesso por 12 meses — não é vitalício)
- Basic Nanofios — R$ 297 à vista, ou 12x de R$ 32,55. 13 módulos.
- Basic Magic Shadow — R$ 97 à vista, ou 12x de R$ 29,70. 13 módulos. Em promoção.
- Fio a Fio Realista — R$ 197 à vista, ou 12x de R$ 20,37. 13 módulos. Em promoção.
- Lips Sense — R$ 597 à vista, ou 12x de R$ 65,43. 13 módulos.

EM ESPANHOL
- Pelo a Pelo e Basic Magic Shadow ES. Preço ainda não definido.

ACESSO
- O acesso vale 12 meses a partir da compra.
- Quem quiser estender o acesso precisa falar com uma pessoa do time.

O QUE AINDA NÃO ESTÁ AQUI
Política de reembolso, prazo de liberação depois da compra, certificado e
problemas de login. Enquanto não estiver escrito aqui, chame uma pessoa.`;

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
