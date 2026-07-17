"use client";

import { useActionState, useEffect, useRef } from "react";
import { UserPlus } from "lucide-react";
import { createUserAction } from "@/app/settings/users/actions";

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <UserPlus size={14} strokeWidth={2.2} className="text-emerald-300" />
        Criar novo usuário
      </h3>
      <p className="text-[11px] text-neutral-500 mt-1 mb-4">
        Só o senior cria contas — não há mais cadastro público. A pessoa loga
        depois com o email e a senha definidos aqui.
      </p>
      <form
        ref={formRef}
        action={action}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3"
      >
        <input
          name="name"
          required
          placeholder="Nome"
          className="lg:col-span-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="email@exemplo.com"
          className="lg:col-span-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
        />
        <input
          name="password"
          type="text"
          required
          minLength={6}
          placeholder="Senha (mín. 6)"
          className="lg:col-span-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
        />
        <select
          name="role"
          defaultValue="viewer"
          className="lg:col-span-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-600"
        >
          <option value="viewer">Visualizador</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="lg:col-span-1 btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
        >
          {pending ? "Criando..." : "Criar usuário"}
        </button>
      </form>
      {state?.error && (
        <p className="text-[11px] text-rose-300 mt-3">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-[11px] text-emerald-300 mt-3">
          Usuário criado. Ele já pode logar.
        </p>
      )}
    </div>
  );
}
