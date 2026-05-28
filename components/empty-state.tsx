import Link from "next/link";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-[#161616] flex items-center justify-center mb-4">
        <Icon size={20} strokeWidth={1.8} className="text-neutral-500" />
      </div>
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
        {description}
      </p>
      {action && action.href && (
        <Link
          href={action.href}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mt-6"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
