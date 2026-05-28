import Link from "next/link";
import { ArrowLeft, Plus, Info } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { DashboardTopbar } from "@/components/dashboard-topbar";
import { loadLps } from "@/lib/lp-store";
import { listSaved } from "@/lib/wp-content-storage";
import { createLpAction } from "@/app/lps/actions";

export const dynamic = "force-dynamic";

const ACCENT_OPTIONS = [
  { value: "pink-orange", label: "Pink → Orange" },
  { value: "purple-fuchsia", label: "Purple → Fuchsia" },
  { value: "amber-orange", label: "Amber → Orange" },
  { value: "gold-black", label: "Gold → Black" },
  { value: "rose", label: "Rose" },
];

const TYPE_OPTIONS = [
  { value: "lp", label: "Landing page (página única)" },
  { value: "website", label: "Website (multi-página)" },
];

export default async function NewLpPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const [landingPages, savedWp] = await Promise.all([loadLps(), listSaved()]);
  const defaultType = sp.type === "website" ? "website" : "lp";

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar landingPages={landingPages} savedWp={savedWp} />

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-2xl">
            <Link
              href="/lps"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Voltar
            </Link>

            <h1 className="text-2xl font-semibold text-white tracking-[-0.02em]">
              Nova página
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Cria um rascunho. O conteúdo é construído depois.
            </p>

            <div className="mt-6 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
              <Info
                size={14}
                strokeWidth={2.2}
                className="text-amber-300 mt-0.5 shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-amber-200">
                  Sobre criar páginas
                </p>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Esse formulário cria apenas o registro da página no portal
                  (como rascunho). Pra construir o HTML/visual,{" "}
                  <span className="text-white">peça pro programador</span> ou
                  importe do WordPress.
                </p>
              </div>
            </div>

            <form action={createLpAction} className="mt-6 space-y-4">
              <Field
                label="Nome da página"
                name="name"
                placeholder="Ex: Curso Lips Sense PRO"
                required
              />

              <Field
                label="Slug (URL)"
                name="slug"
                placeholder="curso-lips-sense-pro"
                hint="Se vazio, gera do nome. Será o path na URL final."
              />

              <Field
                label="Tagline"
                name="tagline"
                placeholder="Frase curta editorial (opcional)"
              />

              <Textarea
                label="Descrição"
                name="description"
                placeholder="Pra que serve essa página, público alvo, etc."
                rows={3}
              />

              <Select
                label="Tipo"
                name="type"
                defaultValue={defaultType}
                options={TYPE_OPTIONS}
              />

              <Select
                label="Acento visual (cor do card)"
                name="accent"
                defaultValue="rose"
                options={ACCENT_OPTIONS}
              />

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="submit"
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                >
                  <Plus size={14} strokeWidth={2.4} />
                  Criar rascunho
                </button>
                <Link
                  href="/lps"
                  className="text-sm font-medium text-neutral-500 hover:text-white transition"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-1.5">
        {label}
        {required && <span className="text-neutral-600 ml-1">*</span>}
      </span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition"
      />
      {hint && (
        <span className="block text-[11px] text-neutral-600 mt-1">{hint}</span>
      )}
    </label>
  );
}

function Textarea({
  label,
  name,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-1.5">
        {label}
      </span>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition resize-none"
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-1.5">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-neutral-600 transition"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
