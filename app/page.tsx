import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrbitIcons } from "@/components/orbit-icons";
import { getCurrentUser } from "@/lib/auth";

export default async function LobbyPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
      <OrbitIcons />

      <div className="relative z-10 max-w-3xl px-6 text-center">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.04em] leading-none text-white">
          Jay Academy
        </h1>

        <div className="mt-10 flex items-center justify-center">
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-bold"
          >
            Acessar painel
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
