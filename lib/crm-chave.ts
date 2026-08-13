import "server-only";
import { kvGet, kvSet } from "./storage";
import { getLpFormConfig } from "./lp-form-config";
import { extrairChave } from "./webhook-codigo";

/**
 * A chave do CRM que vale pro site inteiro, com exceção por página.
 *
 * ⚠️ Sem isto, cada página precisava da sua chave colada à mão — e são mais de
 * 70. Na prática, quase todas ficavam sem, e o lead parava no portal sem
 * chegar no CRM. Foi o que aconteceu com a lead **Ana Novaes**, que entrou pela
 * `/contato-instagram` e ficou só aqui porque aquela página não tinha chave.
 *
 * Regra: a chave da página vence a padrão. Página sem chave usa a padrão.
 * Assim o normal funciona sozinho e a exceção continua possível.
 */

const KEY = "crm:chave-padrao";

export async function getChavePadrao(): Promise<string | null> {
  return (await kvGet<string>(KEY)) || null;
}

export async function setChavePadrao(texto: string): Promise<void> {
  // Aceita o código inteiro do CRM, a URL ou só a chave.
  await kvSet(KEY, texto.trim() ? extrairChave(texto) ?? "" : "");
}

/** A chave que essa página deve usar: a dela, ou a padrão do site. */
export async function chaveDoSlug(slug: string): Promise<string | null> {
  const cfg = await getLpFormConfig(slug).catch(() => null);
  const daPagina = cfg?.codigoCrm ? extrairChave(cfg.codigoCrm) : null;
  if (daPagina) return daPagina;
  return await getChavePadrao();
}
