import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { listMedia } from "@/lib/media-store";
import { listPages } from "@/lib/media-pages-store";
import { organizeImportedMediaByPage } from "@/lib/wp-localize";
import { kvGet, kvSet } from "@/lib/storage";
import { MediaPagesWorkspace } from "@/components/media-pages-workspace";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MIGRATION_FLAG = "media:pages-migrated:v2";

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
    const hasUnassignedWp = items.some(
      (i) => !i.pageId && i.category === "Importadas do WP"
    );
    if (!migrated && hasUnassignedWp) {
      await organizeImportedMediaByPage();
      await kvSet(MIGRATION_FLAG, true);
      items = await listMedia();
      pages = await listPages();
    }
  }

  const userCanEdit = canEdit(me);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
            Biblioteca de mídia
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
            {pages.length} álbu{pages.length === 1 ? "m" : "ns"} ·{" "}
            {items.length} arquivo{items.length === 1 ? "" : "s"}
          </h2>
          <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
            Cada álbum é uma página do site. As do WordPress entram agrupadas
            sozinhas; as imagens das LPs entram pelo botão de sincronizar. Clique
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
