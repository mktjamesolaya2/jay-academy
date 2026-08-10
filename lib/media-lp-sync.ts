import "server-only";
import assets from "./lp-assets.json";
import { addManyMedia } from "./media-store";
import { ensureLpPage } from "./media-pages-store";
import { landingPages } from "./landing-pages";
import { mediaTypeFromUrl, type MediaItem } from "./media-types";

/**
 * Põe na biblioteca de mídia as imagens que moram no repositório
 * (public/lp/...), agrupadas por LP.
 *
 * ⚠️ Elas nunca apareciam ali. A biblioteca só conhecia dois caminhos de
 * entrada — o import do WordPress e o upload manual — e as imagens das páginas
 * que a gente monta são arquivos commitados, que não passam por nenhum dos
 * dois. Por isso a galeria só tinha material com etiqueta "WP".
 *
 * A lista vem de lib/lp-assets.json, gerado na build (ver
 * scripts/gerar-manifesto-lps.mjs). Não trocar por leitura de disco: em
 * produção public/ pode não estar no sistema de arquivos da função.
 *
 * É idempotente — o id de cada mídia é a própria URL, então rodar de novo
 * não duplica nada; só entra o que é novo.
 */

type Asset = { lp: string; url: string; nome: string; tamanho: number };

/** Nome bonito do grupo: usa o cadastro das LPs quando o slug bate. */
function nomeDoGrupo(slug: string): string {
  const lp = landingPages.find((l) => l.slug === slug);
  if (lp?.name) return lp.name;
  return slug
    .split("-")
    .map((p) => (p.length > 2 ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

export async function sincronizarMidiasDasLps(): Promise<{
  gruposCriados: number;
  arquivos: number;
}> {
  const porLp = new Map<string, Asset[]>();
  for (const a of assets as Asset[]) {
    const lista = porLp.get(a.lp);
    if (lista) lista.push(a);
    else porLp.set(a.lp, [a]);
  }

  const agora = new Date().toISOString();
  const itens: MediaItem[] = [];
  for (const [slug, lista] of porLp) {
    const pageId = await ensureLpPage(slug, nomeDoGrupo(slug), agora);
    for (const a of lista) {
      itens.push({
        // a URL é única e estável — serve de id e torna a sincronia idempotente
        id: `lp:${a.url}`,
        name: a.nome,
        url: a.url,
        category: "Outros",
        type: mediaTypeFromUrl(a.url),
        size: a.tamanho,
        uploadedAt: agora,
        pageId,
      });
    }
  }

  await addManyMedia(itens);
  return { gruposCriados: porLp.size, arquivos: itens.length };
}
