"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { updateMyNameAction } from "@/app/dashboard/name-actions";

export function EditableGreeting({
  greeting,
  initialName,
}: {
  greeting: string;
  initialName: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [state, action] = useActionState(updateMyNameAction, undefined);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (state?.success) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <h1 className="text-2xl font-semibold text-white tracking-[-0.02em] flex items-center gap-2 flex-wrap">
        <span>{greeting},</span>
        <form action={action} className="inline-flex items-center gap-1.5">
          <input
            ref={inputRef}
            name="name"
            type="text"
            defaultValue={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="bg-[#161616] border border-[#262626] focus:border-neutral-500 rounded-md px-2.5 py-1 text-2xl font-semibold text-white tracking-[-0.02em] outline-none transition w-[200px]"
          />
          <SaveBtn />
          <button
            type="button"
            onClick={() => {
              setName(initialName);
              setEditing(false);
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:text-white hover:bg-[#161616] transition"
            title="Cancelar"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        </form>
        <span>👋</span>
        {state?.error && (
          <span className="block w-full text-xs text-rose-300 font-medium mt-1">
            {state.error}
          </span>
        )}
      </h1>
    );
  }

  return (
    <h1 className="text-2xl font-semibold text-white tracking-[-0.02em] flex items-center gap-2 group">
      <span>
        {greeting}, {name} 👋
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-500 hover:text-white hover:bg-[#161616] transition"
        title="Trocar como aparece o nome"
      >
        <Pencil size={12} strokeWidth={2.4} />
      </button>
    </h1>
  );
}

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-emerald-300 bg-emerald-500/15 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25 transition disabled:opacity-60"
      title="Salvar"
    >
      {pending ? (
        <Loader2 size={11} className="animate-spin" strokeWidth={2.4} />
      ) : (
        <Check size={13} strokeWidth={2.4} />
      )}
    </button>
  );
}
