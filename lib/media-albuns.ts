import type { MediaItem } from "./media-types";

/**
 * Regras de quais álbuns uma mídia habita.
 *
 * Fora do media-store (que é `server-only`) porque é a parte que decide se uma
 * foto aparece ou some da galeria, e precisa de teste. Foi aqui que estava o
 * bug das 76 páginas virando 46 álbuns: a atribuição SOBRESCREVIA, e como a
 * mesma foto serve dezenas de páginas, cada importação roubava a foto da
 * anterior — quem só usava imagem compartilhada terminava sem nada.
 */

/** Os álbuns de uma mídia. Cai no `pageId` sozinho pros registros antigos. */
export function albunsDa(m: MediaItem): string[] {
  if (m.albuns?.length) return m.albuns;
  return m.pageId ? [m.pageId] : [];
}

/** Soma álbuns aos que a mídia já tem. Devolve a mesma mídia se nada mudou. */
export function unirAlbuns(m: MediaItem, novos: string[]): MediaItem {
  const atuais = albunsDa(m);
  const juntos = [...new Set([...atuais, ...novos])];
  if (juntos.length === atuais.length) return m;
  // o principal só é definido se ainda não havia — mover é escolha do usuário
  return { ...m, pageId: m.pageId ?? juntos[0], albuns: juntos };
}

/** Tira um álbum da mídia (ao excluir o álbum). */
export function tirarAlbum(m: MediaItem, alvo: string): MediaItem {
  const atuais = albunsDa(m);
  if (!atuais.includes(alvo)) return m;
  const restam = atuais.filter((a) => a !== alvo);
  return {
    ...m,
    pageId: m.pageId === alvo ? restam[0] : m.pageId,
    albuns: restam.length ? restam : undefined,
  };
}

/** Move a mídia pra UM álbum só (ou pra "sem álbum"). É a ação do usuário. */
export function moverPara(m: MediaItem, alvo: string | null): MediaItem {
  const albuns = alvo ? [alvo] : undefined;
  const iguais =
    m.pageId === (alvo ?? undefined) &&
    albunsDa(m).length === (albuns?.length ?? 0);
  if (iguais) return m;
  return { ...m, pageId: alvo ?? undefined, albuns };
}
