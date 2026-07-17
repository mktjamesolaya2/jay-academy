import "server-only";
import {
  ACCENT_GRADIENTS,
  type Block,
  type BuilderPage,
  type CTAData,
  type FAQData,
  type HeroData,
  type ImageData,
  type PricingData,
  type TestimonialsData,
  type TextData,
} from "./page-builder-types";

/**
 * Renderer HTML puro pra rota pública /p/[slug].
 * Next 16 bloqueia react-dom/server dentro de route handlers, então o
 * renderer público é template literal TS. O preview do editor usa o
 * renderer React editável (components/page-builder/editable-renderer.tsx).
 *
 * Saída: string HTML pronta pra inserir como body.
 */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function attr(value: string | undefined): string {
  return value ? esc(value) : "";
}

export function renderBuilderPageHtml(page: BuilderPage): string {
  const gradient = ACCENT_GRADIENTS[page.theme.accent];
  const dark = page.theme.darkMode;

  if (page.blocks.length === 0) {
    return `<main class="${dark ? "min-h-screen bg-[#0a0a0a] text-white" : "min-h-screen bg-white text-neutral-900"}">
${emptyHeroHtml(gradient, dark)}
</main>`;
  }

  const blocksHtml = page.blocks
    .map((block) => renderBlockHtml(block, gradient, dark))
    .join("\n");

  return `<main class="${dark ? "min-h-screen bg-[#0a0a0a] text-white" : "min-h-screen bg-white text-neutral-900"}">
${blocksHtml}
</main>`;
}

function emptyHeroHtml(gradient: string, dark: boolean): string {
  return `<section class="py-32 px-6 text-center">
  <p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-4 bg-gradient-to-r ${gradient} bg-clip-text text-transparent">Página em branco</p>
  <h1 class="text-4xl md:text-6xl font-bold tracking-tight mb-4">Comece adicionando blocos</h1>
  <p class="${dark ? "text-neutral-400 max-w-md mx-auto" : "text-neutral-600 max-w-md mx-auto"}">Abra o editor pra adicionar Hero, Depoimentos, FAQ, CTA, Preços e mais.</p>
</section>`;
}

function renderBlockHtml(block: Block, gradient: string, dark: boolean): string {
  switch (block.type) {
    case "hero":
      return heroHtml(block.data, gradient, dark);
    case "testimonials":
      return testimonialsHtml(block.data, gradient, dark);
    case "faq":
      return faqHtml(block.data, gradient, dark);
    case "cta":
      return ctaHtml(block.data, gradient);
    case "pricing":
      return pricingHtml(block.data, gradient, dark);
    case "text":
      return textHtml(block.data, dark);
    case "image":
      return imageHtml(block.data, dark);
  }
}

function heroHtml(data: HeroData, gradient: string, dark: boolean): string {
  const alignCenter = data.align === "center";
  const hasBg = !!data.backgroundImage;
  const sectionStyle = hasBg
    ? `style="background-image:linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url('${attr(data.backgroundImage)}'); background-size:cover; background-position:center;"`
    : "";
  return `<section class="relative overflow-hidden ${hasBg ? "min-h-[80vh]" : "py-24 md:py-32"} px-6 ${alignCenter ? "text-center" : "text-left"} flex items-center" ${sectionStyle}>
  <div class="max-w-5xl ${alignCenter ? "mx-auto" : ""} relative z-10">
    ${data.eyebrow ? `<p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-4 bg-gradient-to-r ${gradient} bg-clip-text text-transparent">${esc(data.eyebrow)}</p>` : ""}
    <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] ${hasBg ? "text-white" : ""}" style="text-wrap:balance;">${esc(data.title)}</h1>
    ${data.subtitle ? `<p class="mt-5 text-base md:text-xl ${hasBg ? "text-white/85" : dark ? "text-neutral-400" : "text-neutral-600"} ${alignCenter ? "max-w-2xl mx-auto" : "max-w-2xl"}" style="text-wrap:balance;">${esc(data.subtitle)}</p>` : ""}
    ${
      data.ctaLabel && data.ctaUrl
        ? `<div class="mt-8 ${alignCenter ? "flex justify-center" : ""}">
        <a href="${attr(data.ctaUrl)}" class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r ${gradient} text-white font-semibold text-sm tracking-wide shadow-2xl hover:opacity-95 transition">${esc(data.ctaLabel)}</a>
      </div>`
        : ""
    }
  </div>
</section>`;
}

function testimonialsHtml(
  data: TestimonialsData,
  gradient: string,
  dark: boolean
): string {
  const items = data.items
    .map(
      (item) => `<div class="${dark ? "bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-6" : "bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"}">
      <p class="${dark ? "text-neutral-200 leading-relaxed" : "text-neutral-700 leading-relaxed"}">&ldquo;${esc(item.text)}&rdquo;</p>
      <div class="mt-5 flex items-center gap-3">
        ${
          item.avatar
            ? `<img src="${attr(item.avatar)}" alt="${attr(item.name)}" class="w-10 h-10 rounded-full object-cover" />`
            : `<div class="w-10 h-10 rounded-full bg-gradient-to-br ${gradient}"></div>`
        }
        <div>
          <p class="text-sm font-semibold">${esc(item.name)}</p>
          ${item.role ? `<p class="text-xs text-neutral-500">${esc(item.role)}</p>` : ""}
        </div>
      </div>
    </div>`
    )
    .join("");
  return `<section class="py-20 md:py-28 px-6">
  <div class="max-w-6xl mx-auto">
    ${
      data.eyebrow || data.title
        ? `<div class="text-center mb-12">
        ${data.eyebrow ? `<p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent">${esc(data.eyebrow)}</p>` : ""}
        ${data.title ? `<h2 class="text-3xl md:text-5xl font-bold tracking-tight">${esc(data.title)}</h2>` : ""}
      </div>`
        : ""
    }
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">${items}</div>
  </div>
</section>`;
}

function faqHtml(data: FAQData, gradient: string, dark: boolean): string {
  const items = data.items
    .map(
      (item) => `<details class="${dark ? "group bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-5 py-4 open:bg-[#121212]" : "group bg-white border border-neutral-200 rounded-xl px-5 py-4 open:bg-neutral-50"}">
      <summary class="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-sm md:text-base">
        <span>${esc(item.question)}</span>
        <span class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${dark ? "bg-[#1f1f1f]" : "bg-neutral-100"} group-open:rotate-45 transition-transform">+</span>
      </summary>
      <p class="mt-3 text-sm leading-relaxed ${dark ? "text-neutral-400" : "text-neutral-600"}">${esc(item.answer)}</p>
    </details>`
    )
    .join("");
  return `<section class="py-20 md:py-28 px-6">
  <div class="max-w-3xl mx-auto">
    ${
      data.eyebrow || data.title
        ? `<div class="text-center mb-10">
        ${data.eyebrow ? `<p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent">${esc(data.eyebrow)}</p>` : ""}
        ${data.title ? `<h2 class="text-3xl md:text-5xl font-bold tracking-tight">${esc(data.title)}</h2>` : ""}
      </div>`
        : ""
    }
    <div class="space-y-3">${items}</div>
  </div>
</section>`;
}

function ctaHtml(data: CTAData, gradient: string): string {
  return `<section class="py-20 md:py-28 px-6 bg-gradient-to-br ${gradient} text-white">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="text-3xl md:text-5xl font-bold tracking-tight" style="text-wrap:balance;">${esc(data.title)}</h2>
    ${data.subtitle ? `<p class="mt-4 text-base md:text-lg text-white/90" style="text-wrap:balance;">${esc(data.subtitle)}</p>` : ""}
    <div class="mt-8 flex justify-center">
      <a href="${attr(data.ctaUrl)}" class="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-neutral-900 font-bold text-sm tracking-wide shadow-2xl hover:bg-neutral-100 transition">${esc(data.ctaLabel)}</a>
    </div>
  </div>
</section>`;
}

function pricingHtml(data: PricingData, gradient: string, dark: boolean): string {
  const plans = data.plans
    .map((plan) => {
      const planClass = plan.highlight
        ? `bg-gradient-to-br ${gradient} text-white shadow-2xl md:scale-[1.03]`
        : dark
        ? "bg-[#0f0f0f] border border-[#1f1f1f]"
        : "bg-white border border-neutral-200 shadow-sm";
      const features = plan.features
        .map(
          (f) =>
            `<li class="flex items-start gap-2.5 text-sm leading-relaxed ${
              plan.highlight
                ? "text-white/95"
                : dark
                ? "text-neutral-300"
                : "text-neutral-700"
            }">
            <span class="shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center text-[10px] font-bold ${
              plan.highlight ? "bg-white/25 text-white" : `bg-gradient-to-br ${gradient} text-white`
            }">✓</span>
            ${esc(f)}
          </li>`
        )
        .join("");
      return `<div class="rounded-2xl p-7 flex flex-col ${planClass}">
        ${plan.highlight ? `<p class="text-[10px] uppercase tracking-[0.2em] font-bold mb-3 opacity-90">Mais escolhido</p>` : ""}
        <h3 class="text-xl font-bold">${esc(plan.name)}</h3>
        <div class="mt-4 flex items-baseline gap-2">
          <span class="text-4xl font-extrabold tracking-tight">${esc(plan.price)}</span>
          ${plan.period ? `<span class="text-sm ${plan.highlight ? "text-white/80" : "text-neutral-500"}">${esc(plan.period)}</span>` : ""}
        </div>
        <ul class="mt-6 space-y-2.5 flex-1">${features}</ul>
        <a href="${attr(plan.ctaUrl)}" class="mt-7 inline-flex items-center justify-center px-5 py-3 rounded-full font-semibold text-sm tracking-wide transition ${
          plan.highlight
            ? "bg-white text-neutral-900 hover:bg-neutral-100"
            : `bg-gradient-to-r ${gradient} text-white hover:opacity-95`
        }">${esc(plan.ctaLabel)}</a>
      </div>`;
    })
    .join("");
  return `<section class="py-20 md:py-28 px-6">
  <div class="max-w-6xl mx-auto">
    ${
      data.eyebrow || data.title
        ? `<div class="text-center mb-12">
        ${data.eyebrow ? `<p class="text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent">${esc(data.eyebrow)}</p>` : ""}
        ${data.title ? `<h2 class="text-3xl md:text-5xl font-bold tracking-tight">${esc(data.title)}</h2>` : ""}
      </div>`
        : ""
    }
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">${plans}</div>
  </div>
</section>`;
}

function textHtml(data: TextData, dark: boolean): string {
  return `<section class="py-12 md:py-16 px-6 ${data.align === "center" ? "text-center" : ""}">
  <div class="max-w-3xl mx-auto">
    <div class="text-base md:text-lg leading-relaxed ${dark ? "text-neutral-300" : "text-neutral-700"} space-y-4">${renderMarkdownToHtml(data.content)}</div>
  </div>
</section>`;
}

function imageHtml(data: ImageData, dark: boolean): string {
  if (!data.src) {
    return `<section class="py-12 md:py-16 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="aspect-[16/9] rounded-2xl border-2 border-dashed flex items-center justify-center text-sm ${dark ? "border-[#1f1f1f] text-neutral-600" : "border-neutral-300 text-neutral-400"}">(sem imagem ainda — adicione no editor)</div>
      </div>
    </section>`;
  }
  return `<section class="py-12 md:py-16 px-6">
    <div class="max-w-4xl mx-auto">
      <figure>
        <img src="${attr(data.src)}" alt="${attr(data.alt)}" class="w-full rounded-2xl" />
        ${data.caption ? `<figcaption class="mt-3 text-center text-sm text-neutral-500">${esc(data.caption)}</figcaption>` : ""}
      </figure>
    </div>
  </section>`;
}

function renderMarkdownToHtml(input: string): string {
  const lines = input.split("\n");
  const parts: string[] = [];
  let paraBuf: string[] = [];

  const flushParagraph = () => {
    if (paraBuf.length === 0) return;
    parts.push(`<p>${inlineMarkdown(paraBuf.join(" "))}</p>`);
    paraBuf = [];
  };

  for (const line of lines) {
    if (line.startsWith("### ")) {
      flushParagraph();
      parts.push(`<h3 class="text-xl font-bold mt-6 mb-2">${inlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flushParagraph();
      parts.push(`<h2 class="text-2xl font-bold mt-8 mb-3">${inlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      paraBuf.push(line);
    }
  }
  flushParagraph();
  return parts.join("");
}

function inlineMarkdown(text: string): string {
  // Escape first then re-insert tokens. Safer than parsing raw.
  let html = esc(text);
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline hover:no-underline">$1</a>'
  );
  return html;
}
