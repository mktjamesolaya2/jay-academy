import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser, canEdit } from "@/lib/auth";
import { listMedia } from "@/lib/media-store";
import { MediaLibrary } from "@/components/media-library";

export const dynamic = "force-dynamic";

export default async function MediaLibraryPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/midia");
  const [items, userCanEdit] = [await listMedia(), canEdit(me)];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
            Biblioteca de mídia
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
            {items.length} arquivo{items.length === 1 ? "" : "s"}
          </h2>
          <p className="text-neutral-400 mt-1.5 max-w-2xl text-[15px]">
            Logos, fotos de cursos e alunas, depoimentos, banners, vídeos e
            downloads — tudo num lugar só. Copie o link e reuse em qualquer
            página.
          </p>
        </header>

        <div className="px-10 py-8">
          <MediaLibrary items={items} canEdit={userCanEdit} />
        </div>
      </main>
    </div>
  );
}
