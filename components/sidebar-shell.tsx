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
  LayoutGrid,
  Inbox,
  FileText,
  FileStack,
  Image as ImageIcon,
  BarChart3,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { UserMenu } from "./user-menu";
import type { SessionUser } from "@/lib/auth";

const URL_CHILDREN = [
  { href: "/paginas", label: "Todas as páginas", icon: LayoutGrid },
  { href: "/websites", label: "Websites", icon: Globe },
  { href: "/lps", label: "Landing Pages", icon: Layout },
  { href: "/forms", label: "Formulários", icon: FileText },
  { href: "/wp-pages", label: "Páginas copiadas", icon: FileStack },
];

export function SidebarShell({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inUrls = URL_CHILDREN.some((c) => pathname.startsWith(c.href));
  const [urlsOpen, setUrlsOpen] = useState(inUrls);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    if (inUrls) setUrlsOpen(true);
  }, [inUrls]);
  // Fecha a gaveta ao trocar de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  const closeMobile = () => setMobileOpen(false);
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  // `collapsed` é preferência só de DESKTOP → no mobile a gaveta é sempre
  // expandida. Por isso os textos usam `lg:hidden` (somem só no desktop recolhido),
  // nunca deixam de renderizar.
  const hideOnCollapse = collapsed ? "lg:hidden" : "";

  return (
    <>
      {/* Botão de menu — só mobile */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        className="lg:hidden fixed top-3 left-3 z-30 w-10 h-10 rounded-lg bg-[#0f0f0f]/90 backdrop-blur border border-[#1f1f1f] flex items-center justify-center text-neutral-200 shadow-lg"
      >
        <Menu size={18} strokeWidth={2.2} />
      </button>

      {/* Fundo escurecido — mobile, gaveta aberta */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={closeMobile}
        />
      )}

      <aside
        className={clsx(
          "h-screen flex flex-col bg-[#0a0a0a] border-r border-[#1f1f1f] z-50",
          "fixed top-0 left-0 lg:sticky transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          "w-64",
          collapsed ? "lg:w-[68px]" : "lg:w-60"
        )}
      >
        {/* Logo + fechar (mobile) */}
        <div className="px-3 pt-5 pb-5 border-b border-[#1f1f1f] flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={closeMobile}
            className="flex items-center gap-2.5 px-2 min-w-0"
            title="Jay Academy"
          >
            <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
              <Hexagon size={15} className="text-[#0a0a0a]" strokeWidth={2.5} />
            </span>
            <p
              className={clsx(
                "font-semibold text-[15px] text-white tracking-tight leading-none truncate",
                hideOnCollapse
              )}
            >
              Jay Academy
            </p>
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Fechar menu"
            className="lg:hidden text-neutral-400 hover:text-white transition p-1.5 shrink-0"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <NavItem
            href="/dashboard"
            label="Home"
            icon={Home}
            active={isActive("/dashboard")}
            hideLabel={hideOnCollapse}
            center={collapsed}
            onNavigate={closeMobile}
          />

          <button
            type="button"
            onClick={onUrlsClick}
            title="Páginas"
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
              collapsed ? "lg:justify-center" : "",
              inUrls
                ? "text-white font-semibold"
                : "text-neutral-400 hover:bg-[#121212] hover:text-white font-medium"
            )}
          >
            <Link2 size={15} strokeWidth={2} className="shrink-0" />
            <span className={clsx("flex-1 text-left", hideOnCollapse)}>Páginas</span>
            <ChevronDown
              size={14}
              strokeWidth={2.2}
              className={clsx(
                "transition-transform",
                urlsOpen ? "rotate-180" : "",
                hideOnCollapse
              )}
            />
          </button>

          {urlsOpen && (
            <div
              className={clsx(
                "ml-3 pl-3 border-l border-[#1f1f1f] space-y-0.5",
                hideOnCollapse
              )}
            >
              {URL_CHILDREN.map((c) => (
                <NavItem
                  key={c.href}
                  href={c.href}
                  label={c.label}
                  icon={c.icon}
                  active={isActive(c.href)}
                  small
                  onNavigate={closeMobile}
                />
              ))}
            </div>
          )}

          <NavItem
            href="/leads"
            label="Leads"
            icon={Inbox}
            active={isActive("/leads")}
            hideLabel={hideOnCollapse}
            center={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/midia"
            label="Biblioteca de mídia"
            icon={ImageIcon}
            active={isActive("/midia")}
            hideLabel={hideOnCollapse}
            center={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/analytics"
            label="Analytics"
            icon={BarChart3}
            active={isActive("/analytics")}
            hideLabel={hideOnCollapse}
            center={collapsed}
            onNavigate={closeMobile}
          />
          <NavItem
            href="/settings"
            label="Configurações"
            icon={Settings}
            active={isActive("/settings")}
            hideLabel={hideOnCollapse}
            center={collapsed}
            onNavigate={closeMobile}
          />
        </nav>

        {/* Recolher (desktop) + usuário */}
        <div className="border-t border-[#1f1f1f] px-3 py-3 space-y-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir" : "Recolher"}
            className={clsx(
              "hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-[#121212] hover:text-white transition font-medium",
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
          <div className={hideOnCollapse}>
            <UserMenu user={user} />
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  small,
  hideLabel,
  center,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active: boolean;
  small?: boolean;
  hideLabel?: string;
  center?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      title={label}
      onClick={onNavigate}
      className={clsx(
        "flex items-center gap-3 px-3 rounded-lg transition",
        small ? "py-1.5 text-[13px]" : "py-2 text-sm",
        center ? "lg:justify-center" : "",
        active
          ? "bg-[#161616] text-white font-semibold"
          : "text-neutral-400 hover:bg-[#121212] hover:text-white font-medium"
      )}
    >
      <Icon size={small ? 14 : 15} strokeWidth={2} className="shrink-0" />
      <span className={clsx("truncate", hideLabel)}>{label}</span>
    </Link>
  );
}
