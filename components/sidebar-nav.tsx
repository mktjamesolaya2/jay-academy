"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Globe,
  Layout,
  FileText,
  Settings,
  Lightbulb,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/lps", label: "Landing Pages", icon: Layout },
  { href: "/forms", label: "Formulários", icon: FileText },
  { href: "/sugestoes", label: "Sugestões", icon: Lightbulb },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
              active
                ? "bg-[#161616] text-white font-semibold"
                : "text-neutral-400 hover:bg-[#121212] hover:text-white font-medium"
            )}
          >
            <Icon size={15} strokeWidth={2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
