import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CornerDownRight,
  LayoutGrid,
  Pencil,
  Search,
  Settings2,
} from "lucide-react";
import { clsx } from "clsx";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { EmptyState } from "@/components/empty-state";
import { statusLabel, statusColors, relativeTime } from "@/lib/landing-pages";
import {
  assembleCatalog,
  catalogCounts,
  categoryLabel,
  loadCatalogSources,
  sourceColors,
  sourceLabel,
  sourceOrder,
  type CatalogEntry,
  type PageCategory,
  type PageSource,
} from "@/lib/page-catalog";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  fonte?: string;
  cat?: string;
  status?: string;
  q?: string;
}>;

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

/** Monta o href da própria tela preservando os demais filtros. */
function filterHref(
  current: { fonte?: string; cat?: string; status?: string; q?: string },
  patch: Partial<{ fonte: string; cat: string; status: string; q: string }>
): string {
  const params = new URLSearchParams();
  const next = { ...current, ...patch };
  for (const [k, v] of Object.entries(next)) {
    if (v) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `/paginas?${qs}` : "/paginas";
}

export default async function PaginasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sources = await loadCatalogSources();
  const all = assembleCatalog(sources);
  const counts = catalogCounts(all);

  const fonte = sp.fonte as PageSource | undefined;
  const cat = sp.cat as PageCategory | undefined;
  const status = sp.status;
  const q = (sp.q ?? "").toLowerCase().trim();

  const filtered = all.filter((e) => {
    if (fonte && e.source !== fonte) return false;
    if (cat && e.category !== cat) return false;
    if (status && e.status !== status) return false;
    if (
      q &&
      !stripHtml(e.title).toLowerCase().includes(q) &&
      !e.url.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar landingPages={sources.lps} savedWp={sources.saved} />

        <main className="flex-1 overflow-y-auto px-5 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
                Todas as páginas
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {counts.total} páginas públicas em {Object.keys(counts.bySource).length}{" "}
                tipos
                {counts.collisions > 0 && (
                  <span className="text-amber-300">
                    {" "}
                    · {counts.collisions}{" "}
                    {counts.collisions === 1 ? "colisão de slug" : "colisões de slug"}
                  </span>
                )}
              </p>
            </div>

            {/* Busca por texto (GET — preserva filtros via hidden inputs) */}
            <form action="/paginas" className="flex items-center gap-2">
              {fonte && <input type="hidden" name="fonte" value={fonte} />}
              {cat && <input type="hidden" name="cat" value={cat} />}
              {status && <input type="hidden" name="status" value={status} />}
              <div className="flex items-center gap-2 bg-[#0f0f0f] border border-[#1f1f1f] focus-within:border-neutral-700 rounded-lg px-3 py-2">
                <Search size={13} strokeWidth={2} className="text-neutral-500" />
                <input
                  type="text"
                  name="q"
                  defaultValue={sp.q ?? ""}
                  placeholder="Filtrar por nome ou URL..."
                  className="w-48 bg-transparent text-sm text-white placeholder:text-neutral-600 focus:outline-none"
                />
              </div>
            </form>
          </div>

          {/* Chips de filtro por fonte */}
          <div className="flex items-center gap-2 flex-wrap mt-4 mb-6">
            <FilterChip
              href={filterHref(sp, { fonte: "" })}
              active={!fonte}
              label={`Todas · ${counts.total}`}
            />
            {sourceOrder.map((s) => {
              const n = counts.bySource[s];
              if (!n) return null;
              const c = sourceColors[s];
              return (
                <FilterChip
                  key={s}
                  href={filterHref(sp, { fonte: fonte === s ? "" : s })}
                  active={fonte === s}
                  label={`${sourceLabel[s]} · ${n}`}
                  dotClass={c.dot}
                />
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="Nenhuma página com esses filtros"
              description="Ajuste os filtros ou limpe a busca pra ver o catálogo completo."
              action={{ label: "Limpar filtros", href: "/paginas" }}
            />
          ) : (
            <div className="border border-[#1f1f1f] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                      <Th>Página</Th>
                      <Th>Fonte</Th>
                      <Th>Categoria</Th>
                      <Th>Status</Th>
                      <Th>Atualizada</Th>
                      <Th right>Ações</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <CatalogRow key={e.url} entry={e} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Th({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <th
      className={clsx(
        "px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold",
        right ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

function FilterChip({
  href,
  active,
  label,
  dotClass,
}: {
  href: string;
  active: boolean;
  label: string;
  dotClass?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full ring-1 transition",
        active
          ? "bg-white text-black ring-white"
          : "bg-[#0f0f0f] text-neutral-300 ring-[#262626] hover:ring-neutral-600"
      )}
    >
      {dotClass && !active && (
        <span className={clsx("w-1.5 h-1.5 rounded-full", dotClass)} />
      )}
      {label}
    </Link>
  );
}

function CatalogRow({ entry }: { entry: CatalogEntry }) {
  const src = sourceColors[entry.source];
  const st = statusColors[entry.status];
  return (
    <tr className="border-b border-[#161616] last:border-0 hover:bg-[#0d0d0d] transition">
      <td className="px-4 py-3 min-w-[220px]">
        <div className="flex items-center gap-2">
          {entry.collision && (
            <span
              title="Colisão: este caminho existe em mais de uma camada — a listada aqui é a servida; a outra fica sombreada."
              className="shrink-0 text-amber-300"
            >
              <AlertTriangle size={13} strokeWidth={2.2} />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-white font-semibold truncate max-w-[320px]">
              {stripHtml(entry.title)}
            </p>
            <p className="text-[11px] text-neutral-500 font-mono truncate">
              {entry.url}
              {entry.redirectTo && (
                <span className="text-neutral-600">
                  {" "}
                  <CornerDownRight size={10} className="inline" /> {entry.redirectTo}
                </span>
              )}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge dot={src.dot} bg={src.bg} text={src.text}>
          {sourceLabel[entry.source]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-neutral-400 text-[13px]">
        {categoryLabel[entry.category]}
      </td>
      <td className="px-4 py-3">
        <Badge dot={st.dot} bg={st.bg} text={st.text}>
          {statusLabel[entry.status]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-[12px] text-neutral-500 whitespace-nowrap">
        {entry.lastModified ? relativeTime(entry.lastModified) : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {entry.status === "published" && !entry.redirectTo && (
            <RowAction
              href={entry.url}
              title="Abrir página"
              icon={<ArrowUpRight size={13} strokeWidth={2.2} />}
              external
            />
          )}
          {entry.editHref && (
            <RowAction
              href={entry.editHref}
              title="Editar"
              icon={<Pencil size={12} strokeWidth={2.2} />}
            />
          )}
          {entry.manageHref && (
            <RowAction
              href={entry.manageHref}
              title="Gerenciar"
              icon={<Settings2 size={13} strokeWidth={2.2} />}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

function Badge({
  dot,
  bg,
  text,
  children,
}: {
  dot: string;
  bg: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 whitespace-nowrap",
        bg,
        text
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", dot)} />
      {children}
    </span>
  );
}

function RowAction({
  href,
  title,
  icon,
  external,
}: {
  href: string;
  title: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  const cls =
    "w-7 h-7 rounded-md flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#161616] transition";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={cls}>
        {icon}
      </a>
    );
  }
  return (
    <Link href={href} title={title} className={cls}>
      {icon}
    </Link>
  );
}
