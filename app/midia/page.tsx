import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { listMedia } from "@/lib/media-store";
import { listPages } from "@/lib/media-pages-store";
import { MediaPagesWorkspace } from "@/components/media-pages-workspace";

export const dynamic = "force-dynamic";

export default async function MediaLibraryPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/midia");
  const [items, pages, userCanEdit] = [
    await listMedia(),
    await listPages(),
    canEdit(me),
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-5 pt-16 pb-6 lg:px-10 lg:pt-8 lg:pb-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
            Biblioteca de mídia
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
            {pages.length} página{pages.length === 1 ? "" : "s"} ·{" "}
            {items.length} arquivo{items.length === 1 ? "" : "s"}
          </h2>
          <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
            Mídias organizadas por página. As importadas do WordPress já entram
            agrupadas pela página de origem. Crie páginas, mova arquivos e busque
            a página pelo nome.
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
