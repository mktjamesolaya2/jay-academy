import Link from "next/link";
import { Hexagon } from "lucide-react";

export function Topbar() {
  return (
    <header className="relative z-10 w-full">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <Hexagon size={15} className="text-[#0a0a0a]" strokeWidth={2.5} />
          </span>
          <span className="font-bold text-[17px] text-white tracking-tight">
            Jay Academy
          </span>
        </Link>
      </div>
    </header>
  );
}
