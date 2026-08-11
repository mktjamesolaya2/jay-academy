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
} from "lucide-react";
import {
  salvarDestinoAction,
  excluirDestinoAction,
  testarDestinoAction,
} from "@/app/settings/integracoes/actions";
import { CAMPOS_LEAD, mapeamentoSugerido } from "@/lib/lead-campos";
import { urlSegura, type Destino } from "@/lib/lead-destinos-core";

type Resultado = Awaited<ReturnType<typeof testarDestinoAction>>;

const GRUPOS = ["Contato", "Empresa", "Origem", "Qualificação", "Formação"] as const;

/** Etiqueta de onde o valor daquele campo nasce — evita promessa falsa. */
const DE_ROTULO: Record<string, string> = {
  formulario: "do formulário",
  automatico: "automático",
  conversa: "do atendimento",
};

export function IntegracoesWorkspace({
  destinos,
  origens,
}: {
  destinos: Destino[];
  origens: string[];
}) {
  const [editando, setEditando] = useState<Destino | "novo" | null>(null);
  const [resultado, setResultado] = useState<Record<string, Resultado>>({});
  const [pendente, startTransition] = useTransition();

  function testar(id: string) {
    startTransition(async () => {
      const r = await testarDestinoAction(id);
      setResultado((antes) => ({ ...antes, [id]: r }));
    });
  }

  if (editando) {
    return (
      <Editor
        destino={editando === "novo" ? null : editando}
        origens={origens}
        onFechar={() => setEditando(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-neutral-500">
          {destinos.length === 0
            ? "Nenhum destino ainda — o lead só fica guardado no portal."
            : `${destinos.length} destino${destinos.length === 1 ? "" : "s"} · o lead vai pra todos ao mesmo tempo`}
        </p>
        <button
          onClick={() => setEditando("novo")}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          <Plus size={15} strokeWidth={2.4} />
          Nova integração
        </button>
      </div>

      {destinos.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#262626] px-6 py-10 text-center">
          <p className="text-sm font-semibold text-neutral-300">
            Comece cadastrando o CRM
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-neutral-500">
            Cole o link que o Lucas mandar, mapeie os campos e teste antes de
            qualquer campanha subir. O Clint continua recebendo pelo caminho
            antigo — nada aqui desliga ele.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {destinos.map((d) => {
          const r = resultado[d.id];
          return (
            <div
              key={d.id}
              className="rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${d.ativo ? "bg-emerald-400" : "bg-neutral-600"}`}
                    />
                    <h3 className="truncate text-[15px] font-semibold text-white">
                      {d.nome}
                    </h3>
                    {!d.ativo && (
                      <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                        desligado
                      </span>
                    )}
                  </div>
                  {/* a url nunca aparece inteira: no Clint o link É a senha */}
                  <p className="mt-1 truncate font-mono text-[11.5px] text-neutral-500">
                    {urlSegura(d.url)}
                  </p>
                  <p className="mt-1.5 text-[12px] text-neutral-500">
                    {Object.keys(d.mapeamento).length} campos mapeados
                    {d.tagsFixas?.length ? ` · tags: ${d.tagsFixas.join(", ")}` : ""}
                    {d.somenteDe?.length
                      ? ` · só de: ${d.somenteDe.join(", ")}`
                      : " · recebe de todas as páginas"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => testar(d.id)}
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
                    onClick={() => setEditando(d)}
                    aria-label={`Editar ${d.nome}`}
                    className="rounded-lg border border-[#262626] p-2 text-neutral-400 transition hover:border-neutral-600 hover:text-white"
                  >
                    <Pencil size={13} strokeWidth={2.4} />
                  </button>
                  <form action={excluirDestinoAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      aria-label={`Excluir ${d.nome}`}
                      className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                    >
                      <Trash2 size={13} strokeWidth={2.2} />
                    </button>
                  </form>
                </div>
              </div>

              {r && (
                <div
                  className={`mt-4 rounded-lg border px-3 py-2.5 ${
                    r.ok
                      ? "border-emerald-500/25 bg-emerald-500/10"
                      : "border-rose-500/25 bg-rose-500/10"
                  }`}
                >
                  <p
                    className={`flex items-center gap-2 text-[12.5px] font-semibold ${r.ok ? "text-emerald-300" : "text-rose-300"}`}
                  >
                    {r.ok ? (
                      <CheckCircle2 size={14} strokeWidth={2.4} />
                    ) : (
                      <XCircle size={14} strokeWidth={2.4} />
                    )}
                    {r.ok
                      ? `Recebeu (HTTP ${r.http})`
                      : `Não recebeu${r.http ? ` (HTTP ${r.http})` : ""}`}
                  </p>
                  {r.erro && (
                    <p className="mt-1 break-words font-mono text-[11.5px] text-neutral-400">
                      {r.erro}
                    </p>
                  )}
                  {r.enviado && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11.5px] text-neutral-400 hover:text-white">
                        Ver o que foi enviado
                      </summary>
                      <pre className="mt-2 max-h-56 overflow-auto rounded-md bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-neutral-300">
                        {r.enviado}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Editor({
  destino,
  origens,
  onFechar,
}: {
  destino: Destino | null;
  origens: string[];
  onFechar: () => void;
}) {
  const sugestao = mapeamentoSugerido();
  const mapa = destino?.mapeamento ?? sugestao;
  const [erro, setErro] = useState<string | null>(null);
  const [authTipo, setAuthTipo] = useState(destino?.auth?.tipo ?? "nenhuma");
  const [pendente, startTransition] = useTransition();

  function salvar(fd: FormData) {
    setErro(null);
    startTransition(async () => {
      const r = await salvarDestinoAction(fd);
      if (r.ok) onFechar();
      else setErro(r.error ?? "Erro ao salvar");
    });
  }

  return (
    <form action={salvar} className="max-w-3xl space-y-8">
      {destino && <input type="hidden" name="id" value={destino.id} />}

      {erro && (
        <p className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12.5px] font-medium text-rose-300">
          {erro}
        </p>
      )}

      {/* ── Geral ─────────────────────────────────────────────────────── */}
      <Secao titulo="Geral" descricao="Quem é e pra onde manda.">
        <Campo rotulo="Nome da integração">
          <input
            name="nome"
            defaultValue={destino?.nome}
            required
            placeholder="CRM Jay Academy"
            className={entrada}
          />
        </Campo>
        <Campo
          rotulo="Link do webhook"
          ajuda="O endereço que o CRM te dá pra receber os leads."
        >
          <input
            name="url"
            defaultValue={destino?.url}
            required
            placeholder="https://…"
            className={`${entrada} font-mono text-[12.5px]`}
          />
        </Campo>
        <Campo rotulo="Autenticação" ajuda="Deixe em 'nenhuma' se o segredo já está no link (é o caso do Clint).">
          <select
            name="authTipo"
            value={authTipo}
            onChange={(e) => setAuthTipo(e.target.value as typeof authTipo)}
            className={entrada}
          >
            <option value="nenhuma">Nenhuma — o link já é o segredo</option>
            <option value="bearer">Token Bearer</option>
            <option value="header">Cabeçalho próprio</option>
          </select>
        </Campo>
        {authTipo === "header" && (
          <Campo rotulo="Nome do cabeçalho">
            <input
              name="authHeader"
              defaultValue={destino?.auth?.tipo === "header" ? destino.auth.header : ""}
              placeholder="x-api-key"
              className={`${entrada} font-mono text-[12.5px]`}
            />
          </Campo>
        )}
        {authTipo !== "nenhuma" && (
          <Campo rotulo="Token">
            <input
              name="authValor"
              type="password"
              defaultValue={
                destino?.auth && destino.auth.tipo !== "nenhuma" ? destino.auth.valor : ""
              }
              className={`${entrada} font-mono text-[12.5px]`}
            />
          </Campo>
        )}
        <label className="flex items-center gap-2.5 pt-1">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={destino?.ativo ?? true}
            className="h-4 w-4 accent-white"
          />
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-300">
            <Power size={13} strokeWidth={2.4} />
            Ligada — recebendo leads
          </span>
        </label>
      </Secao>

      {/* ── Mapeamento ────────────────────────────────────────────────── */}
      <Secao
        titulo="Mapeamento"
        descricao="Como cada campo se chama lá do outro lado. Campo em branco não é enviado."
      >
        {GRUPOS.map((grupo) => (
          <div key={grupo} className="pt-1">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              {grupo}
            </p>
            <div className="grid gap-2">
              {CAMPOS_LEAD.filter((c) => c.grupo === grupo).map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                >
                  <span className="truncate text-[13px] text-neutral-300">
                    {c.rotulo}
                    <span className="ml-1.5 text-[11px] text-neutral-600">
                      {DE_ROTULO[c.de]}
                    </span>
                  </span>
                  <input
                    name={`map[${c.id}]`}
                    defaultValue={mapa[c.id] ?? ""}
                    placeholder={sugestao[c.id]}
                    className={`${entrada} py-2 font-mono text-[12px]`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Secao>

      {/* ── Configuração ──────────────────────────────────────────────── */}
      <Secao
        titulo="Configuração"
        descricao="Tags, etapa e status — o que o CRM precisa saber além dos dados da pessoa."
      >
        <Campo
          rotulo="Tags fixas"
          ajuda="Separadas por vírgula. Todo lead deste destino recebe, além da tag da própria página."
        >
          <input
            name="tags"
            defaultValue={destino?.tagsFixas?.join(", ")}
            placeholder="site, jayacademy"
            className={entrada}
          />
        </Campo>
        <Campo
          rotulo="Campos fixos"
          ajuda="Etapa, status, tipo de registro — o que o CRM exige em todo lead."
        >
          <div className="space-y-2">
            {[0, 1, 2].map((i) => {
              const pares = Object.entries(destino?.extras ?? {});
              return (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    name="extraChave"
                    defaultValue={pares[i]?.[0] ?? ""}
                    placeholder={i === 0 ? "etapa" : i === 1 ? "status" : "campo"}
                    className={`${entrada} py-2 font-mono text-[12px]`}
                  />
                  <input
                    name="extraValor"
                    defaultValue={pares[i]?.[1] ?? ""}
                    placeholder={i === 0 ? "Base" : i === 1 ? "Aberto" : "valor"}
                    className={`${entrada} py-2 font-mono text-[12px]`}
                  />
                </div>
              );
            })}
          </div>
        </Campo>
        <Campo
          rotulo="Receber só destas páginas"
          ajuda={`Separadas por vírgula. Em branco = recebe de todas.${origens.length ? ` Ex: ${origens.slice(0, 3).join(", ")}` : ""}`}
        >
          <input
            name="somenteDe"
            defaultValue={destino?.somenteDe?.join(", ")}
            placeholder="em branco = todas"
            className={entrada}
          />
        </Campo>
      </Secao>

      <div className="flex items-center gap-3 border-t border-[#1f1f1f] pt-5">
        <button
          type="submit"
          disabled={pendente}
          className="btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {pendente && <Loader2 size={14} strokeWidth={2.4} className="animate-spin" />}
          Salvar integração
        </button>
        <button
          type="button"
          onClick={onFechar}
          className="rounded-lg border border-[#262626] px-4 py-2.5 text-sm font-semibold text-neutral-300 transition hover:border-neutral-600 hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

const entrada =
  "w-full rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none";

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[15px] font-semibold text-white">{titulo}</h3>
        <p className="mt-0.5 text-[12.5px] text-neutral-500">{descricao}</p>
      </div>
      <div className="space-y-3.5 rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

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
