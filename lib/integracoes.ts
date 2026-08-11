import "server-only";
import { randomBytes } from "node:crypto";
import { kvGet, kvSet } from "./storage";

/**
 * Integração de lead — UMA coisa só, no mesmo fluxo do Clint.
 *
 * Antes eu tinha quebrado isto em dois (um "webhook de entrada" e uma lista de
 * "destinos de saída"). James: *"faz um negócio só, não cria dois não, pra não
 * ficar perdido"*. E ele está certo: no Clint é um objeto só, e o caminho é
 *
 *   dá o nome  →  ele gera o link  →  você cola no formulário
 *              →  o lead chega     →  vai pro CRM
 *
 * Documentação lida (ajuda.clint.digital, "Como integrar a Clint com outras
 * plataformas via webhook"):
 *  - Negócio x Contato: contato é a pessoa; negócio é a oportunidade dela.
 *  - Criar / Atualizar / Criar ou atualizar: o que fazer quando o contato já
 *    existe. Identificação por e-mail e/ou telefone.
 *  - Mapeamento: coluna da ESQUERDA é o nome do campo na ferramenta de fora,
 *    a da DIREITA é o campo do CRM. ⚠️ É nesta direção, não na inversa.
 *  - Configuração: tags, etapa para criação, etapa para atualização e status.
 *  - Webhook que falha 3 vezes seguidas é desativado (copiamos essa regra).
 */

export type TipoRegistro = "negocio" | "contato";
export type AcaoIntegracao = "criar" | "atualizar" | "criar_ou_atualizar";

/** Uma linha do mapeamento: o nome no formulário → o campo do CRM. */
export type ParDeCampo = {
  /** como o campo se chama no formulário que envia (ex: "your-name") */
  doFormulario: string;
  /** pra qual campo do CRM ele vai (ex: "nome") */
  paraOCrm: string;
};

export type Integracao = {
  /** também é o token do link — sorteado, e é ele que autoriza o envio */
  id: string;
  nome: string;
  tipo: TipoRegistro;
  acao: AcaoIntegracao;
  mapeamento: ParDeCampo[];
  tags: string[];
  etapaCriacao?: string;
  etapaAtualizacao?: string;
  status?: string;
  ativo: boolean;
  criadoEm: string;
  /** contadores — é o que mostra na tela que o link está vivo */
  recebidos?: number;
  ultimoEm?: string;
  /** falhas seguidas ao repassar pro CRM; 3 desliga (regra do Clint) */
  falhasSeguidas?: number;
};

/**
 * Onde fica o CRM. É UM só pra casa inteira — o CRM do Lucas —, por isso não
 * vira lista nem se repete em cada integração.
 */
export type Crm = {
  url: string;
  /** cabeçalho de autenticação, se o CRM pedir */
  header?: string;
  token?: string;
};

const KEY = "integracoes:all";
const CRM_KEY = "integracoes:crm";

export function novoToken(): string {
  return "wh_" + randomBytes(18).toString("hex");
}

/** O que toda integração já nasce sabendo mapear. */
export function mapeamentoInicial(): ParDeCampo[] {
  return [
    { doFormulario: "name", paraOCrm: "nome" },
    { doFormulario: "email", paraOCrm: "email" },
    { doFormulario: "phone", paraOCrm: "telefone" },
  ];
}

export async function listarIntegracoes(): Promise<Integracao[]> {
  const todas = (await kvGet<Integracao[]>(KEY)) ?? [];
  return [...todas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function acharIntegracao(id: string): Promise<Integracao | null> {
  const todas = (await kvGet<Integracao[]>(KEY)) ?? [];
  return todas.find((i) => i.id === id) ?? null;
}

export async function salvarIntegracao(i: Integracao): Promise<void> {
  const todas = (await kvGet<Integracao[]>(KEY)) ?? [];
  const n = todas.findIndex((x) => x.id === i.id);
  if (n >= 0) todas[n] = i;
  else todas.push(i);
  await kvSet(KEY, todas);
}

export async function excluirIntegracao(id: string): Promise<void> {
  const todas = (await kvGet<Integracao[]>(KEY)) ?? [];
  await kvSet(
    KEY,
    todas.filter((i) => i.id !== id)
  );
}

export async function getCrm(): Promise<Crm | null> {
  return await kvGet<Crm>(CRM_KEY);
}

export async function setCrm(crm: Crm | null): Promise<void> {
  await kvSet(CRM_KEY, crm);
}

/**
 * Anota o que aconteceu com um lead que chegou.
 *
 * As 3 falhas seguidas desligam a integração — é a regra do próprio Clint, e
 * ela existe pra não ficar batendo pra sempre num endereço morto. Uma entrega
 * boa zera a conta.
 */
export async function registrarEntrada(
  id: string,
  repasseOk: boolean | null
): Promise<void> {
  const todas = (await kvGet<Integracao[]>(KEY)) ?? [];
  const n = todas.findIndex((i) => i.id === id);
  if (n < 0) return;
  const antes = todas[n];
  const falhas = repasseOk === false ? (antes.falhasSeguidas ?? 0) + 1 : 0;
  todas[n] = {
    ...antes,
    recebidos: (antes.recebidos ?? 0) + 1,
    ultimoEm: new Date().toISOString(),
    falhasSeguidas: falhas,
    ativo: falhas >= 3 ? false : antes.ativo,
  };
  await kvSet(KEY, todas);
}
