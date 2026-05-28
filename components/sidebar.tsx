import Link from "next/link";
import { Hexagon } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { getCurrentUser } from "@/lib/auth";

export async function Sidebar() {
  const user = await getCurrentUser();

  return (
    <aside className="w-60 shrink-0 border-r border-[#1f1f1f] bg-[#0a0a0a] flex flex-col h-screen sticky top-0">
      <div className="px-5 pt-5 pb-5 border-b border-[#1f1f1f]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <Hexagon size={15} className="text-[#0a0a0a]" strokeWidth={2.5} />
          </span>
          <p className="font-semibold text-[15px] text-white tracking-tight leading-none">
            Jay Academy
          </p>
        </Link>
      </div>

      <SidebarNav />

      <div className="border-t border-[#1f1f1f] px-3 py-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
