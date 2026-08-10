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
  /** Página/coleção a que essa mídia pertence (id de MediaPage). Sem isso, fica
   * em "Sem página". As importadas do WP recebem a página da origem. */
  pageId?: string;
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
