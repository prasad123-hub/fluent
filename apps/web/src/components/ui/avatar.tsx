import { cn } from "@/lib/utils";

export function Avatar({
  name,
  className,
  size = 28,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-[linear-gradient(135deg,#0070f3,#7928ca)] text-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
    >
      <span className="leading-none font-medium">{initials}</span>
    </span>
  );
}
