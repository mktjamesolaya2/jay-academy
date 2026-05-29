import { redirect } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { listSuggestions } from "@/lib/suggestions-store";
import { SuggestionsBoard } from "./suggestions-board";
import { NewSuggestionForm } from "./new-suggestion-form";

export const dynamic = "force-dynamic";

export default async function SugestoesPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/sugestoes");

  const suggestions = await listSuggestions();
  const isAdmin = canEdit(me);

  // Ordenação: votos desc, depois mais novas primeiro
  const sorted = [...suggestions].sort((a, b) => {
    if (b.upvotes.length !== a.upvotes.length)
      return b.upvotes.length - a.upvotes.length;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold inline-flex items-center gap-1.5">
                <Lightbulb size={11} strokeWidth={2.4} className="text-amber-300" />
                Caixa de sugestões
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
                Manda ideia, vota nas dos outros
              </h2>
              <p className="text-neutral-400 mt-1.5 text-sm leading-relaxed">
                Qualquer pessoa do time pode sugerir o que tá faltando ou
                propor uma melhoria. Os mais votados sobem pro topo. Admins e
                o senior marcam o status conforme priorizam.
              </p>
            </div>
          </div>
        </header>

        <section className="px-10 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
          <div className="lg:col-span-2 space-y-3">
            <SuggestionsBoard
              suggestions={sorted}
              currentUserId={me.id}
              isAdmin={isAdmin}
            />
          </div>

          <aside className="space-y-5">
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 sticky top-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-3">
                Mandar sugestão
              </p>
              <NewSuggestionForm />
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
