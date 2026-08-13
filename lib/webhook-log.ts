import "server-only";
import { kvGet } from "./storage";

/**
 * Como foi o último envio de cada página pro CRM.
 *
 * ⚠️ Existe porque um lead não chegou no CRM e ninguém tinha como saber por
 * quê: o script de envio roda no navegador de quem preencheu, então uma recusa
 * do CRM (telefone sem DDD, chave errada) ou um bloqueio de CORS morriam lá.
 * Agora o resultado volta e aparece na tela da página.
 *
 * Não guarda nada do lead — só página, status e o motivo.
 */

export type EnvioCrm = {
  em: string;
  status: number;
  erro?: string;
};

export function chaveLog(pagina: string): string {
  return `webhook-log:${pagina}`;
}

export async function logsDaPagina(pagina: string): Promise<EnvioCrm[]> {
  return (await kvGet<EnvioCrm[]>(chaveLog(pagina))) ?? [];
}

/** Traduz o status do CRM pro que a pessoa precisa fazer. */
export function explicarEnvio(e: EnvioCrm): string {
  if (e.status >= 200 && e.status < 300) return "Chegou no CRM";
  if (e.status === 422) return "O CRM recusou: telefone faltando ou sem DDD";
  if (e.status === 404) return "Chave não encontrada — confira a chave no CRM";
  if (e.status === 403)
    return "O CRM barrou o domínio desta página — libere ele em Domínios liberados, na chave";
  if (e.status === 429) return "Limite de envios do CRM atingido";
  if (e.status === 0 && /CORS|bloqueado/i.test(e.erro ?? ""))
    return "O navegador barrou: o domínio desta página não está liberado na chave, lá no CRM";
  if (e.status === 0) return e.erro || "Não saiu do navegador";
  return `O CRM respondeu ${e.status}`;
}
