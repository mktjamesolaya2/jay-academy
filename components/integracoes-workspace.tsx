"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  Pencil,
  Power,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  User,
} from "lucide-react";
import {
  salvarIntegracaoAction,
  excluirIntegracaoAction,
  alternarIntegracaoAction,
  testarIntegracaoAction,
  salvarCrmAction,
} from "@/app/settings/integracoes/actions";
import type { Integracao, ParDeCampo, Crm } from "@/lib/integracoes";
import { CAMPOS_LEAD } from "@/lib/lead-campos";

type Resultado = Awaited<ReturnType<typeof testarIntegracaoAction>>;

const ETAPAS = ["Criação", "Mapeamento", "Configuração"] as const;

/**
 * Sugestões de campo do CRM — a lista completa que o James ditou (documento,
 * cargo, barreira, disposta a investir, estilo de sobrancelha…). Fica só como
 * sugestão do campo de texto: quem manda no nome é o CRM, não a gente.
 */
const CAMPOS_CRM = CAMPOS_LEAD.map((c) => c.id);

export function IntegracoesWorkspace({
  integracoes,
  crm,
  base,
}: {
  integracoes: Integracao[];
  crm: Crm | null;
  base: string;
}) {
  const [editando, setEditando] = useState<Integracao | "nova" | null>(null);
  const [resultado, setResultado] = useState<Record<string, Resultado>>({});
  const [copiado, setCopiado] = useState<string | null>(null);
  const [pendente, startTransition] = useTransition();

  const linkDe = (id: string) => `${base}/api/receber/${id}`;

  async function copiar(id: string) {
    await navigator.clipboard.writeText(linkDe(id));
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1800);
  }

  function testar(id: string) {
    startTransition(async () => {
      const r = await testarIntegracaoAction(id);
      setResultado((antes) => ({ ...antes, [id]: r }));
    });
  }

  if (editando) {
    return (
      <Assistente
        integracao={editando === "nova" ? null : editando}
        linkDe={linkDe}
        onFechar={() => setEditando(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-neutral-500">
          {integracoes.length === 0
            ? "Nenhuma integração ainda."
            : `${integracoes.length} integraç${integracoes.length === 1 ? "ão" : "ões"}`}
        </p>
        <button
          onClick={() => setEditando("nova")}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          <Plus size={15} strokeWidth={2.4} />
          Nova integração
        </button>
      </div>

      {integracoes.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#262626] px-6 py-10 text-center">
          <p className="text-sm font-semibold text-neutral-300">
            Crie a primeira integração
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-neutral-500">
            Dá o nome, o link é gerado na hora. Cola esse link no formulário e o
            lead começa a cair aqui.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {integracoes.map((i) => {
          const r = resultado[i.id];
          return (
            <div key={i.id} className="rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${i.ativo ? "bg-emerald-400" : "bg-neutral-600"}`}
                    />
                    <h3 className="truncate text-[15px] font-semibold text-white">{i.nome}</h3>
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      {i.tipo}
                    </span>
                    {!i.ativo && (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                        desligada
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[12px] text-neutral-500">
                    {i.recebidos
                      ? `${i.recebidos} lead${i.recebidos === 1 ? "" : "s"}`
                      : "nenhum lead ainda"}
                    {i.tags.length ? ` · tags: ${i.tags.join(", ")}` : ""}
                    {i.etapaCriacao ? ` · etapa: ${i.etapaCriacao}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => testar(i.id)}
                    disabled={pendente}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] px-3 py-2 text-[12.5px] font-semibold text-neutral-300 transition hover:border-neutral-600 hover:text-white disabled:opacity-60"
                  >
                    {pendente ? (
                      <Loader2 size={13} strokeWidth={2.4} className="animate-spin" />
                    ) : (
                      <Send size={13} strokeWidth={2.4} />
                    )}
                    Testar
                  </button>
                  <button
                    onClick={() => setEditando(i)}
                    aria-label={`Editar ${i.nome}`}
                    className="rounded-lg border border-[#262626] p-2 text-neutral-400 transition hover:border-neutral-600 hover:text-white"
                  >
                    <Pencil size={13} strokeWidth={2.4} />
                  </button>
                  <form action={alternarIntegracaoAction}>
                    <input type="hidden" name="id" value={i.id} />
                    <button
                      type="submit"
                      aria-label={i.ativo ? "Desligar" : "Ligar"}
                      className="rounded-lg border border-[#262626] p-2 text-neutral-400 transition hover:border-neutral-600 hover:text-white"
                    >
                      <Power size={13} strokeWidth={2.4} />
                    </button>
                  </form>
                  <form action={excluirIntegracaoAction}>
                    <input type="hidden" name="id" value={i.id} />
                    <button
                      type="submit"
                      aria-label={`Excluir ${i.nome}`}
                      className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                    >
                      <Trash2 size={13} strokeWidth={2.2} />
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-[#1f1f1f] bg-black/40 px-3 py-2.5 font-mono text-[12px] text-neutral-300">
                  {linkDe(i.id)}
                </code>
                <button
                  onClick={() => copiar(i.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#0a0a0a] transition hover:bg-neutral-200"
                >
                  {copiado === i.id ? (
                    <>
                      <Check size={13} strokeWidth={2.6} /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={13} strokeWidth={2.4} /> Copiar link
                    </>
                  )}
                </button>
              </div>

              {r && <Resposta r={r} />}
            </div>
          );
        })}
      </div>

      <ConfigCrm crm={crm} />
    </div>
  );
}

function Resposta({ r }: { r: Resultado }) {
  const bom = r.ok;
  return (
    <div
      className={`mt-4 rounded-lg border px-3 py-2.5 ${bom ? "border-emerald-500/25 bg-emerald-500/10" : "border-rose-500/25 bg-rose-500/10"}`}
    >
      <p className={`flex items-center gap-2 text-[12.5px] font-semibold ${bom ? "text-emerald-300" : "text-rose-300"}`}>
        {bom ? <CheckCircle2 size={14} strokeWidth={2.4} /> : <XCircle size={14} strokeWidth={2.4} />}
        {r.semCrm
          ? "Sem CRM configurado ainda — o lead ficaria guardado no portal"
          : bom
          ? `CRM recebeu (HTTP ${r.http})`
          : `CRM não recebeu${r.http ? ` (HTTP ${r.http})` : ""}`}
      </p>
      {r.erro && <p className="mt-1 break-words font-mono text-[11.5px] text-neutral-400">{r.erro}</p>}
      {r.enviado && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11.5px] text-neutral-400 hover:text-white">
            Ver o que seria enviado
          </summary>
          <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-neutral-300">
            {r.enviado}
          </pre>
        </details>
      )}
    </div>
  );
}

/* ── O assistente, nas mesmas etapas do Clint ───────────────────────────── */

function Assistente({
  integracao,
  linkDe,
  onFechar,
}: {
  integracao: Integracao | null;
  linkDe: (id: string) => string;
  onFechar: () => void;
}) {
  const [etapa, setEtapa] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pendente, startTransition] = useTransition();

  const [tipo, setTipo] = useState(integracao?.tipo ?? "negocio");
  const [acao, setAcao] = useState(integracao?.acao ?? "criar_ou_atualizar");
  const [nome, setNome] = useState(integracao?.nome ?? "");
  const [pares, setPares] = useState<ParDeCampo[]>(
    integracao?.mapeamento ?? [
      { doFormulario: "name", paraOCrm: "nome" },
      { doFormulario: "email", paraOCrm: "email" },
      { doFormulario: "phone", paraOCrm: "telefone" },
    ]
  );
  const [id, setId] = useState(integracao?.id ?? "");

  const link = id ? linkDe(id) : null;

  function salvar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await salvarIntegracaoAction(fd);
      if (!r.ok) return setErro(r.error ?? "Erro ao salvar");
      // o link nasce no salvar, como no Clint: deu o nome, tem o link
      if (r.id) setId(r.id);
      if (etapa < ETAPAS.length - 1) setEtapa((e) => e + 1);
      else onFechar();
    });
  }

  async function copiar() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <form action={salvar} className="max-w-3xl space-y-7">
      {id && <input type="hidden" name="id" value={id} />}

      {/* trilha das etapas */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-[#1f1f1f] pb-5">
        {ETAPAS.map((e, n) => (
          <li key={e} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (id || n === 0) && setEtapa(n)}
              disabled={!id && n > 0}
              className={`flex items-center gap-2 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${n === etapa ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${n === etapa ? "bg-white text-[#0a0a0a]" : "bg-neutral-800 text-neutral-400"}`}
              >
                {n + 1}
              </span>
              {e}
            </button>
            {n < ETAPAS.length - 1 && (
              <ChevronRight size={14} strokeWidth={2.4} className="text-neutral-700" />
            )}
          </li>
        ))}
      </ol>

      {erro && (
        <p className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12.5px] font-medium text-rose-300">
          {erro}
        </p>
      )}

      {/* Os campos das outras etapas continuam no formulário mesmo escondidos —
          é o que permite salvar tudo de uma vez em qualquer etapa. */}
      <div className={etapa === 0 ? "space-y-5" : "hidden"}>
        <p className="text-[13px] text-neutral-400">
          O que criar quando esse lead chegar?
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Escolha
            marcado={tipo === "negocio"}
            onClick={() => setTipo("negocio")}
            icone={<Briefcase size={18} strokeWidth={1.8} />}
            titulo="Negócio"
            texto="A oportunidade de venda daquela pessoa."
          />
          <Escolha
            marcado={tipo === "contato"}
            onClick={() => setTipo("contato")}
            icone={<User size={18} strokeWidth={1.8} />}
            titulo="Contato"
            texto="Só os dados da pessoa, sem oportunidade."
          />
        </div>
        <input type="hidden" name="tipo" value={tipo} />

        <div className="flex flex-wrap gap-2">
          {[
            ["criar", "Criar"],
            ["atualizar", "Atualizar"],
            ["criar_ou_atualizar", "Criar ou atualizar"],
          ].map(([v, r]) => (
            <button
              key={v}
              type="button"
              onClick={() => setAcao(v as typeof acao)}
              className={`rounded-lg border px-4 py-2 text-[12.5px] font-semibold transition ${acao === v ? "border-white bg-white text-[#0a0a0a]" : "border-[#262626] text-neutral-300 hover:border-neutral-600"}`}
            >
              {r}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-neutral-500">
          Se a pessoa já existir no CRM, ela é reconhecida pelo e-mail ou pelo
          telefone.
        </p>
        <input type="hidden" name="acao" value={acao} />

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Nome da integração
          </span>
          <input
            name="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Ex: LP Basic NanoFios"
            className={entrada}
          />
        </label>

        {link && (
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Link de integração
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-[#1f1f1f] bg-black/40 px-3 py-2.5 font-mono text-[12px] text-neutral-300">
                {link}
              </code>
              <button
                type="button"
                onClick={copiar}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#0a0a0a] transition hover:bg-neutral-200"
              >
                {copiado ? (
                  <>
                    <Check size={13} strokeWidth={2.6} /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={13} strokeWidth={2.4} /> Copiar link
                  </>
                )}
              </button>
            </div>
          </label>
        )}
      </div>

      <div className={etapa === 1 ? "space-y-4" : "hidden"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-neutral-400">Mapeamento de campos</p>
          <button
            type="button"
            onClick={() => setPares((p) => [...p, { doFormulario: "", paraOCrm: "" }])}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-neutral-300 transition hover:text-white"
          >
            <Plus size={13} strokeWidth={2.6} /> Adicionar campo
          </button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          <span>Nome do campo no seu formulário</span>
          <span>Mapear campo para</span>
          <span />
        </div>
        {pares.map((p, n) => (
          <div key={n} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
            <input
              name="mapDe"
              defaultValue={p.doFormulario}
              placeholder="ex: your-name"
              className={`${entrada} py-2 font-mono text-[12px]`}
            />
            <input
              name="mapPara"
              defaultValue={p.paraOCrm}
              list="campos-crm"
              placeholder="ex: nome"
              className={`${entrada} py-2 font-mono text-[12px]`}
            />
            <button
              type="button"
              onClick={() => setPares((tudo) => tudo.filter((_, i) => i !== n))}
              aria-label="Remover campo"
              className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
            >
              <Trash2 size={13} strokeWidth={2.2} />
            </button>
          </div>
        ))}
        <datalist id="campos-crm">
          {CAMPOS_CRM.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <p className="text-[12px] leading-relaxed text-neutral-500">
          O que não estiver aqui passa direto, com o nome original. Mapear
          <strong className="font-semibold text-neutral-300"> e-mail ou telefone </strong>
          é o que deixa o CRM reconhecer quem já é cliente.
        </p>
      </div>

      <div className={etapa === 2 ? "space-y-4" : "hidden"}>
        <Campo rotulo="Tags" ajuda="Separadas por vírgula. Todo lead desta integração recebe.">
          <input
            name="tags"
            defaultValue={integracao?.tags.join(", ")}
            placeholder="nanofios, instagram"
            className={entrada}
          />
        </Campo>
        <Campo rotulo="Etapa para criação" ajuda="Onde o lead entra quando é novo.">
          <input
            name="etapaCriacao"
            defaultValue={integracao?.etapaCriacao}
            placeholder="Base"
            className={entrada}
          />
        </Campo>
        <Campo rotulo="Etapa para atualização" ajuda="Deixe em branco pra manter a etapa em que ele já está.">
          <input
            name="etapaAtualizacao"
            defaultValue={integracao?.etapaAtualizacao}
            placeholder="manter a etapa"
            className={entrada}
          />
        </Campo>
        <Campo rotulo="Status">
          <input
            name="status"
            defaultValue={integracao?.status}
            placeholder="Aberto"
            className={entrada}
          />
        </Campo>
      </div>

      <div className="flex items-center gap-3 border-t border-[#1f1f1f] pt-5">
        {etapa > 0 && (
          <button
            type="button"
            onClick={() => setEtapa((e) => e - 1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#262626] px-4 py-2.5 text-sm font-semibold text-neutral-300 transition hover:border-neutral-600 hover:text-white"
          >
            <ChevronLeft size={14} strokeWidth={2.4} /> Voltar
          </button>
        )}
        <button
          type="submit"
          disabled={pendente}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {pendente && <Loader2 size={14} strokeWidth={2.4} className="animate-spin" />}
          {etapa < ETAPAS.length - 1 ? "Continuar" : "Concluir"}
        </button>
        <button
          type="button"
          onClick={onFechar}
          className="text-sm font-semibold text-neutral-500 transition hover:text-white"
        >
          Fechar
        </button>
      </div>
    </form>
  );
}

function Escolha({
  marcado,
  onClick,
  icone,
  titulo,
  texto,
}: {
  marcado: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-5 text-left transition ${marcado ? "border-white bg-white/[0.06]" : "border-[#262626] hover:border-neutral-600"}`}
    >
      <span className={marcado ? "text-white" : "text-neutral-500"}>{icone}</span>
      <p className={`mt-2 text-[14px] font-semibold ${marcado ? "text-white" : "text-neutral-300"}`}>
        {titulo}
      </p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-neutral-500">{texto}</p>
    </button>
  );
}

/** Onde fica o CRM — um só, embaixo de tudo, porque se mexe uma vez na vida. */
function ConfigCrm({ crm }: { crm: Crm | null }) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pendente, startTransition] = useTransition();

  function salvar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await salvarCrmAction(fd);
      if (!r.ok) setErro(r.error ?? "Erro ao salvar");
      else {
        setSalvo(true);
        setTimeout(() => setSalvo(false), 2200);
      }
    });
  }

  return (
    <section className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d]">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-white">Endereço do CRM</p>
          <p className="mt-0.5 truncate text-[12px] text-neutral-500">
            {crm?.url
              ? "Configurado — todo lead é enviado pra lá"
              : "Ainda não configurado — os leads ficam guardados no portal"}
          </p>
        </div>
        <ChevronRight
          size={15}
          strokeWidth={2.4}
          className={`shrink-0 text-neutral-500 transition ${aberto ? "rotate-90" : ""}`}
        />
      </button>
      {aberto && (
        <form action={salvar} className="space-y-3.5 border-t border-[#1f1f1f] p-4 sm:p-5">
          <Campo rotulo="Endereço" ajuda="O endereço que o Lucas passar. Em branco = os leads só ficam no portal.">
            <input
              name="crmUrl"
              defaultValue={crm?.url}
              placeholder="https://…"
              className={`${entrada} font-mono text-[12.5px]`}
            />
          </Campo>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo rotulo="Cabeçalho (se pedir senha)">
              <input
                name="crmHeader"
                defaultValue={crm?.header}
                placeholder="x-api-key"
                className={`${entrada} font-mono text-[12.5px]`}
              />
            </Campo>
            <Campo rotulo="Token">
              <input
                name="crmToken"
                type="password"
                defaultValue={crm?.token}
                className={`${entrada} font-mono text-[12.5px]`}
              />
            </Campo>
          </div>
          {erro && <p className="text-[12.5px] font-medium text-rose-300">{erro}</p>}
          <button
            type="submit"
            disabled={pendente}
            className="inline-flex items-center gap-2 rounded-lg border border-[#262626] px-4 py-2.5 text-[13px] font-semibold text-neutral-200 transition hover:border-neutral-600 hover:text-white disabled:opacity-60"
          >
            {pendente && <Loader2 size={13} strokeWidth={2.4} className="animate-spin" />}
            {salvo ? "Salvo" : "Salvar endereço"}
          </button>
        </form>
      )}
    </section>
  );
}

const entrada =
  "w-full rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none";

function Campo({
  rotulo,
  ajuda,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
        {rotulo}
      </span>
      {children}
      {ajuda && <span className="mt-1.5 block text-[12px] text-neutral-500">{ajuda}</span>}
    </label>
  );
}
