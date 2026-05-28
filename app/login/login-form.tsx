"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { loginAction } from "./actions";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(loginAction, undefined);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Bem-vindo de volta</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Entre com suas credenciais pra acessar o painel.
        </p>
      </div>

      {redirectTo && (
        <input type="hidden" name="redirect" value={redirectTo} />
      )}

      <div>
        <label className="block text-[11px] uppercase tracking-[0.14em] text-neutral-400 font-semibold mb-1.5">
          E-mail
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-[0.14em] text-neutral-400 font-semibold mb-1.5">
          Senha
        </label>
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition p-1"
          >
            {showPwd ? (
              <EyeOff size={15} strokeWidth={2} />
            ) : (
              <Eye size={15} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {state?.error && (
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertCircle
            size={13}
            strokeWidth={2.4}
            className="text-rose-300 mt-0.5 shrink-0"
          />
          <p className="text-xs text-rose-300 font-medium">{state.error}</p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <label className="inline-flex items-center gap-2 text-neutral-400 cursor-pointer">
          <input
            type="checkbox"
            name="remember"
            className="accent-white"
            defaultChecked
          />
          Lembrar de mim
        </label>
        <button
          type="button"
          className="text-neutral-500 hover:text-white transition"
        >
          Esqueci minha senha
        </button>
      </div>

      <SubmitButton />

      <p className="text-center text-xs text-neutral-500 pt-2 border-t border-[#1f1f1f]">
        Não tem uma conta?{" "}
        <Link
          href="/cadastro"
          className="text-white font-semibold hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-70 disabled:cursor-wait"
    >
      {pending ? (
        <>
          <Loader2 size={14} className="animate-spin" strokeWidth={2.4} />
          Entrando...
        </>
      ) : (
        <>
          Entrar no painel
          <ArrowRight size={14} strokeWidth={2.4} />
        </>
      )}
    </button>
  );
}
