"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { ImageInput } from "@/components/page-builder/image-input";
import { ACCENT_GRADIENTS } from "@/lib/page-builder-types";
import type {
  Block,
  BlockType,
  BuilderPage,
  CTAData,
  FAQData,
  HeroData,
  ImageData,
  PricingData,
  TestimonialsData,
  TextData,
} from "@/lib/page-builder-types";

/**
 * Versão editável do BlockRenderer.
 *
 * - Textos viram contentEditable inline (click → digita)
 * - Imagens viram dropzone com URL ou upload
 * - Listas (items, plans) ganham botão + ao final pra criar e × pra remover
 *
 * Ao perder foco em qualquer texto, dispara onChange com o data atualizado.
 * O painel da direita (inspector) continua funcionando — é a mesma fonte.
 */

export type EditableProps<T> = {
  data: T;
  onChange: (next: T) => void;
  gradient: string;
  dark: boolean;
};

export function EditableBlockRenderer({
  block,
  onChange,
  gradient,
  dark,
}: {
  block: Block;
  onChange: (data: Block["data"]) => void;
  gradient: string;
  dark: boolean;
}) {
  switch (block.type) {
    case "hero":
      return (
        <EditableHero
          data={block.data}
          onChange={onChange as (d: HeroData) => void}
          gradient={gradient}
          dark={dark}
        />
      );
    case "testimonials":
      return (
        <EditableTestimonials
          data={block.data}
          onChange={onChange as (d: TestimonialsData) => void}
          gradient={gradient}
          dark={dark}
        />
      );
    case "faq":
      return (
        <EditableFAQ
          data={block.data}
          onChange={onChange as (d: FAQData) => void}
          gradient={gradient}
          dark={dark}
        />
      );
    case "cta":
      return (
        <EditableCTA
          data={block.data}
          onChange={onChange as (d: CTAData) => void}
          gradient={gradient}
          dark={dark}
        />
      );
    case "pricing":
      return (
        <EditablePricing
          data={block.data}
          onChange={onChange as (d: PricingData) => void}
          gradient={gradient}
          dark={dark}
        />
      );
    case "text":
      return (
        <EditableTextBlock
          data={block.data}
          onChange={onChange as (d: TextData) => void}
          dark={dark}
        />
      );
    case "image":
      return (
        <EditableImageBlock
          data={block.data}
          onChange={onChange as (d: ImageData) => void}
          dark={dark}
        />
      );
  }
}

// ─── EditableText: contentEditable que respeita caret ─────────────

function EditableText({
  value,
  onChange,
  as = "span",
  className,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (next: string) => void;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  const isEmpty = !value;

  return createElement(as, {
    ref: (node: HTMLElement | null) => {
      ref.current = node;
      if (node && node.textContent !== value) {
        node.textContent = value;
      }
    },
    contentEditable: true,
    suppressContentEditableWarning: true,
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      const text = e.currentTarget.textContent ?? "";
      if (text !== value) onChange(text);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
    },
    className: `${className ?? ""} outline-none focus:ring-2 focus:ring-blue-500/40 rounded-sm cursor-text ${isEmpty ? "min-h-[1em] before:text-neutral-500 before:content-[attr(data-placeholder)]" : ""}`,
    "data-placeholder": placeholder ?? "",
  });
}

// ─── EditableImage: clique abre input inline com URL+upload ───────

function EditableImage({
  value,
  onChange,
  className,
  placeholderClassName,
  placeholderText = "Clique pra adicionar imagem",
  dark,
  alt,
}: {
  value: string;
  onChange: (newSrc: string) => void;
  className?: string;
  placeholderClassName?: string;
  placeholderText?: string;
  dark: boolean;
  alt?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div
        className={`relative inline-block ${dark ? "bg-[#0a0a0a]" : "bg-white"} p-3 rounded-lg ring-2 ring-blue-500/60 z-20`}
        onClick={(e) => e.stopPropagation()}
      >
        <ImageInput value={value} onChange={(v) => onChange(v)} />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-neutral-900 inline-flex items-center justify-center shadow-md hover:bg-neutral-100"
        >
          <X size={12} strokeWidth={2.4} />
        </button>
      </div>
    );
  }

  if (!value) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        className={`${placeholderClassName ?? ""} inline-flex items-center justify-center gap-2 border-2 border-dashed ${dark ? "border-[#1f1f1f] text-neutral-500 hover:border-blue-500/60 hover:text-blue-400" : "border-neutral-300 text-neutral-400 hover:border-blue-500/60 hover:text-blue-600"} rounded-lg p-6 transition`}
      >
        <Plus size={14} strokeWidth={2.4} />
        {placeholderText}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={`${className ?? ""} relative group cursor-pointer block`}
      title="Click pra trocar imagem"
    >
      <img src={value} alt={alt ?? ""} className={className} />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition rounded-[inherit]">
        <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md bg-black/60 transition">
          Trocar imagem
        </span>
      </span>
    </button>
  );
}

// ─── Helpers de gradient pra background (usado em Hero) ────────────

function bgImageStyle(url?: string): React.CSSProperties | undefined {
  if (!url) return undefined;
  return {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url("${url}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

// ─── HERO ──────────────────────────────────────────────────────────

function EditableHero({
  data,
  onChange,
  gradient,
  dark,
}: EditableProps<HeroData>) {
  const alignCenter = data.align === "center";
  const hasBg = !!data.backgroundImage;
  return (
    <section
      className={`relative overflow-hidden ${hasBg ? "min-h-[80vh]" : "py-24 md:py-32"} px-6 ${alignCenter ? "text-center" : "text-left"} flex items-center`}
      style={bgImageStyle(data.backgroundImage)}
    >
      <div className={`max-w-5xl ${alignCenter ? "mx-auto" : ""} relative z-10 w-full`}>
        <EditableText
          as="p"
          value={data.eyebrow ?? ""}
          onChange={(v) => onChange({ ...data, eyebrow: v })}
          placeholder="Eyebrow opcional"
          className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-4 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
        />
        <EditableText
          as="h1"
          value={data.title}
          onChange={(v) => onChange({ ...data, title: v })}
          placeholder="Título principal"
          multiline
          className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] ${hasBg ? "text-white" : ""}`}
        />
        <EditableText
          as="p"
          value={data.subtitle ?? ""}
          onChange={(v) => onChange({ ...data, subtitle: v })}
          placeholder="Subtítulo opcional"
          multiline
          className={`mt-5 text-base md:text-xl ${hasBg ? "text-white/85" : dark ? "text-neutral-400" : "text-neutral-600"} ${alignCenter ? "max-w-2xl mx-auto" : "max-w-2xl"}`}
        />
        {(data.ctaLabel || data.ctaUrl) !== undefined && (
          <div className={`mt-8 ${alignCenter ? "flex justify-center" : ""}`}>
            <EditableText
              as="span"
              value={data.ctaLabel ?? ""}
              onChange={(v) => onChange({ ...data, ctaLabel: v })}
              placeholder="Texto do botão"
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r ${gradient} text-white font-semibold text-sm tracking-wide shadow-2xl`}
            />
          </div>
        )}
        {/* Slot da imagem de fundo: aparece como bloco discreto pra editar quando vazio */}
        {!hasBg && (
          <div className="mt-8 flex justify-center" onClick={(e) => e.stopPropagation()}>
            <EditableImage
              value=""
              onChange={(v) => onChange({ ...data, backgroundImage: v })}
              dark={dark}
              placeholderText="Adicionar imagem de fundo"
            />
          </div>
        )}
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ──────────────────────────────────────────────────

function EditableTestimonials({
  data,
  onChange,
  gradient,
  dark,
}: EditableProps<TestimonialsData>) {
  function updateItem(idx: number, patch: Partial<TestimonialsData["items"][number]>) {
    onChange({
      ...data,
      items: data.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    });
  }
  function removeItem(idx: number) {
    onChange({ ...data, items: data.items.filter((_, i) => i !== idx) });
  }
  function addItem() {
    onChange({
      ...data,
      items: [
        ...data.items,
        { name: "Novo cliente", role: "Profissional", text: "Novo depoimento" },
      ],
    });
  }
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <EditableText
            as="p"
            value={data.eyebrow ?? ""}
            onChange={(v) => onChange({ ...data, eyebrow: v })}
            placeholder="Eyebrow opcional"
            className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
          />
          <EditableText
            as="h2"
            value={data.title ?? ""}
            onChange={(v) => onChange({ ...data, title: v })}
            placeholder="Título da seção"
            className="text-3xl md:text-5xl font-bold tracking-tight"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.items.map((item, i) => (
            <div
              key={i}
              className={`relative group/item ${dark ? "bg-[#0f0f0f] border border-[#1f1f1f]" : "bg-white border border-neutral-200 shadow-sm"} rounded-2xl p-6`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(i);
                }}
                className="opacity-0 group-hover/item:opacity-100 absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-400 text-white inline-flex items-center justify-center transition"
                title="Remover depoimento"
              >
                <X size={11} strokeWidth={2.4} />
              </button>
              <EditableText
                as="p"
                value={item.text}
                onChange={(v) => updateItem(i, { text: v })}
                placeholder="Texto do depoimento"
                multiline
                className={dark ? "text-neutral-200 leading-relaxed" : "text-neutral-700 leading-relaxed"}
              />
              <div className="mt-5 flex items-center gap-3">
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  {item.avatar ? (
                    <EditableImage
                      value={item.avatar}
                      onChange={(v) => updateItem(i, { avatar: v })}
                      className="w-10 h-10 rounded-full object-cover"
                      dark={dark}
                      alt={item.name}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(i, { avatar: "https://" })
                      }
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} inline-flex items-center justify-center text-white text-xs font-bold opacity-70 hover:opacity-100`}
                      title="Adicionar foto"
                    >
                      <Plus size={11} strokeWidth={2.4} />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <EditableText
                    as="p"
                    value={item.name}
                    onChange={(v) => updateItem(i, { name: v })}
                    placeholder="Nome"
                    className="text-sm font-semibold"
                  />
                  <EditableText
                    as="p"
                    value={item.role ?? ""}
                    onChange={(v) => updateItem(i, { role: v })}
                    placeholder="Profissão"
                    className={dark ? "text-xs text-neutral-500" : "text-xs text-neutral-500"}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addItem();
            }}
            className={`${dark ? "border-[#1f1f1f] hover:border-blue-500/60 text-neutral-500 hover:text-blue-400" : "border-neutral-300 hover:border-blue-500/60 text-neutral-500 hover:text-blue-600"} flex items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-6 min-h-[140px] transition text-sm font-semibold`}
          >
            <Plus size={14} strokeWidth={2.4} />
            Adicionar depoimento
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────

function EditableFAQ({
  data,
  onChange,
  gradient,
  dark,
}: EditableProps<FAQData>) {
  function updateItem(idx: number, patch: Partial<FAQData["items"][number]>) {
    onChange({
      ...data,
      items: data.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    });
  }
  function removeItem(idx: number) {
    onChange({ ...data, items: data.items.filter((_, i) => i !== idx) });
  }
  function addItem() {
    onChange({
      ...data,
      items: [...data.items, { question: "Nova pergunta", answer: "Nova resposta" }],
    });
  }
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <EditableText
            as="p"
            value={data.eyebrow ?? ""}
            onChange={(v) => onChange({ ...data, eyebrow: v })}
            placeholder="Eyebrow opcional"
            className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
          />
          <EditableText
            as="h2"
            value={data.title ?? ""}
            onChange={(v) => onChange({ ...data, title: v })}
            placeholder="Título da seção"
            className="text-3xl md:text-5xl font-bold tracking-tight"
          />
        </div>
        <div className="space-y-3">
          {data.items.map((item, i) => (
            <div
              key={i}
              className={`relative group/faq ${dark ? "bg-[#0f0f0f] border border-[#1f1f1f]" : "bg-white border border-neutral-200"} rounded-xl px-5 py-4`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(i);
                }}
                className="opacity-0 group-hover/faq:opacity-100 absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-400 text-white inline-flex items-center justify-center transition"
                title="Remover pergunta"
              >
                <X size={11} strokeWidth={2.4} />
              </button>
              <EditableText
                as="p"
                value={item.question}
                onChange={(v) => updateItem(i, { question: v })}
                placeholder="Pergunta"
                className="font-semibold text-sm md:text-base pr-8"
              />
              <EditableText
                as="p"
                value={item.answer}
                onChange={(v) => updateItem(i, { answer: v })}
                placeholder="Resposta"
                multiline
                className={`mt-3 text-sm leading-relaxed ${dark ? "text-neutral-400" : "text-neutral-600"}`}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addItem();
            }}
            className={`${dark ? "border-[#1f1f1f] hover:border-blue-500/60 text-neutral-500 hover:text-blue-400" : "border-neutral-300 hover:border-blue-500/60 text-neutral-500 hover:text-blue-600"} w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-5 py-4 transition text-sm font-semibold`}
          >
            <Plus size={14} strokeWidth={2.4} />
            Adicionar pergunta
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ───────────────────────────────────────────────────────────

function EditableCTA({
  data,
  onChange,
  gradient,
}: EditableProps<CTAData>) {
  return (
    <section className={`py-20 md:py-28 px-6 bg-gradient-to-br ${gradient} text-white`}>
      <div className="max-w-3xl mx-auto text-center">
        <EditableText
          as="h2"
          value={data.title}
          onChange={(v) => onChange({ ...data, title: v })}
          placeholder="Título"
          multiline
          className="text-3xl md:text-5xl font-bold tracking-tight"
        />
        <EditableText
          as="p"
          value={data.subtitle ?? ""}
          onChange={(v) => onChange({ ...data, subtitle: v })}
          placeholder="Subtítulo opcional"
          multiline
          className="mt-4 text-base md:text-lg text-white/90"
        />
        <div className="mt-8 flex justify-center">
          <EditableText
            as="span"
            value={data.ctaLabel}
            onChange={(v) => onChange({ ...data, ctaLabel: v })}
            placeholder="Texto do botão"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-neutral-900 font-bold text-sm tracking-wide shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ───────────────────────────────────────────────────────

function EditablePricing({
  data,
  onChange,
  gradient,
  dark,
}: EditableProps<PricingData>) {
  function updatePlan(idx: number, patch: Partial<PricingData["plans"][number]>) {
    onChange({
      ...data,
      plans: data.plans.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    });
  }
  function removePlan(idx: number) {
    onChange({ ...data, plans: data.plans.filter((_, i) => i !== idx) });
  }
  function addPlan() {
    onChange({
      ...data,
      plans: [
        ...data.plans,
        {
          name: "Novo plano",
          price: "R$ 0",
          features: ["Feature 1"],
          ctaLabel: "Quero",
          ctaUrl: "#",
        },
      ],
    });
  }
  function updateFeature(planIdx: number, featIdx: number, value: string) {
    const features = [...data.plans[planIdx].features];
    features[featIdx] = value;
    updatePlan(planIdx, { features });
  }
  function removeFeature(planIdx: number, featIdx: number) {
    updatePlan(planIdx, {
      features: data.plans[planIdx].features.filter((_, i) => i !== featIdx),
    });
  }
  function addFeature(planIdx: number) {
    updatePlan(planIdx, {
      features: [...data.plans[planIdx].features, "Nova feature"],
    });
  }

  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <EditableText
            as="p"
            value={data.eyebrow ?? ""}
            onChange={(v) => onChange({ ...data, eyebrow: v })}
            placeholder="Eyebrow opcional"
            className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
          />
          <EditableText
            as="h2"
            value={data.title ?? ""}
            onChange={(v) => onChange({ ...data, title: v })}
            placeholder="Título da seção"
            className="text-3xl md:text-5xl font-bold tracking-tight"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {data.plans.map((plan, i) => {
            const planClass = plan.highlight
              ? `bg-gradient-to-br ${gradient} text-white shadow-2xl md:scale-[1.03]`
              : dark
              ? "bg-[#0f0f0f] border border-[#1f1f1f]"
              : "bg-white border border-neutral-200 shadow-sm";
            return (
              <div
                key={i}
                className={`group/plan relative rounded-2xl p-7 flex flex-col ${planClass}`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePlan(i);
                  }}
                  className="opacity-0 group-hover/plan:opacity-100 absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-400 text-white inline-flex items-center justify-center transition"
                  title="Remover plano"
                >
                  <X size={11} strokeWidth={2.4} />
                </button>
                <EditableText
                  as="h3"
                  value={plan.name}
                  onChange={(v) => updatePlan(i, { name: v })}
                  placeholder="Nome do plano"
                  className="text-xl font-bold"
                />
                <div className="mt-4 flex items-baseline gap-2">
                  <EditableText
                    as="span"
                    value={plan.price}
                    onChange={(v) => updatePlan(i, { price: v })}
                    placeholder="R$ 0"
                    className="text-4xl font-extrabold tracking-tight"
                  />
                  <EditableText
                    as="span"
                    value={plan.period ?? ""}
                    onChange={(v) => updatePlan(i, { period: v })}
                    placeholder="período"
                    className={`text-sm ${plan.highlight ? "text-white/80" : "text-neutral-500"}`}
                  />
                </div>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((f, j) => (
                    <li
                      key={j}
                      className={`group/feat flex items-start gap-2.5 text-sm leading-relaxed ${
                        plan.highlight
                          ? "text-white/95"
                          : dark
                          ? "text-neutral-300"
                          : "text-neutral-700"
                      }`}
                    >
                      <span
                        className={`shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center text-[10px] font-bold ${
                          plan.highlight ? "bg-white/25 text-white" : `bg-gradient-to-br ${gradient} text-white`
                        }`}
                      >
                        ✓
                      </span>
                      <EditableText
                        as="span"
                        value={f}
                        onChange={(v) => updateFeature(i, j, v)}
                        placeholder="Feature"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFeature(i, j);
                        }}
                        className="opacity-0 group-hover/feat:opacity-100 w-4 h-4 rounded-full text-rose-400 hover:text-rose-300 transition shrink-0"
                        title="Remover feature"
                      >
                        <X size={11} strokeWidth={2.4} />
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addFeature(i);
                      }}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${plan.highlight ? "text-white/80 hover:text-white" : "text-neutral-500 hover:text-blue-500"} transition`}
                    >
                      <Plus size={11} strokeWidth={2.4} />
                      Adicionar feature
                    </button>
                  </li>
                </ul>
                <EditableText
                  as="span"
                  value={plan.ctaLabel}
                  onChange={(v) => updatePlan(i, { ctaLabel: v })}
                  placeholder="Botão"
                  className={`mt-7 inline-flex items-center justify-center px-5 py-3 rounded-full font-semibold text-sm tracking-wide ${
                    plan.highlight
                      ? "bg-white text-neutral-900"
                      : `bg-gradient-to-r ${gradient} text-white`
                  }`}
                />
              </div>
            );
          })}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addPlan();
            }}
            className={`${dark ? "border-[#1f1f1f] hover:border-blue-500/60 text-neutral-500 hover:text-blue-400" : "border-neutral-300 hover:border-blue-500/60 text-neutral-500 hover:text-blue-600"} flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-7 min-h-[280px] transition text-sm font-semibold`}
          >
            <Plus size={14} strokeWidth={2.4} />
            Adicionar plano
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── TEXT BLOCK ────────────────────────────────────────────────────

function EditableTextBlock({
  data,
  onChange,
  dark,
}: {
  data: TextData;
  onChange: (d: TextData) => void;
  dark: boolean;
}) {
  return (
    <section className={`py-12 md:py-16 px-6 ${data.align === "center" ? "text-center" : ""}`}>
      <div className="max-w-3xl mx-auto">
        <EditableText
          as="div"
          value={data.content}
          onChange={(v) => onChange({ ...data, content: v })}
          placeholder="Escreva seu texto aqui"
          multiline
          className={`text-base md:text-lg leading-relaxed whitespace-pre-wrap ${dark ? "text-neutral-300" : "text-neutral-700"}`}
        />
      </div>
    </section>
  );
}

// ─── IMAGE BLOCK ───────────────────────────────────────────────────

function EditableImageBlock({
  data,
  onChange,
  dark,
}: {
  data: ImageData;
  onChange: (d: ImageData) => void;
  dark: boolean;
}) {
  return (
    <section className="py-12 md:py-16 px-6">
      <div className="max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
        {data.src ? (
          <figure>
            <EditableImage
              value={data.src}
              onChange={(v) => onChange({ ...data, src: v })}
              className="w-full rounded-2xl"
              dark={dark}
              alt={data.alt}
            />
            <figcaption className="mt-3 text-center text-sm text-neutral-500">
              <EditableText
                as="span"
                value={data.caption ?? ""}
                onChange={(v) => onChange({ ...data, caption: v })}
                placeholder="Legenda opcional"
              />
            </figcaption>
          </figure>
        ) : (
          <EditableImage
            value=""
            onChange={(v) => onChange({ ...data, src: v })}
            dark={dark}
            placeholderClassName="w-full aspect-[16/9]"
            placeholderText="Adicionar imagem"
          />
        )}
      </div>
    </section>
  );
}

// ─── Re-export pra typing externa ─────────────────────────────────

export type EditableBlockProps = {
  page: BuilderPage;
  selectedId: string | null;
  onChange: (page: BuilderPage) => void;
};

export const _typeRef: BlockType = "hero"; // só pra evitar TS sobre import unused
