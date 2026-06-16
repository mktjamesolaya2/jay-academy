"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hexagon,
  Home,
  Link2,
  Globe,
  Layout,
  FileText,
  FileStack,
  Image as ImageIcon,
  BarChart3,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { clsx } from "clsx";
import { UserMenu } from "./user-menu";
import type { SessionUser } from "@/lib/auth";

const URL_CHILDREN = [
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/lps", label: "Landing Pages", icon: Layout },
  { href: "/forms", label: "Formulários", icon: FileText },
  { href: "/wp-pages", label: "Páginas WP", icon: FileStack },
];

export function SidebarShell({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const inUrls = URL_CHILDREN.some((c) => pathname.startsWith(c.href));
  const [urlsOpen, setUrlsOpen] = useState(inUrls);

  // Restaura estado recolhido do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);
  // Mantém o grupo aberto quando você navega pra uma das filhas
  useEffect(() => {
    if (inUrls) setUrlsOpen(true);
  }, [inUrls]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  function onUrlsClick() {
    if (collapsed) {
      setCollapsed(false);
      localStorage.setItem("sidebar-collapsed", "0");
      setUrlsOpen(true);
    } else {
      setUrlsOpen((o) => !o);
    }
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside
      className={clsx(
        "shrink-0 border-r border-[#1f1f1f] bg-[#0a0a0a] flex flex-col h-screen sticky top-0 transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="px-3 pt-5 pb-5 border-b border-[#1f1f1f]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-2"
          title="Jay Academy"
        >
          <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <Hexagon size={15} className="text-[#0a0a0a]" strokeWidth={2.5} />
          </span>
          {!collapsed && (
            <p className="font-semibold text-[15px] text-white tracking-tight leading-none">
              Jay Academy
            </p>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <NavItem
          href="/dashboard"
          label="Home"
          icon={Home}
          active={isActive("/dashboard")}
          collapsed={collapsed}
        />

        {/* Grupo URLs */}
        <button
          type="button"
          onClick={onUrlsClick}
          title="URLs"
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
            collapsed ? "justify-center" : "",
            inUrls
              ? "text-white font-semibold"
              : "text-neutral-400 hover:bg-[#121212] hover:text-white font-medium"
          )}
        >
          <Link2 size={15} strokeWidth={2} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">URLs</span>
              <ChevronDown
                size={14}
                strokeWidth={2.2}
                className={clsx(
                  "transition-transform",
                  urlsOpen ? "rotate-180" : ""
                )}
              />
            </>
          )}
        </button>

        {!collapsed && urlsOpen && (
          <div className="ml-3 pl-3 border-l border-[#1f1f1f] space-y-0.5">
            {URL_CHILDREN.map((c) => (
              <NavItem
                key={c.href}
                href={c.href}
                label={c.label}
                icon={c.icon}
                active={isActive(c.href)}
                collapsed={false}
                small
              />
            ))}
          </div>
        )}

        <NavItem
          href="/midia"
          label="Biblioteca de mídia"
          icon={ImageIcon}
          active={isActive("/midia")}
          collapsed={collapsed}
        />
        <NavItem
          href="/analytics"
          label="Analytics"
          icon={BarChart3}
          active={isActive("/analytics")}
          collapsed={collapsed}
        />
        <NavItem
          href="/settings"
          label="Configurações"
          icon={Settings}
          active={isActive("/settings")}
          collapsed={collapsed}
        />
      </nav>

      {/* Recolher + usuário */}
      <div className="border-t border-[#1f1f1f] px-3 py-3 space-y-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expandir" : "Recolher"}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-[#121212] hover:text-white transition font-medium",
            collapsed ? "justify-center" : ""
          )}
        >
          {collapsed ? (
            <PanelLeft size={15} strokeWidth={2} />
          ) : (
            <>
              <PanelLeftClose size={15} strokeWidth={2} />
              <span>Recolher</span>
            </>
          )}
        </button>
        {!collapsed && <UserMenu user={user} />}
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  small,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active: boolean;
  collapsed: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={clsx(
        "flex items-center gap-3 px-3 rounded-lg transition",
        small ? "py-1.5 text-[13px]" : "py-2 text-sm",
        collapsed ? "justify-center" : "",
        active
          ? "bg-[#161616] text-white font-semibold"
          : "text-neutral-400 hover:bg-[#121212] hover:text-white font-medium"
      )}
    >
      <Icon size={small ? 14 : 15} strokeWidth={2} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
