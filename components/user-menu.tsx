"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Shield, Eye, Crown } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { type SessionUser, type UserRole } from "@/lib/auth";

const roleLabel: Record<UserRole, string> = {
  senior: "Senior",
  admin: "Administrador",
  viewer: "Visualizador",
};

export function UserMenu({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const initial = user.name.charAt(0).toUpperCase();
  const RoleIcon =
    user.role === "senior" ? Crown : user.role === "admin" ? Shield : Eye;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#121212] transition"
      >
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {initial}
        </span>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-white leading-none truncate">
            {user.name}
          </p>
          <p className="text-[11px] text-neutral-500 leading-none mt-1 inline-flex items-center gap-1">
            <RoleIcon size={9} strokeWidth={2.4} />
            {roleLabel[user.role]}
          </p>
        </div>
        <ChevronDown size={14} className="text-neutral-500" strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg shadow-2xl overflow-hidden">
          <div className="px-3 py-2.5 border-b border-[#1f1f1f]">
            <p className="text-xs text-neutral-400 truncate">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10 transition text-left"
            >
              <LogOut size={13} strokeWidth={2.2} />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
