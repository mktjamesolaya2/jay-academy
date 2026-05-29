import Link from "next/link";
import { ArrowLeft, FolderOpen, Plug } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { connectLp } from "@/lib/connect-lp";

type Params = Promise<{ folder: string }>;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ACCENT_OPTIONS = [
  { value: "pink-orange", label: "Pink → Orange" },
  { value: "purple-fuchsia", label: "Purple → Fuchsia" },
  { value: "amber-orange", label: "Amber → Orange" },
  { value: "gold-black", label: "Gold → Black" },
  { value: "rose", label: "Rose" },
];

const TYPE_OPTIONS = [
  { value: "lp", label: "Landing page (única)" },
  { value: "website", label: "Website (multi-página)" },
  { value: "form", label: "Formulário" },
];

export default async function ConnectLpPage({ params }: { params: Params }) {
  const { folder } = await params;
  const decodedFolder = decodeURIComponent(folder);
  const suggestedSlug = slugify(decodedFolder);
  const suggestedName = decodedFolder
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1">
        <header className="border-b border-[#1f1f1f] px-10 pt-8 pb-7">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-white mb-5 transition"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Voltar pro dashboard
          </Link>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold">
            <FolderOpen size={12} strokeWidth={2} />
            Pasta detectada
          </div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white mt-2">
            Conectar{" "}
            <span className="font-mono text-neutral-300 text-2xl">
              {decodedFolder}/
            </span>
          </h2>
          <p className="text-neutral-400 mt-1.5 max-w-xl text-[15px]">
            Preencha os campos abaixo. A LP vai aparecer no dashboard logo
            depois.
          </p>
        </header>

        <section className="px-10 py-8 max-w-3xl">
          <form action={connectLp} className="space-y-5">
            <input type="hidden" name="folder" value={decodedFolder} />

            <Field
              label="Nome"
              name="name"
              defaultValue={suggestedName}
              placeholder="Ex: Magic Shadow"
              required
            />

            <Field
              label="Slug (URL)"
              name="slug"
              defaultValue={suggestedSlug}
              placeholder="ex: magic-shadow"
              hint={`Será acessível em /lps/${suggestedSlug}`}
              required
            />

            <Field
              label="Tagline"
              name="tagline"
              placeholder="Frase editorial curta"
            />

            <Textarea
              label="Descrição"
              name="description"
              placeholder="O que essa LP é, pra quem, etc."
              rows={3}
            />

            <Field
              label="URL local de dev (opcional)"
              name="devUrl"
              placeholder="http://localhost:3000"
              hint="Pra abrir direto pelo card no dashboard"
            />

            <Select label="Tipo" name="type" options={TYPE_OPTIONS} />
            <Select label="Acento visual" name="accent" options={ACCENT_OPTIONS} />

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
              >
                <Plug size={14} strokeWidth={2.5} />
                Conectar LP
              </button>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-neutral-500 hover:text-white transition"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </main>
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
      <span className="block text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-2">
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
        <span className="block text-[11px] text-neutral-600 mt-1.5">
          {hint}
        </span>
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
      <span className="block text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-2">
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
  options,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.16em] text-neutral-500 font-semibold mb-2">
        {label}
      </span>
      <select
        name={name}
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
