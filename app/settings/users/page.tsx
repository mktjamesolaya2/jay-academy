import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown, Shield, Eye, Trash2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser, listUsers } from "@/lib/auth";
import {
  promoteUserAction,
  demoteUserAction,
  deleteUserAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?redirect=/settings/users");
  if (me.role !== "senior") {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar />
        <main className="flex-1 px-10 py-12">
          <h1 className="text-2xl font-semibold text-white">Acesso negado</h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Esta página é exclusiva do senior do projeto.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-white mt-6 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pro dashboard
          </Link>
        </main>
      </div>
    );
  }

  const users = await listUsers();

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pras configurações
          </Link>
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                Senior · Gestão de usuários
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
                Equipe ({users.length})
              </h2>
              <p className="text-neutral-400 mt-1.5 text-sm">
                Promova/rebaixe perfis e revogue acessos. Visualizadores não
                conseguem criar nem editar nada.
              </p>
            </div>
          </div>
        </header>

        <section className="px-10 py-8">
          <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_120px_220px] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-[0.12em] text-neutral-600 font-semibold border-b border-[#1f1f1f]">
              <div>Usuário</div>
              <div>Email</div>
              <div>Role</div>
              <div className="text-right">Ações</div>
            </div>

            {users.map((u) => {
              const isSelf = u.id === me.id;
              const isSenior = u.role === "senior";
              const isAdmin = u.role === "admin";
              const isViewer = u.role === "viewer";
              return (
                <div
                  key={u.id}
                  className="grid grid-cols-[1.5fr_1fr_120px_220px] gap-3 items-center px-5 py-3.5 border-b border-[#161616] last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 ring-1 ring-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                      {u.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {u.name}
                        {isSelf && (
                          <span className="text-[10px] font-medium text-neutral-500 ml-1.5">
                            (você)
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-medium">
                        Desde {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-300 truncate font-mono">
                    {u.email}
                  </p>
                  <div>
                    {isSenior && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 bg-amber-500/10 text-amber-300 ring-amber-500/25">
                        <Crown size={11} strokeWidth={2.4} />
                        Senior
                      </span>
                    )}
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 bg-emerald-500/10 text-emerald-300 ring-emerald-500/25">
                        <Shield size={11} strokeWidth={2.4} />
                        Admin
                      </span>
                    )}
                    {isViewer && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 bg-neutral-500/10 text-neutral-400 ring-neutral-500/25">
                        <Eye size={11} strokeWidth={2.4} />
                        Visualizador
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    {isSenior ? (
                      <span className="text-[11px] text-neutral-600 font-medium">
                        Imutável
                      </span>
                    ) : (
                      <>
                        {isViewer && (
                          <form action={promoteUserAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="userName" value={u.name} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20 transition"
                            >
                              <Shield size={11} strokeWidth={2.4} />
                              Promover a admin
                            </button>
                          </form>
                        )}
                        {isAdmin && (
                          <form action={demoteUserAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="userName" value={u.name} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-neutral-300 bg-neutral-500/10 ring-1 ring-neutral-500/25 hover:bg-neutral-500/20 transition"
                            >
                              <Eye size={11} strokeWidth={2.4} />
                              Rebaixar
                            </button>
                          </form>
                        )}
                        <form action={deleteUserAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="userName" value={u.name} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-rose-300 bg-rose-500/10 ring-1 ring-rose-500/25 hover:bg-rose-500/20 transition"
                            title={`Excluir ${u.name}`}
                          >
                            <Trash2 size={12} strokeWidth={2.4} />
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-neutral-500 mt-4 leading-relaxed">
            Cadastros novos entram como{" "}
            <span className="text-neutral-300 font-medium">Visualizador</span>{" "}
            por padrão e ficam sem permissão pra editar. Promova quando confiar
            no usuário.
          </p>
        </section>
      </main>
    </div>
  );
}
