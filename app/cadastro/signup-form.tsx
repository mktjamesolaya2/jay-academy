"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { signUpAction } from "@/app/login/actions";

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, undefined);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Criar conta</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Preencha os dados abaixo pra criar sua conta.
        </p>
      </div>

      <div>
        <label className="block text-[11px] uppercase tracking-[0.14em] text-neutral-400 font-semibold mb-1.5">
          Nome completo
        </label>
        <input
          type="text"
          name="name"
          required
          autoComplete="name"
          placeholder="Seu nome completo"
          className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
        />
      </div>

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
            minLength={6}
            autoComplete="new-password"
            placeholder="Crie uma senha"
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

      <div>
        <label className="block text-[11px] uppercase tracking-[0.14em] text-neutral-400 font-semibold mb-1.5">
          Confirmar senha
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Confirme sua senha"
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition p-1"
          >
            {showConfirm ? (
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

      <SubmitButton />

      <p className="text-center text-xs text-neutral-500 pt-2 border-t border-[#1f1f1f]">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-white font-semibold hover:underline">
          Fazer login
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
          Criando conta...
        </>
      ) : (
        <>
          Criar conta
          <ArrowRight size={14} strokeWidth={2.4} />
        </>
      )}
    </button>
  );
}
