import type {
  Block,
  BuilderPage,
  CTAData,
  FAQData,
  HeroData,
  ImageData,
  PricingData,
  TestimonialsData,
  TextData,
} from "@/lib/page-builder-types";
import { ACCENT_GRADIENTS } from "@/lib/page-builder-types";

/**
 * Renderer público das páginas builder — Server Components puros.
 * Usado em /p/[slug] e dentro do preview do editor.
 */

export function BuilderPageRenderer({ page }: { page: BuilderPage }) {
  const gradient = ACCENT_GRADIENTS[page.theme.accent];
  return (
    <main
      className={
        page.theme.darkMode
          ? "min-h-screen bg-[#0a0a0a] text-white"
          : "min-h-screen bg-white text-neutral-900"
      }
    >
      {page.blocks.length === 0 ? (
        <EmptyHero gradient={gradient} dark={page.theme.darkMode} />
      ) : (
        page.blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            gradient={gradient}
            dark={page.theme.darkMode}
          />
        ))
      )}
    </main>
  );
}

function EmptyHero({ gradient, dark }: { gradient: string; dark: boolean }) {
  return (
    <section className="py-32 px-6 text-center">
      <p
        className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-4 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
      >
        Página em branco
      </p>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
        Comece adicionando blocos
      </h1>
      <p className={dark ? "text-neutral-400 max-w-md mx-auto" : "text-neutral-600 max-w-md mx-auto"}>
        Abra o editor pra adicionar Hero, Depoimentos, FAQ, CTA, Preços e mais.
      </p>
    </section>
  );
}

export function BlockRenderer({
  block,
  gradient,
  dark,
}: {
  block: Block;
  gradient: string;
  dark: boolean;
}) {
  switch (block.type) {
    case "hero":
      return <HeroBlock data={block.data} gradient={gradient} dark={dark} />;
    case "testimonials":
      return <TestimonialsBlock data={block.data} gradient={gradient} dark={dark} />;
    case "faq":
      return <FAQBlock data={block.data} gradient={gradient} dark={dark} />;
    case "cta":
      return <CTABlock data={block.data} gradient={gradient} />;
    case "pricing":
      return <PricingBlock data={block.data} gradient={gradient} dark={dark} />;
    case "text":
      return <TextBlock data={block.data} dark={dark} />;
    case "image":
      return <ImageBlock data={block.data} dark={dark} />;
  }
}

function HeroBlock({
  data,
  gradient,
  dark,
}: {
  data: HeroData;
  gradient: string;
  dark: boolean;
}) {
  const alignCenter = data.align === "center";
  const hasBg = !!data.backgroundImage;
  return (
    <section
      className={`relative overflow-hidden ${hasBg ? "min-h-[80vh]" : "py-24 md:py-32"} px-6 ${alignCenter ? "text-center" : "text-left"} flex items-center`}
      style={
        hasBg
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url("${data.backgroundImage}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className={`max-w-5xl ${alignCenter ? "mx-auto" : ""} relative z-10`}>
        {data.eyebrow && (
          <p
            className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-4 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
          >
            {data.eyebrow}
          </p>
        )}
        <h1
          className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] ${hasBg ? "text-white" : ""}`}
          style={{ textWrap: "balance" }}
        >
          {data.title}
        </h1>
        {data.subtitle && (
          <p
            className={`mt-5 text-base md:text-xl ${hasBg ? "text-white/85" : dark ? "text-neutral-400" : "text-neutral-600"} ${alignCenter ? "max-w-2xl mx-auto" : "max-w-2xl"}`}
            style={{ textWrap: "balance" }}
          >
            {data.subtitle}
          </p>
        )}
        {data.ctaLabel && data.ctaUrl && (
          <div className={`mt-8 ${alignCenter ? "flex justify-center" : ""}`}>
            <a
              href={data.ctaUrl}
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r ${gradient} text-white font-semibold text-sm tracking-wide shadow-2xl hover:opacity-95 transition`}
            >
              {data.ctaLabel}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialsBlock({
  data,
  gradient,
  dark,
}: {
  data: TestimonialsData;
  gradient: string;
  dark: boolean;
}) {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {(data.eyebrow || data.title) && (
          <div className="text-center mb-12">
            {data.eyebrow && (
              <p
                className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
              >
                {data.eyebrow}
              </p>
            )}
            {data.title && (
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                {data.title}
              </h2>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.items.map((item, i) => (
            <div
              key={i}
              className={
                dark
                  ? "bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-6"
                  : "bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"
              }
            >
              <p
                className={dark ? "text-neutral-200 leading-relaxed" : "text-neutral-700 leading-relaxed"}
              >
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                {item.avatar ? (
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient}`}
                  />
                )}
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  {item.role && (
                    <p
                      className={dark ? "text-xs text-neutral-500" : "text-xs text-neutral-500"}
                    >
                      {item.role}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQBlock({
  data,
  gradient,
  dark,
}: {
  data: FAQData;
  gradient: string;
  dark: boolean;
}) {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        {(data.eyebrow || data.title) && (
          <div className="text-center mb-10">
            {data.eyebrow && (
              <p
                className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
              >
                {data.eyebrow}
              </p>
            )}
            {data.title && (
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                {data.title}
              </h2>
            )}
          </div>
        )}
        <div className="space-y-3">
          {data.items.map((item, i) => (
            <details
              key={i}
              className={
                dark
                  ? "group bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl px-5 py-4 open:bg-[#121212]"
                  : "group bg-white border border-neutral-200 rounded-xl px-5 py-4 open:bg-neutral-50"
              }
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-sm md:text-base">
                <span>{item.question}</span>
                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${dark ? "bg-[#1f1f1f]" : "bg-neutral-100"} group-open:rotate-45 transition-transform`}
                >
                  +
                </span>
              </summary>
              <p
                className={`mt-3 text-sm leading-relaxed ${dark ? "text-neutral-400" : "text-neutral-600"}`}
              >
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABlock({ data, gradient }: { data: CTAData; gradient: string }) {
  return (
    <section className={`py-20 md:py-28 px-6 bg-gradient-to-br ${gradient} text-white`}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight" style={{ textWrap: "balance" }}>
          {data.title}
        </h2>
        {data.subtitle && (
          <p className="mt-4 text-base md:text-lg text-white/90" style={{ textWrap: "balance" }}>
            {data.subtitle}
          </p>
        )}
        <div className="mt-8 flex justify-center">
          <a
            href={data.ctaUrl}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-neutral-900 font-bold text-sm tracking-wide shadow-2xl hover:bg-neutral-100 transition"
          >
            {data.ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}

function PricingBlock({
  data,
  gradient,
  dark,
}: {
  data: PricingData;
  gradient: string;
  dark: boolean;
}) {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {(data.eyebrow || data.title) && (
          <div className="text-center mb-12">
            {data.eyebrow && (
              <p
                className={`text-[11px] uppercase tracking-[0.2em] font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
              >
                {data.eyebrow}
              </p>
            )}
            {data.title && (
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                {data.title}
              </h2>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {data.plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl p-7 flex flex-col ${
                plan.highlight
                  ? `bg-gradient-to-br ${gradient} text-white shadow-2xl md:scale-[1.03]`
                  : dark
                  ? "bg-[#0f0f0f] border border-[#1f1f1f]"
                  : "bg-white border border-neutral-200 shadow-sm"
              }`}
            >
              {plan.highlight && (
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3 opacity-90">
                  Mais escolhido
                </p>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                {plan.period && (
                  <span className={`text-sm ${plan.highlight ? "text-white/80" : dark ? "text-neutral-500" : "text-neutral-500"}`}>
                    {plan.period}
                  </span>
                )}
              </div>
              <ul className="mt-6 space-y-2.5 flex-1">
                {plan.features.map((f, j) => (
                  <li
                    key={j}
                    className={`flex items-start gap-2.5 text-sm leading-relaxed ${
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
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaUrl}
                className={`mt-7 inline-flex items-center justify-center px-5 py-3 rounded-full font-semibold text-sm tracking-wide transition ${
                  plan.highlight
                    ? "bg-white text-neutral-900 hover:bg-neutral-100"
                    : `bg-gradient-to-r ${gradient} text-white hover:opacity-95`
                }`}
              >
                {plan.ctaLabel}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TextBlock({ data, dark }: { data: TextData; dark: boolean }) {
  return (
    <section className={`py-12 md:py-16 px-6 ${data.align === "center" ? "text-center" : ""}`}>
      <div className="max-w-3xl mx-auto">
        <div
          className={`text-base md:text-lg leading-relaxed whitespace-pre-wrap ${dark ? "text-neutral-300" : "text-neutral-700"}`}
        >
          {renderMarkdown(data.content)}
        </div>
      </div>
    </section>
  );
}

function ImageBlock({ data, dark }: { data: ImageData; dark: boolean }) {
  return (
    <section className="py-12 md:py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {data.src ? (
          <figure>
            <img
              src={data.src}
              alt={data.alt || ""}
              className="w-full rounded-2xl"
            />
            {data.caption && (
              <figcaption
                className={`mt-3 text-center text-sm ${dark ? "text-neutral-500" : "text-neutral-500"}`}
              >
                {data.caption}
              </figcaption>
            )}
          </figure>
        ) : (
          <div
            className={`aspect-[16/9] rounded-2xl border-2 border-dashed flex items-center justify-center text-sm ${dark ? "border-[#1f1f1f] text-neutral-600" : "border-neutral-300 text-neutral-400"}`}
          >
            (sem imagem ainda — adicione no editor)
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Markdown super simples — só pra texto livre. Suporta:
 * - **bold**, _italic_, [link](url), ## h2, ### h3, parágrafos
 * Mais que isso, usar blocos específicos.
 */
function renderMarkdown(input: string): React.ReactNode {
  const lines = input.split("\n");
  const elements: React.ReactNode[] = [];
  let paraBuf: string[] = [];

  const flushParagraph = (key: string) => {
    if (paraBuf.length === 0) return;
    const text = paraBuf.join(" ");
    paraBuf = [];
    elements.push(<p key={key}>{inline(text)}</p>);
  };

  lines.forEach((line, i) => {
    if (line.startsWith("### ")) {
      flushParagraph(`p-${i}`);
      elements.push(
        <h3 key={i} className="text-xl font-bold mt-6 mb-2">
          {inline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushParagraph(`p-${i}`);
      elements.push(
        <h2 key={i} className="text-2xl font-bold mt-8 mb-3">
          {inline(line.slice(3))}
        </h2>
      );
    } else if (line.trim() === "") {
      flushParagraph(`p-${i}`);
    } else {
      paraBuf.push(line);
    }
  });
  flushParagraph(`p-final`);

  return <div className="space-y-4">{elements}</div>;
}

function inline(text: string): React.ReactNode {
  // Bold **x**, italic _x_, link [text](url)
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  const tokenRegex = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/;
  while (rest.length > 0) {
    const m = rest.match(tokenRegex);
    if (!m) {
      parts.push(rest);
      break;
    }
    const idx = m.index ?? 0;
    if (idx > 0) parts.push(rest.slice(0, idx));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++}>{token.slice(2, -2)}</strong>
      );
    } else if (token.startsWith("_")) {
      parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    } else {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    rest = rest.slice(idx + token.length);
  }
  return parts;
}
