import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { listMedia } from "@/lib/media-store";
import { listPages } from "@/lib/media-pages-store";
import { organizeImportedMediaByPage } from "@/lib/wp-localize";
import { sincronizarSeMudou } from "@/lib/media-repo-sync";
import { kvGet, kvSet } from "@/lib/storage";
import { MediaPagesWorkspace } from "@/components/media-pages-workspace";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// v3: a v2 SOBRESCREVIA o álbum de cada imagem, então página que só usava
// imagem compartilhada (logo, fundo, foto do professor) terminava vazia e
// sumia da galeria — eram 76 páginas virando 46 álbuns. Agora soma, e por isso
// precisa rodar de novo pra reconstruir os vínculos de todas.
const MIGRATION_FLAG = "media:pages-migrated:v3";

export default async function MediaLibraryPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/midia");

  let items = await listMedia();
  let pages = await listPages();

  // Migração one-shot (auto): agrupa as imagens que já estavam na biblioteca
  // (importadas do WP antes do sistema de páginas) pela página de origem. Roda
  // uma vez só — depois um flag impede repetir.
  if (canEdit(me)) {
    const migrated = await kvGet<boolean>(MIGRATION_FLAG);
    // ⚠️ Sem condicionar a "existe imagem solta": as imagens JÁ tinham álbum —
    // só tinham UM, o errado. A v2 só rodava quando havia órfã e por isso nunca
    // consertaria isto sozinha.
    if (!migrated) {
      await organizeImportedMediaByPage();
      await kvSet(MIGRATION_FLAG, true);
      items = await listMedia();
      pages = await listPages();
    }
  }

  // Sincronia automática: toda imagem commitada em public/ entra na galeria
  // sozinha no primeiro acesso depois do deploy. Sem isso, "as imagens das
  // páginas que eu crio não sobem pra cá" volta a acontecer toda vez que
  // alguém esquece de clicar no botão. Custa uma leitura quando nada mudou.
  if (canEdit(me)) {
    const r = await sincronizarSeMudou();
    if (r) {
      items = await listMedia();
      pages = await listPages();
    }
  }

  const userCanEdit = canEdit(me);

  // Conta o que o usuário vê: a galeria esconde página do WP que ficou sem
  // mídia nenhuma (mesma regra do MediaPagesWorkspace).
  const comMidia = new Set(items.map((i) => i.pageId));
  const albunsVisiveis = pages.filter(
    (p) => p.source !== "wp" || comMidia.has(p.id)
  ).length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
            Biblioteca de mídia
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
            {albunsVisiveis} álbu{albunsVisiveis === 1 ? "m" : "ns"} ·{" "}
            {items.length} arquivo{items.length === 1 ? "" : "s"}
          </h2>
          <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
            Toda imagem e vídeo do site fica aqui — os das páginas que a gente
            monta entram sozinhos, os do WordPress entram na importação. Clique
            numa foto pra copiar o link, mover de álbum ou excluir.
          </p>
        </header>

        <div className="px-5 py-6 lg:px-10 lg:py-8">
          <MediaPagesWorkspace
            items={items}
            pages={pages}
            canEdit={userCanEdit}
          />
        </div>
      </main>
    </div>
  );
}
