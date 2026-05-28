import {
  Eye,
  Sparkles,
  Droplet,
  Pencil,
  Brush,
  Palette,
  Camera,
  Heart,
  Award,
  BookOpen,
  Crown,
  Star,
  Wand2,
  Aperture,
} from "lucide-react";

type IconDef = {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

const INNER_ICONS: IconDef[] = [
  { Icon: Eye },
  { Icon: Sparkles },
  { Icon: Droplet },
  { Icon: Pencil },
  { Icon: Brush },
  { Icon: Heart },
];

const OUTER_ICONS: IconDef[] = [
  { Icon: Palette },
  { Icon: Camera },
  { Icon: Award },
  { Icon: BookOpen },
  { Icon: Crown },
  { Icon: Star },
  { Icon: Wand2 },
  { Icon: Aperture },
];

const STAGE_SIZE = 1100;
const RING_INNER = 400;
const RING_OUTER = 540;

export function OrbitIcons() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div
        className="relative"
        style={{
          width: STAGE_SIZE,
          height: STAGE_SIZE,
          maxWidth: "95vw",
          maxHeight: "95vw",
        }}
      >
        <Ring
          icons={INNER_ICONS}
          radius={RING_INNER}
          spinClass="ring-spin-slow"
        />
        <Ring
          icons={OUTER_ICONS}
          radius={RING_OUTER}
          spinClass="ring-spin-reverse"
        />
      </div>
    </div>
  );
}

function Ring({
  icons,
  radius,
  spinClass,
}: {
  icons: IconDef[];
  radius: number;
  spinClass: string;
}) {
  return (
    <div className={`absolute inset-0 ${spinClass}`}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`-${STAGE_SIZE / 2} -${STAGE_SIZE / 2} ${STAGE_SIZE} ${STAGE_SIZE}`}
      >
        <circle
          cx="0"
          cy="0"
          r={radius}
          fill="none"
          stroke="#1f1f1f"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
      </svg>

      {icons.map((_, i) => {
        const step = 360 / icons.length;
        const angle = step * i;
        const rad = ((angle - 90) * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        const { Icon } = icons[i];
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}
          >
            <div className="icon-counter w-14 h-14 rounded-full flex items-center justify-center bg-[#0f0f0f] border border-[#1f1f1f] shadow-[0_0_24px_rgba(0,0,0,0.5)]">
              <Icon size={20} strokeWidth={1.6} className="text-neutral-300" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
