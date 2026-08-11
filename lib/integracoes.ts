import "server-only";
import { randomBytes } from "node:crypto";
import { kvGet, kvSet } from "./storage";

/**
 * Integração de lead — UMA coisa só. James: *"faz um negócio só, não cria dois
 * não, pra não ficar perdido"*.
 *
 *   dá o nome  →  gera o link  →  cola no formulário
 *              →  o lead chega e é guardado  →  segue pro CRM
 *
 * ⚠️ O QUE NÃO MORA AQUI. Pelas instruções do Lucas (11/08), quem guarda
 * **etapa de entrada, responsável e rótulo de origem** é a própria chave
 * `pk_…`, configurada no CRM. Ter esses campos nos dois lugares seria ter duas
 * verdades — e um dia elas se contradizem. Não trazer de volta.
 *
 * Também não existe mais "Negócio x Contato" nem "Criar / Atualizar": o CRM do
 * Lucas reconhece a pessoa **pelo telefone** e decide sozinho. Deixar a escolha
 * na tela seria um botão que não faz nada.
 *
 * O que sobra aqui é o que é nosso mesmo: o nome, o link, e como os campos do
 * nosso formulário se chamam do outro lado.
 */

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
  mapeamento: ParDeCampo[];
  tags: string[];
  ativo: boolean;
  criadoEm: string;
  /** contadores — é o que mostra na tela que o link está vivo */
  recebidos?: number;
  ultimoEm?: string;
  /** falhas seguidas ao repassar pro CRM; 3 desliga (regra do Clint) */
  falhasSeguidas?: number;
};

/**
 * A ligação com o CRM: uma chave só pra casa inteira.
 *
 * É a `pk_…` que o Lucas gera no CRM (Configurações → origem → Integrações →
 * Novo webhook). Etapa de entrada, responsável e rótulo de origem ficam
 * guardados NELA, lá no CRM — por isso não se repetem aqui.
 *
 * ⚠️ Como o envio sai do NOSSO servidor, e não do navegador de quem preencheu,
 * a lista de "Domínios liberados" da chave tem que ficar VAZIA no CRM: não vai
 * cabeçalho de origem numa requisição de servidor. É o Caso C da documentação
 * do Lucas.
 */
export type Crm = {
  /** a chave `pk_…` ou a URL inteira; guardamos como veio */
  chave: string;
};

const KEY = "integracoes:all";
const CRM_KEY = "integracoes:crm";

export function novoToken(): string {
  return "wh_" + randomBytes(18).toString("hex");
}

/**
 * O que toda integração já nasce sabendo mapear.
 *
 * `whatsapp` é o primeiro de propósito: é o nome que as 4 LPs no ar já usam
 * (basic-nanofios, profissao-remove, fio-a-fio, lips-sense), então elas
 * funcionam sem ninguém mexer em campo nenhum.
 */
export function mapeamentoInicial(): ParDeCampo[] {
  return [
    { doFormulario: "nome", paraOCrm: "nome" },
    { doFormulario: "whatsapp", paraOCrm: "telefone" },
    { doFormulario: "email", paraOCrm: "email" },
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
