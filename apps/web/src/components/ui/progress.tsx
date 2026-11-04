import { cn } from "@/lib/utils";

export function Progress({
  value,
  max = 100,
  className,
  tone = "default",
  size = "md",
}: {
  value: number;
  max?: number;
  className?: string;
  tone?: "default" | "blue" | "green" | "amber" | "red";
  size?: "sm" | "md";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bar = {
    default: "bg-foreground",
    blue: "bg-blue-700",
    green: "bg-green-700",
    amber: "bg-amber-700",
    red: "bg-red-700",
  }[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-gray-300",
        size === "md" ? "h-2" : "h-1",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-ds", bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
