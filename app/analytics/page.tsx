import { Sidebar } from "@/components/sidebar";
import { TrendingUp, MousePointerClick, Eye } from "lucide-react";
import { landingPages } from "@/lib/landing-pages";

export default function AnalyticsPage() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
            Analytics
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-1">
            Métricas consolidadas.
          </h2>
          <p className="text-neutral-400 mt-1.5 max-w-xl text-[15px]">
            Visitas (GA4) e cliques (Meta Pixel) das suas LPs num lugar só.
          </p>
        </header>

        <section className="px-10 py-7 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="Visitas (30d)" value="—" icon={Eye} />
          <Card label="Cliques CTA" value="—" icon={MousePointerClick} />
          <Card label="Conversão média" value="—" icon={TrendingUp} />
        </section>

        <section className="px-10 pb-10">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
                Por LP
              </p>
              <h3 className="text-xl font-semibold text-white mt-1 tracking-[-0.02em]">
                Desempenho individual
              </h3>
            </div>
          </div>

          <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-neutral-500 font-semibold bg-[#0d0d0d] border-b border-[#1f1f1f]">
                  <th className="px-6 py-3.5">LP</th>
                  <th className="px-6 py-3.5">Path</th>
                  <th className="px-6 py-3.5 text-right">Visitas</th>
                  <th className="px-6 py-3.5 text-right">Cliques</th>
                  <th className="px-6 py-3.5 text-right">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {landingPages.map((lp) => (
                  <tr
                    key={lp.slug}
                    className="border-b border-[#161616] last:border-0 hover:bg-[#121212] transition"
                  >
                    <td className="px-6 py-4 text-white font-semibold">
                      {lp.name}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 text-xs font-mono">
                      /{lp.slug}
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-700 font-semibold">
                      —
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-700 font-semibold">
                      —
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-700 font-semibold">
                      —
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[12px] text-neutral-500 mt-5 leading-relaxed max-w-2xl">
            Pra trazer dados reais: (1) GA4 Measurement API pras visitas, (2)
            Meta Conversions API pros cliques. Tudo via env vars no Vercel
            quando deployar.
          </p>
        </section>
      </main>
    </div>
  );
}

function Card({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 font-semibold">
          {label}
        </p>
        <span className="w-8 h-8 rounded-lg bg-[#161616] flex items-center justify-center">
          <Icon size={14} strokeWidth={2} className="text-neutral-400" />
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-[-0.02em] text-neutral-700">
        {value}
      </p>
      <p className="text-xs text-neutral-500 mt-1 font-medium">aguardando dados</p>
    </div>
  );
}
