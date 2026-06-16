// Serve páginas publicadas DIRETO no slug raiz: /metodo-fio-a-fio
// (sem o /p/). Reusa exatamente o handler de /p/[slug] — mesmo param "slug".
// Rotas estáticas (/dashboard, /lps, ...) têm prioridade sobre este dinâmico,
// então não há colisão. Páginas não publicadas/inexistentes retornam 404.
export { GET } from "@/app/p/[slug]/route";

export const dynamic = "force-dynamic";
