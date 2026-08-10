import "server-only";
import manifesto from "./midia-assets.json";
import {
  addManyMedia,
  listMedia,
  apontarMidiasPara,
  removerMidias,
} from "./media-store";
import { ensureLpPage } from "./media-pages-store";
import { landingPages } from "./landing-pages";
import { kvGet, kvSet } from "./storage";
import { mediaTypeFromUrl, type MediaItem } from "./media-types";

/**
 * Põe na biblioteca de mídia TODA imagem e vídeo que mora no repositório
 * (public/), agrupados por álbum.
 *
 * ⚠️ Elas nunca apareciam ali. A biblioteca só conhecia dois caminhos de
 * entrada — o import do WordPress e o upload manual — e as imagens das páginas
 * que a gente monta são arquivos commitados, que não passam por nenhum dos
 * dois. Por isso a galeria só tinha material com etiqueta "WP".
 *
 * A lista vem de lib/midia-assets.json, gerado na build (ver
 * scripts/gerar-manifesto-midia.mjs). Não trocar por leitura de disco: em
 * produção public/ pode não estar no sistema de arquivos da função.
 *
 * É idempotente — o id de cada mídia é a própria URL, então rodar de novo não
 * duplica nada; só entra o que é novo.
 */

type Asset = { g: string; url: string; nome: string; tamanho: number };
const { arquivos, marca } = manifesto as { marca: string; arquivos: Asset[] };

const MARCA_KEY = "media:repo-sync:marca";

/** Nome bonito de quem não está no cadastro de LPs. */
const NOMES: Record<string, string> = {
  "espelho-wp": "Espelho do WordPress",
  sistema: "Arquivos de sistema",
  "shadow-pro": "Shadow PRO",
  "basic-magic-shadow-v2": "Basic Magic Shadow v2",
  "basic-nanofios": "Basic NanoFios",
  "fio-a-fio-realista": "Fio a Fio Realista",
  "fio-a-fio-realista-v2": "Fio a Fio Realista v2",
  "lips-sense": "Lips Sense",
  "profissao-remove": "Profissão Remove",
  "recriada-inmersion-pelo-a-pelo": "Inmersión Pelo a Pelo",
  academy: "Academy — formações presenciais",
};

function nomeDoGrupo(slug: string): string {
  if (NOMES[slug]) return NOMES[slug];
  const lp = landingPages.find((l) => l.slug === slug);
  if (lp?.name) return lp.name;
  return slug
    .split("-")
    .map((p) => (p.length > 2 ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

/**
 * Os arquivos de public/wpmirror/ se chamam `<12 primeiros do sha1 da URL
 * original>-<nome>-<sufixo>.<ext>`, e a mídia que a importação do WP gravou tem
 * id `<16 primeiros do mesmo sha1>` (ver lib/wp-localize.ts). Os 12 primeiros
 * caracteres casam os dois — é assim que a gente sabe que o arquivo espelhado e
 * o item da biblioteca são a mesma foto, sem guardar a URL original.
 */
function chaveDoEspelho(nome: string): string | null {
  const m = /^([0-9a-f]{12})-/.exec(nome);
  return m ? m[1] : null;
}

export type ResultadoSync = {
  albuns: number;
  arquivos: number;
  novos: number;
  consertados: number;
  removidas: number;
};

export async function sincronizarMidiasDoRepositorio(): Promise<ResultadoSync> {
  const existentes = await listMedia();
  const idsConhecidos = new Set(existentes.map((i) => i.id));

  // id da mídia importada do WP → item, indexado pelos 12 primeiros do hash
  const porHash = new Map<string, (typeof existentes)[number]>();
  for (const item of existentes) {
    if (/^[0-9a-f]{16}$/.test(item.id)) porHash.set(item.id.slice(0, 12), item);
  }

  const agora = new Date().toISOString();
  const porGrupo = new Map<string, Asset[]>();
  const conserto: Record<string, string> = {};

  for (const a of arquivos) {
    if (a.g === "espelho-wp") {
      const hash = chaveDoEspelho(a.nome);
      const jaImportada = hash ? porHash.get(hash) : undefined;
      if (jaImportada) {
        // A foto já está na biblioteca pela importação. Se ela aponta pra fora
        // (Blob/Supabase, hoje mortos), devolve pro arquivo local.
        if (jaImportada.url !== a.url) conserto[jaImportada.id] = a.url;
        continue; // não vira item novo: seria a mesma foto duas vezes
      }
    }
    const lista = porGrupo.get(a.g);
    if (lista) lista.push(a);
    else porGrupo.set(a.g, [a]);
  }

  const itens: MediaItem[] = [];
  for (const [slug, lista] of porGrupo) {
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
  const consertados = await apontarMidiasPara(conserto);

  // Arquivo apagado do repositório também tem que sair daqui, senão sobra uma
  // miniatura quebrada pra sempre — que na tela é a mesma coisa que faltar.
  // Só mexe no que a própria sincronia criou (id `lp:<url>`).
  const vivas = new Set(itens.map((i) => i.id));
  const removidas = await removerMidias(
    existentes.filter((i) => i.id.startsWith("lp:/") && !vivas.has(i.id)).map((i) => i.id)
  );

  await kvSet(MARCA_KEY, marca);

  return {
    albuns: porGrupo.size,
    arquivos: itens.length,
    novos: itens.filter((i) => !idsConhecidos.has(i.id)).length,
    consertados,
    removidas,
  };
}

/**
 * Sincroniza sozinho quando o repositório mudou desde a última vez.
 *
 * É o que faz valer "as imagens que eu crio com você aparecem aqui" sem
 * depender de alguém lembrar de clicar: a marca do manifesto muda a cada
 * arquivo que entra, sai ou muda de tamanho, e o primeiro acesso à galeria
 * depois do deploy já traz tudo. Quando nada mudou, custa UMA leitura.
 */
export async function sincronizarSeMudou(): Promise<ResultadoSync | null> {
  const anterior = await kvGet<string>(MARCA_KEY);
  if (anterior === marca) return null;
  return await sincronizarMidiasDoRepositorio();
}
