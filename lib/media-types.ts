// Tipos e constantes da biblioteca de mídia — SEM "server-only",
// pra poder ser importado tanto no client quanto no server.

export type MediaType = "image" | "video" | "file";

export type MediaItem = {
  id: string;
  name: string;
  url: string;
  category: string;
  type: MediaType;
  contentType?: string;
  size?: number;
  uploadedAt: string;
  /** Álbum principal (id de MediaPage) — é o que "Mover pra" escreve. Sem isso,
   * a mídia fica em "Sem álbum". As importadas do WP recebem a da origem. */
  pageId?: string;
  /**
   * TODOS os álbuns a que essa mídia pertence.
   *
   * ⚠️ Existe porque a mesma foto aparece em várias páginas — o logo, o fundo,
   * a foto do professor. Com um álbum só, a última página importada ficava com
   * a foto e as outras ficavam VAZIAS; página cujas imagens eram todas
   * compartilhadas sumia da galeria inteira (76 páginas → 46 álbuns). Como no
   * app de Fotos: uma foto pode estar em quantos álbuns for.
   */
  albuns?: string[];
};


/** Página/coleção da biblioteca de mídia — agrupa mídias. */
export type MediaPage = {
  id: string;
  name: string;
  /** "wp" = veio do import do WordPress; "lp" = imagem que mora no repositório,
   * em public/lp/<slug>/; "manual" = o usuário criou o grupo à mão. */
  source: "wp" | "manual" | "lp";
  createdAt: string;
};

/** Categorias/pastas da biblioteca. */
export const MEDIA_CATEGORIES = [
  "Logos",
  "Cursos",
  "Alunas",
  "Depoimentos",
  "Banners",
  "Vídeos",
  "Downloads",
  "Importadas do WP",
  "Outros",
] as const;

export function mediaTypeFromContentType(ct: string): MediaType {
  if (ct.startsWith("image/")) return "image";
  if (ct.startsWith("video/")) return "video";
  return "file";
}

export function mediaTypeFromUrl(url: string): MediaType {
  if (/\.(mp4|webm|mov|m4v)$/i.test(url)) return "video";
  if (/\.(jpe?g|png|gif|webp|svg|avif)$/i.test(url)) return "image";
  return "file";
}
